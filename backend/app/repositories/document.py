

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.document import DocumentCreate
from app.models.document import Document
from app.enums.document import DocumentStatuses


class DocumentRepository:
    def __init__ (self, db: AsyncSession):
        self.db = db
        
        
    async def create_document(self, document_in: DocumentCreate, user_id: uuid.UUID):
        """Create document in database

        Args:
            document_in (DocumentCreate): dto of document
            user_id (uuid.UUID): user that document's belong
        """
        document = Document(
            **document_in.model_dump(),
            user_id=user_id
        )
        self.db.add(document)
        await self.db.flush()
        
        return document
        
    async def get_document_by_id(self, id: uuid.UUID) -> Document | None:
        """Get document by id

        Args:
            id (uuid.UUID): document's ids

        Returns:
            Document or None
        """
        
        stmt = select(Document).where(Document.id == id)
        result = await self.db.execute(stmt)
        
        return result.scalar_one_or_none()
    
    async def update_document(self, id: uuid.UUID, **kwargs) -> None:
        """Update document

        Args:
            id (uuid.UUID): Document's id for updating
        """
        
        stmt = (
            update(Document)
            .where(Document.id == id)
            .values(**kwargs)
        )

        await self.db.execute(stmt)
        await self.db.flush()
        
    async def try_start_processing(self, id: uuid.UUID) -> bool:
        stmt = (
            update(Document)
            .where(Document.id == id, Document.status == DocumentStatuses.pending.value)
            .values(status="processing")
            .returning(Document.id)
        )
        result = await self.db.execute(stmt)
        row = result.scalar_one_or_none()
        
        return row is not None
            