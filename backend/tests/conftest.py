
from typing import AsyncGenerator

from faker import Faker
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import pytest

from app.main import app
from app.api.deps import get_db
from app.schemas.user import UserCreate

faker = Faker()

@pytest.fixture
async def db_session():
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    
    test_engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    async with AsyncSession(test_engine) as session:
        yield session
    await test_engine.dispose()
    

@pytest.fixture
async def client(
    db_session: AsyncSession
) -> AsyncGenerator[AsyncClient, None]:

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
    

@pytest.fixture
def user_create_schema() -> UserCreate:
    name = faker.name()
    email = faker.email()
    password = faker.password(length=8, special_chars=False)
    
    return UserCreate(
        name=name,
        email=email,
        password=password
    )
    