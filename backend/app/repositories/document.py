

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.document import DocumentCreate
from app.models.document import Document


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
        await self.db.commit()
        await self.db.refresh(document)
        
        return document
        
        