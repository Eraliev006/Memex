
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core import engine, settings, security
from typing import Annotated, Any, AsyncGenerator

from app.services import AuthService, DocumentService
from app.models.user import User


@dataclass
class TokenData:
    sub: str | None = None

async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
        
SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]



# AUTH SERVICE DI
async def get_auth_service(db: SessionDep) -> AuthService:
    return AuthService(db)
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]



# DOCUMENT SERVICE DI
async def get_document_service(db: SessionDep) -> DocumentService:
    return DocumentService(db)
DocumentServiceDep = Annotated[DocumentService, Depends(get_document_service)]



# CURRENT USER DEP
async def get_current_user(db: SessionDep, token: TokenDep):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Декодируем JWT токен
        payload: dict[str, Any] = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        user_id: str = payload.get("sub") # type: ignore
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(sub=user_id)
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == token_data.sub))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    return user
    

CurrentUserDep = Annotated[User, Depends(get_current_user)]

