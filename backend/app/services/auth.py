from datetime import timedelta
from typing import Any
import uuid

import jwt
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import UserRepository
from app.schemas import LoginWithPasswordRequest, TokenResponse, UserCreate, UserResponse, ResetPasswordRequest, TokenPair, LoginWithGoogle, UserCreateWithGoogle
from app.core import security, settings
from app.core.redis_client import RedisClient
from app.services.google_auth import GoogleAuthService
from app.models.user import User
from .utils import verify_password_reset_token


class AuthService:
    def __init__(self, db: AsyncSession, redis: RedisClient, google_auth: GoogleAuthService):
        self._db = db
        self._repo = UserRepository(db)
        self._redis = redis
        self._google_auth = google_auth

    async def login_with_password(self, data: LoginWithPasswordRequest) -> TokenPair:
        user = await self._repo.get_by_email(email=data.email)

        if not user:
            raise HTTPException(status_code=401, detail="Incorrect password or email")

        if not user.hashed_password:
            raise HTTPException(status_code=401, detail="This account uses Google login")

        is_verified, new_hash = security.verify_password(data.password, user.hashed_password)

        if not is_verified:
            raise HTTPException(status_code=401, detail="Incorrect password or email")

        if new_hash:
            await self._repo.update_password(user, new_hash)
            await self._db.commit()
        
        family_id = uuid.uuid4()
        
        access_token = security.create_access_token(user.id)
        refresh_token = security.create_refresh_token(user.id, family=family_id)

        await self._redis.store_session(
            user_id=str(user.id),
            family=str(family_id),
            jti=str(refresh_token.jti),
            ttl=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token.token
        )
        
    async def _create_google_user(self, user_data: UserCreateWithGoogle) -> User:
        new_user = await self._repo.create_google_user(
            user_in=user_data
        )
        await self._db.flush()
        return new_user
        
    async def login_with_google(self, dto: LoginWithGoogle):
        exchanged = await self._google_auth.exchange_code(dto.code)
        
        if not exchanged:
            raise
        
        id_token = exchanged.get('id_token', '')
        
        if not id_token:
            raise
        
        user_data = await self._google_auth.get_user_info_from_id_token(id_token)
        google_id = user_data.sub
        
        exists_user = await self._repo.get_by_google_id(google_id)
        
        if exists_user is None:
            exists_user = await self._repo.get_by_email(user_data.email)
            
            if exists_user is not None:
                exists_user.google_id = google_id
                await self._db.flush()
            else:
                user_in = UserCreateWithGoogle(
                    name=user_data.name,
                    email=user_data.email,
                    google_id=google_id
                )
                exists_user = await self._create_google_user(user_in)
        
        
        user = exists_user
        
        family_id = uuid.uuid4()
        access_token = security.create_access_token(user.id)
        refresh_token = security.create_refresh_token(user.id, family=family_id)
        
        await self._redis.store_session(
            user_id=str(user.id),
            family=str(family_id),
            jti=str(refresh_token.jti),
            ttl=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )
        await self._db.commit()

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token.token
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

    async def refresh_tokens(self, refresh_token: str) -> TokenPair:
        try:
            payload: dict[str, Any] = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
            )
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = await self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        old_jti = await self._redis.rotate(str(user.id), family=payload['family'])
         
        if old_jti is None:
             raise HTTPException(status_code=401, detail="Invalid refresh token")
         
        if old_jti != payload['jti']:
            await self._redis.revoke_all_sessions(user_id=str(user.id))
            raise HTTPException(status_code=401, detail="Token reuse detected")
        
        new_refresh = security.create_refresh_token(user.id, family=uuid.UUID(payload['family']))
        await self._redis.store_session(
            user_id=str(user.id),
            family=payload['family'],
            jti=str(new_refresh.jti),
            ttl=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60
        )

        return TokenPair(
            access_token=security.create_access_token(user.id),
            refresh_token=new_refresh.token
        )


    async def register(self, user: UserCreate) -> UserResponse:
        existing_user = await self._repo.get_by_email(user.email)

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pwd = security.hash_password(user.password)
        new_user = await self._repo.create_user(user_in=user, hashed_password=hashed_pwd)
        await self._db.commit()
        return UserResponse.model_validate(new_user)

    async def logout(self, refresh_token: str | None) -> None:
        if not refresh_token:
            raise HTTPException(status_code=401, detail="No refresh token")
        
        try:
            payload: dict[str, Any] = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
            )
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        await self._redis.revoke_session(
            user_id=payload.get('sub', ''),
            family=payload.get('family', '')
        )
        return 