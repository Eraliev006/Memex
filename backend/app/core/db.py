from sqlalchemy.ext.asyncio import create_async_engine

from backend.app.core import settings

engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI))
