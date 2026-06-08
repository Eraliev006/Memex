import uuid

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue, PointStruct, ScoredPoint, VectorParams, Distance

from app.core import settings

class QdrantService:
    def __init__(self):
        self._client = AsyncQdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
        )
        self._collection_name = settings.COLLECTION_NAME
        
    async def ensure_collection(self):
        if not await self._client.collection_exists(self._collection_name):
            await self._client.create_collection(
                self._collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_SIZE,distance=Distance.COSINE
                    )
                )
            
    async def upsert_points(self, points: list[PointStruct]) -> None:
        await self._client.upsert(
            collection_name=self._collection_name,
            points=points
        )
        
    async def search(self, query_vector: list[float], user_id: uuid.UUID, limit: int = 5) -> list[ScoredPoint]:
        result = await self._client.query_points(
            collection_name=self._collection_name,
            query=query_vector,
            query_filter=Filter(
                must=[
                    FieldCondition(
                        key='user_id',
                        match=MatchValue(value=str(user_id))
                    ),
                ],
            ),
            limit=limit
        )
        return result.points
    
    async def delete_by_document_id(self, document_id: uuid.UUID) -> None:
        await self._client.delete(
            collection_name=self._collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key='document_id',
                        match=MatchValue(value=str(document_id))
                    )
                ]
            )
        )