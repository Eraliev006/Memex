import asyncio

from sentence_transformers import SentenceTransformer


class BGEEmbeddingProvider:
    def __init__(self, model: SentenceTransformer):
        self.model = model
    
    async def embed(self, text: str) -> list[float]:
        embedding = await asyncio.to_thread(
            self.model.encode,
            text,
            normalize_embeddings = True
        )
        return embedding.tolist()
        
        
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        embedding = await asyncio.to_thread(
            self.model.encode,
            texts,
            normalize_embeddings = True
        )
        return embedding.tolist()
    