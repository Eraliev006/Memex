from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core import settings


celery_db_engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    poolclass=NullPool
)
