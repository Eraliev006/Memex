from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core import settings
from app.api.main import api_router
from app.services import QdrantService


@asynccontextmanager
async def lifespan(app: FastAPI):
    qdrant = QdrantService()
    await qdrant.ensure_collection()
    yield
    
    
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(api_router, prefix=settings.API_V1_STR)