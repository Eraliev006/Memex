from functools import lru_cache

from groq import AsyncGroq
from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.providers.embeddings.bge import BGEEmbeddingProvider
from app.providers.embeddings.protocol import EmbeddingProtocol
from app.providers.llm.protocol import LLMProtocol
from app.providers.llm.groq import GroqLLM
from app.providers.embeddings.voyageai import VoyageEmbeddingProvider


@lru_cache
def get_embedding_provider() -> EmbeddingProtocol:
    match settings.EMBEDDING_PROVIDER:
        case 'sentence-transformers':
            model = SentenceTransformer(settings.EMBEDDING_MODEL)
            return BGEEmbeddingProvider(model=model)
        case 'voyageai':
            return VoyageEmbeddingProvider(api_key=settings.VOYAGEAI_API_KEY)
        case _:
            raise ValueError(f'Unknown embedding provider: {settings.EMBEDDING_PROVIDER}')

@lru_cache
def get_llm_provider() -> LLMProtocol:
    match settings.LLM_PROVIDER:
        case 'groq':
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            return GroqLLM(client=client)
        case _:
            raise ValueError(f"Unknown llm provider {settings.LLM_PROVIDER}")