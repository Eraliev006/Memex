import uuid

from qdrant_client.models import PointStruct

from app.repositories.document import DocumentRepository
from app.services.s3 import S3Storage
from app.services.parser import LlamaParser
from app.enums.document import DocumentStatuses
from app.services import ChunkingService, EmbeddingService, QdrantService
from app.api.deps import get_embeddings_providers
from app.repositories.chunk import ChunkRepository


class DocumentWorkflows:
    @staticmethod
    async def run(doc_id: uuid.UUID, async_session):
        repo = DocumentRepository(async_session)
        s3 = S3Storage()
        embedder = EmbeddingService(provider=get_embeddings_providers())
        chunking = ChunkingService()
        qdrant = QdrantService()
        chunk_repo = ChunkRepository(async_session)
        
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
            
            chunks = chunking.split(text if text else "")
            if not chunks:
                raise ValueError("Document has no content after parsing")
            
            embeddings: list[list[float]] = await embedder.create_embeddings(chunks)
            
            points = []
            chunk_dicts = [] 
            
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = uuid.uuid4()

                point = PointStruct(
                    id=str(point_id),
                    vector=embedding,
                    payload={
                        "document_id": str(doc.id),
                        "user_id": str(doc.user_id),
                        "chunk_index": i,
                        "content": chunk,
                        "document_title": doc.title,
                        'chunk_id': point_id
                    }
                )

                chunk_dict = {
                    "id": point_id,
                    "document_id": doc.id,
                    "user_id": doc.user_id,
                    "content": chunk,
                    "chunk_index": i,
                    "qdrant_point_id": point_id
                }
                
                chunk_dicts.append(chunk_dict)
                points.append(point)
                
            await qdrant.upsert_points(points)
            await chunk_repo.bulk_create(chunk_dicts)
            
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