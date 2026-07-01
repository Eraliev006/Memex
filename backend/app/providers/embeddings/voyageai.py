import voyageai


class VoyageEmbeddingProvider:
    def __init__(self, api_key: str, model: str = "voyage-4-lite"):
        self.client = voyageai.AsyncClient(api_key=api_key)
        self.model = model

    async def embed(self, text: str) -> list[float]:
        result = await self.client.embed(
            texts=[text],
            model=self.model,
        )
        return result.embeddings[0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        result = await self.client.embed(
            texts=texts,
            model=self.model,
        )
        return result.embeddings