
from fastapi import Depends
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.core import engine
from typing import Annotated, AsyncGenerator

from app.services.auth import AuthService

async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
        
SessionDep = Annotated[AsyncSession, Depends(get_db)]

# AUTH SERVICE DI
async def get_auth_service(db: SessionDep) -> AuthService:
    return AuthService(db)
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]