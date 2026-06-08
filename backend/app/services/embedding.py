

from app.providers.embeddings.protocol import EmbeddingProtocol


class EmbeddingService:
    def __init__(self, provider: EmbeddingProtocol):
        self.provider = provider
    
    async def create_embeddings(self, texts: list[str]) -> list[list[float]]:
        return await self.provider.embed_batch(texts=texts)
        