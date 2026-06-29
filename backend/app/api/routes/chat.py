from uuid import UUID

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.deps import ChatServiceDep, ChatSessionServiceDep, CurrentUserDep
from app.schemas import ChatSessionCreate, ChatSessionResponse, ChatSessionUpdate, ChatListResponse
from app.schemas.chat_cursor import ChatCursor


router = APIRouter(tags=["chat"], prefix="/chat")


class ChatRequest(BaseModel):
    message: str
    doc_ids: list[UUID] | None = None


@router.post("/sessions", status_code=201, response_model=ChatSessionResponse)
async def create_session(
    body: ChatSessionCreate,
    chat_session_service: ChatSessionServiceDep,
    current_user: CurrentUserDep,
):
    return await chat_session_service.create_chat_session(body, current_user.id)


@router.get("/sessions", response_model=ChatListResponse)
async def list_sessions(
    chat_session_service: ChatSessionServiceDep,
    current_user: CurrentUserDep,
    limit: int = Query(default=20, le=50),
    cursor_id: UUID | None = Query(default=None),
    cursor_last_message_at: str | None = Query(default=None),
):
    cursor = None
    if cursor_id and cursor_last_message_at:
        from datetime import datetime
        cursor = ChatCursor(
            id=cursor_id,
            last_message_at=datetime.fromisoformat(cursor_last_message_at),
        )
    return await chat_session_service.get_chat_list(current_user.id, cursor, limit)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(
    session_id: UUID,
    body: ChatSessionUpdate,
    chat_session_service: ChatSessionServiceDep,
    current_user: CurrentUserDep,
):
    return await chat_session_service.update_chat_session(session_id, current_user.id, body)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: UUID,
    chat_session_service: ChatSessionServiceDep,
    current_user: CurrentUserDep,
):
    await chat_session_service.delete_chat_session(session_id, current_user.id)


@router.post("/{session_id}/message")
async def chat(
    request: Request,
    session_id: UUID,
    body: ChatRequest,
    chat_service: ChatServiceDep,
    current_user: CurrentUserDep,
):
    async def stream():
        async for token in chat_service.chat(
            user_id=current_user.id,
            session_id=session_id,
            user_message=body.message,
            doc_ids=body.doc_ids,
        ):
            if await request.is_disconnected():
                break
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
