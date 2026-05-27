from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user import UserRepository
from app.schemas.auth_schemas import TokenResponse
from app.schemas.user import UserCreate

from .utils import verify_password_reset_token
from app.core import security

class AuthService:
    def __init__(self, db: AsyncSession):
        self._repo = UserRepository(db)
        
    async def login_with_password(self, email: str, password: str) -> TokenResponse:
        """_summary_

        Args:
            email (str): user's email
            password (str): user's password

        Raises:
            HTTPException: status_code=404 if password or email is incorrect

        Returns:
            TokenResponse: return tokens pair(access/refresh token)
        """
        user = await self._repo.get_by_email(email=email)
        
        if not user:
            raise HTTPException(status_code=401, detail="Incorrect password or email")
        
        is_verified, new_hash = security.verify_password(password, user.hashed_password)
        
        if not is_verified:
            raise HTTPException(status_code=401, detail="Incorrect password or email")
        
        # If need to update hash of password, but password is a same
        if new_hash:
            await self._repo.update_password(user, new_hash)
            
        access_token = security.create_access_token(user.id)
        refresh_token = security.create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
            
    async def reset_password(self, token: str, new_password: str) -> None:
        email = verify_password_reset_token(token)
        if not email:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        user = await self._repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        hashed_password = security.hash_password(new_password)
        await self._repo.update_password(user, hashed_password)
        
    async def register(self, user: UserCreate):
        existing_user = await self._repo.get_by_email(user.email)
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")     
        
        hashed_pwd = security.hash_password(user.password)
        
        new_user = await self._repo.create_user(user_in=user, hashed_password=hashed_pwd)
        return new_user   