import uuid

from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import DocumentRepository
from app.services.s3 import S3Storage
from app.services.qdrant import QdrantService
from app.schemas.document import DocumentCreate
from app.models.document import Document
from app.enums.document import DocumentStatuses


ALLOWED_EXTENSIONS = {'pdf', 'md', 'txt', 'docx'}

class DocumentService:
    def __init__(self, db: AsyncSession, s3_storage: S3Storage):
        self._db = db
        self._repo = DocumentRepository(db=db)
        self._s3_client = s3_storage
        self._qdrant = QdrantService()

    async def upload_document(self, document: UploadFile, user_id: uuid.UUID):
        file_extension = document.filename.split(".")[-1].lower() if document.filename else ''
        
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type .{file_extension} is not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
            
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
            
            from app.tasks.document import process_document_task
            process_document_task.delay(str(created_doc.id))
            
            await self._db.commit()
            return created_doc
        except Exception:
            await self._db.rollback()
            raise

    
    async def get_document_path_by_id(self, id: uuid.UUID) -> str:
        docs: Document | None = await self._repo.get_document_by_id(id)

        if docs is None:
            raise ValueError("Invalid document's id")

        return docs.storage_path

    async def _get_owned_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Document:
        document = await self._repo.get_document_by_id(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        if document.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        return document

    async def get_document_list(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Document]:
        return await self._repo.list_documents_by_user_id(user_id, skip, limit)

    async def rename_document(self, document_id: uuid.UUID, user_id: uuid.UUID, title: str) -> Document:
        await self._get_owned_document(document_id, user_id)

        try:
            updated = await self._repo.update_document(document_id, title=title)
            await self._db.commit()
            return updated  # type: ignore[return-value]
        except Exception:
            await self._db.rollback()
            raise

    async def delete_document(self, document_id: uuid.UUID, user_id: uuid.UUID) -> None:
        document = await self._get_owned_document(document_id, user_id)

        try:
            await self._repo.delete_document(document_id)
            
            await self._db.commit()
        except Exception:
            await self._db.rollback()
            raise
        try:
            await self._qdrant.delete_by_document_id(document_id)
            
        except Exception:
            pass #TODO loggin
        
        try:
            await self._s3_client.delete_documents(document.storage_path)
        except Exception:
            pass #TODO loggin