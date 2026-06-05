

from fastapi import APIRouter, File, UploadFile

from app.api.deps import CurrentUserDep, DocumentServiceDep
from app.schemas.document import DocumentResponse


router = APIRouter(tags=['document'], prefix='/document')

@router.post('/upload',
             status_code=201,
             response_model=DocumentResponse,
             summary="Upload documents to storage")
async def upload_documents(
    document_service: DocumentServiceDep,
    current_user: CurrentUserDep,
    document: UploadFile = File(...),):
    """
    Upload documents to MinIO and DB
    """
    created_doc = await document_service.upload_document(document, user_id=current_user.id)

    return created_doc