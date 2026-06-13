

import uuid

from qdrant_client.models import ScoredPoint

from app.services.embedding import EmbeddingService
from app.api.deps import get_embeddings_providers
from app.services.qdrant import QdrantService
from app.schemas.search_result import SearchResult, SearchResultItem


class SearchService:
    def __init__(self, embedding_service, qdrant_service):
        self.embedder = embedding_service
        self.qdrant = qdrant_service
    
    def _mapping(self, point: ScoredPoint) -> SearchResultItem:
        payload = point.payload or {}
        
        return SearchResultItem(
            chunk_id=uuid.UUID(str(point.id)),
            document_id=uuid.UUID(payload['document_id']),
            text=payload.get('content', ''),
            score=point.score,
            metadata={
                k: v for k, v in payload.items() 
                if k not in {'document_id', 'content'}
            }
        )
        
    async def search(
        self,
        query: str,
        user_id: uuid.UUID,
        docs_ids: list[uuid.UUID] | None = None,
        top_k: int = 5
        ) -> SearchResult:
    
        points = await self.embedder.create_embeddings([query])
        vector = points[0]
        
        result = await self.qdrant.search(
            query_vector=vector,
            user_id=user_id,
            docs_ids=docs_ids,
            limit=top_k
            )
        items = [self._mapping(p) for p in result]
        return SearchResult(items=items)