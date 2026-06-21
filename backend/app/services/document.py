import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import DocumentRepository
from app.services.s3 import S3Storage
from app.schemas.document import DocumentCreate
from app.models.document import Document
from app.enums.document import DocumentStatuses


class DocumentService:
    def __init__(self, db: AsyncSession, s3_storage: S3Storage):
        self._db = db
        self._repo = DocumentRepository(db=db)
        self._s3_client = s3_storage
        
    async def upload_document(self, document: UploadFile, user_id: uuid.UUID):
        file_extension = document.filename.split(".")[-1] if document.filename else "pdf"
        storage_path = f'documents/{uuid.uuid4()}.{file_extension}'
        
        file = await document.read()
        await self._s3_client.upload_documents(file, object_key=storage_path)
        
        document_in = DocumentCreate(
            title=document.filename or "Без названия",
            storage_path=storage_path,
            original_filename=document.filename or "Без названия",
            status=DocumentStatuses.pending
        )
        try:
            created_doc = await self._repo.create_document(document_in, user_id)
            
            await self._db.commit()
            
            from app.tasks.document import process_document_task
            process_document_task.delay(str(created_doc.id))
            
            return created_doc
        except Exception:
            await self._db.rollback()
            raise

    
    async def get_document_path_by_id(self, id: uuid.UUID) -> str:
        docs: Document | None = await self._repo.get_document_by_id(id)
        
        if docs is None:
            raise ValueError("Invalid document's id")
                
        return docs.storage_path
    
        