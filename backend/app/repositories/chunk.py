
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.chunk import Chunk


class ChunkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        
        
    async def bulk_create(self, chunks: list[dict]) -> list[Chunk]:
        chunk_lists = [Chunk(**chunk_data) for chunk_data in chunks]
        self.db.add_all(chunk_lists)
        
        await self.db.flush()
        return chunk_lists
    
    
    async def get_by_document_id(self, doc_id: uuid.UUID) -> list[Chunk]:
        stmt = select(Chunk).where(Chunk.document_id == doc_id)
        result = await self.db.execute(stmt)
        
        return list(result.scalars().all())
        
        
    async def delete_by_document_id(self, doc_id: uuid.UUID) -> None:
        stmt = delete(Chunk).where(Chunk.document_id == doc_id)
        
        await self.db.execute(stmt)
        
        await self.db.flush()
        
        return None
    
    
    async def get_by_qdrant_point_ids(self, point_ids: list[uuid.UUID]) -> list[Chunk]:
        stmt = select(Chunk).where(Chunk.qdrant_point_id.in_(point_ids))
        
        result = await self.db.execute(stmt)
        
        return list(result.scalars().all())