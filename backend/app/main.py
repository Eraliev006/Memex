from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core import settings, redis_client
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
    
    logger.info("Connection to Redis")
    await redis_client.connect()

    app.state.search_service = SearchService(
        embedding_service=embedding_service,
        qdrant_service=qdrant_service,
    )
    app.state.redis_client = redis_client

    logger.info("Server startup complete")
    yield

    logger.info("Disconnecting from Redis")
    await redis_client.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)