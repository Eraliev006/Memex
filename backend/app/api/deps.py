from dataclasses import dataclass
from typing import Annotated, Any, AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.core import engine, settings, security
from app.models.user import User
from app.repositories import UserRepository
from app.services import AuthService, DocumentService, S3Storage, SearchService


@dataclass
class TokenData:
    sub: str | None = None

async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
_s3_storage_instance = S3Storage()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


# AUTH SERVICE DI
async def get_auth_service(db: SessionDep) -> AuthService:
    return AuthService(db)
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


# S3 SERVICE DI
async def get_s3_storage() -> S3Storage:
    return _s3_storage_instance


# DOCUMENT SERVICE DI
async def get_document_service(db: SessionDep) -> DocumentService:
    return DocumentService(db, _s3_storage_instance)
DocumentServiceDep = Annotated[DocumentService, Depends(get_document_service)]


# CURRENT USER DEP
async def get_current_user(db: SessionDep, token: TokenDep) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        user_id: str = payload.get("sub")  # type: ignore
        token_type: str = payload.get("type")  # type: ignore
        if user_id is None:
            raise credentials_exception
        if token_type != "access":
            raise credentials_exception
        token_data = TokenData(sub=user_id)
    except jwt.InvalidTokenError:
        raise credentials_exception

    repo = UserRepository(db)
    if not token_data.sub:
        raise ValueError("Invalid user id")
    user = await repo.get_by_id(token_data.sub)

    if user is None:
        raise credentials_exception

    return user

CurrentUserDep = Annotated[User, Depends(get_current_user)]


# SEARCH SERVICE DI
def get_search_service(request: Request) -> SearchService:
    return request.app.state.search_service

SearchServiceDep = Annotated[SearchService, Depends(get_search_service)]
