import uuid

from app.repositories.document import DocumentRepository
from app.services.s3 import S3Storage
from app.services.parser import LlamaParser
from app.enums.document import DocumentStatuses

class DocumentWorkflows:
    @staticmethod
    async def run(doc_id: uuid.UUID, async_session):
        repo = DocumentRepository(async_session)
        s3 = S3Storage()
        
        started = await repo.try_start_processing(doc_id)
        
        if not started:
            return
        
        try:
            doc = await repo.get_document_by_id(doc_id)
            
            if not doc:
                raise ValueError("Document not found")
            
            file_bytes = await s3.download_documents(doc.storage_path)
            
            parser = LlamaParser()
            text = await parser.parse(
                file_bytes=file_bytes,
                filename=doc.storage_path.split('/')[-1]
            )
            
            await repo.update_document(
                id=doc_id,
                content = text or "",
                status = DocumentStatuses.ready.value
            )
            
            await async_session.commit()
        
        except Exception as e:
            await repo.update_document(
                doc_id,
                status = DocumentStatuses.failed.value
            ) 
            await async_session.commit()
            raise e