
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.core import engine
from typing import AsyncGenerator

async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session