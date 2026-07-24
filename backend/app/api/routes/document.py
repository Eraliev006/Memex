from uuid import UUID

from fastapi import APIRouter, File, Query, Request, UploadFile

from app.api.deps import get_limiter
from ratelimiter.keys.jwt import get_user_id

from app.api.deps import CurrentUserDep, DocumentServiceDep
from app.schemas import DocumentResponse, DocumentRename

limiter = get_limiter()
router = APIRouter(tags=['document'], prefix='/document')

@router.post('/upload',
             status_code=201,
             response_model=DocumentResponse,
             summary="Upload documents to storage")
@limiter.limit("5/minute", key_func=get_user_id)
async def upload_documents(
    request: Request,
    document_service: DocumentServiceDep,
    current_user: CurrentUserDep,
    document: UploadFile = File(...),
):
    """Upload documents to MinIO and DB"""
    return await document_service.upload_document(document, user_id=current_user.id)


@router.get('',
            response_model=list[DocumentResponse],
            summary="List current user's documents")
async def list_documents(
    document_service: DocumentServiceDep,
    current_user: CurrentUserDep,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, le=100),
):
    """List documents belonging to the current user"""
    return await document_service.get_document_list(current_user.id, skip, limit)


@router.patch('/{document_id}',
              response_model=DocumentResponse,
              summary="Rename a document")
async def rename_document(
    document_id: UUID,
    body: DocumentRename,
    document_service: DocumentServiceDep,
    current_user: CurrentUserDep,
):
    """Rename a document owned by the current user"""
    return await document_service.rename_document(document_id, current_user.id, body.title)


@router.delete('/{document_id}',
               status_code=204,
               summary="Delete a document")
async def delete_document(
    document_id: UUID,
    document_service: DocumentServiceDep,
    current_user: CurrentUserDep,
):
    """Delete a document owned by the current user"""
    await document_service.delete_document(document_id, current_user.id)
