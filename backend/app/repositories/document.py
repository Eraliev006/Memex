

import uuid

from sqlalchemy import delete, select, update
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
    
    async def update_document(self, id: uuid.UUID, **kwargs) -> Document | None:
        """Update document

        Args:
            id (uuid.UUID): Document's id for updating
        """

        stmt = (
            update(Document)
            .where(Document.id == id)
            .values(**kwargs)
            .returning(Document)
        )

        result = await self.db.execute(stmt)
        await self.db.flush()

        return result.scalar_one_or_none()

    async def list_documents_by_user_id(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Document]:
        """List documents belonging to a user

        Args:
            user_id (uuid.UUID): owner of the documents
            skip (int): number of rows to skip
            limit (int): max number of rows to return
        """

        stmt = (
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)

        return list(result.scalars().all())

    async def delete_document(self, id: uuid.UUID) -> Document | None:
        """Delete document by id

        Args:
            id (uuid.UUID): document's id
        """

        stmt = (
            delete(Document)
            .where(Document.id == id)
            .returning(Document)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()

        return result.scalar_one_or_none()

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
            