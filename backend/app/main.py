from contextlib import asynccontextmanager

from fastapi import FastAPI
from loguru import logger

from app.core import settings
from app.core.providers import get_embedding_provider
from app.api.main import api_router
from app.services import EmbeddingService, QdrantService, SearchService


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading embedding model...")
    embedding_service = EmbeddingService(get_embedding_provider())
    logger.info("Embedding model ready")

    logger.info("Connecting to Qdrant...")
    qdrant_service = QdrantService()
    await qdrant_service.ensure_collection()
    logger.info("Qdrant ready")

    app.state.search_service = SearchService(
        embedding_service=embedding_service,
        qdrant_service=qdrant_service,
    )

    logger.info("Server startup complete")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(api_router, prefix=settings.API_V1_STR)