from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.providers.embeddings.bge import BGEEmbeddingProvider
from app.providers.embeddings.protocol import EmbeddingProtocol


@lru_cache
def get_embedding_provider() -> EmbeddingProtocol:
    match settings.EMBEDDING_PROVIDER:
        case 'sentence-transformers':
            model = SentenceTransformer(settings.EMBEDDING_MODEL)
            return BGEEmbeddingProvider(model=model)
        case _:
            raise ValueError(f'Unknown embedding provider: {settings.EMBEDDING_PROVIDER}')
