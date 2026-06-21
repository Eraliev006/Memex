from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import UserRepository
from app.schemas import LoginWithPasswordRequest, TokenResponse, UserCreate, UserResponse, ResetPasswordRequest
from app.core import security
from .utils import verify_password_reset_token


class AuthService:
    def __init__(self, db: AsyncSession):
        self._db = db
        self._repo = UserRepository(db)

    async def login_with_password(self, data: LoginWithPasswordRequest) -> TokenResponse:
        user = await self._repo.get_by_email(email=data.email)

        if not user:
            raise HTTPException(status_code=401, detail="Incorrect password or email")

        is_verified, new_hash = security.verify_password(data.password, user.hashed_password)

        if not is_verified:
            raise HTTPException(status_code=401, detail="Incorrect password or email")

        if new_hash:
            await self._repo.update_password(user, new_hash)
            await self._db.commit()

        access_token = security.create_access_token(user.id)
        refresh_token = security.create_refresh_token(user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )

    async def reset_password(self, data: ResetPasswordRequest) -> None:
        email = verify_password_reset_token(data.token)
        if not email:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        user = await self._repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        hashed_password = security.hash_password(data.new_password)
        await self._repo.update_password(user, hashed_password)
        await self._db.commit()

    async def register(self, user: UserCreate) -> UserResponse:
        existing_user = await self._repo.get_by_email(user.email)

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pwd = security.hash_password(user.password)
        new_user = await self._repo.create_user(user_in=user, hashed_password=hashed_pwd)
        await self._db.commit()
        return UserResponse.model_validate(new_user)
