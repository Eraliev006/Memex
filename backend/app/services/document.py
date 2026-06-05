import uuid

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import DocumentRepository
from app.services.s3 import S3Storage
from app.schemas.document import DocumentCreate, Statuses


class DocumentService:
    def __init__(self, db: AsyncSession, s3_storage: S3Storage):
        self._repo = DocumentRepository(db=db)
        self._s3_client = s3_storage
        
    async def upload_document(self, document: UploadFile, user_id: uuid.UUID):
        file_extension = document.filename.split(".")[-1] if document.filename else "pdf"
        storage_path = f'documents/{uuid.uuid4()}.{file_extension}'
        
        await self._s3_client.upload_documents(file=document, object_key=storage_path)
        
        title = document.filename or "Без названия"
        document_in = DocumentCreate(
            title=title,
            storage_path=storage_path,
            original_filename=title,
            status=Statuses.pending.value # type: ignore
        )
        
        created_doc = await self._repo.create_document(document_in=document_in, user_id=user_id)
        return created_doc