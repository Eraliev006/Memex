import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.repositories import MessageRepository, ChatSessionRepository
from app.schemas import MessageCreate, MessageHistoryResponse, MessageResponse, MessageCursor


class MessageService:
    def __init__(self, db: AsyncSession):
        self._db = db
        self._repo = MessageRepository(self._db)
        self._chat_repo = ChatSessionRepository(self._db)

    async def create(self, message: MessageCreate, chat_session_id: uuid.UUID, user_id: uuid.UUID) -> MessageResponse:
        chat = await self._chat_repo.get_by_id(chat_session_id)
        if not chat:
            raise HTTPException(status_code=404, detail=f"Chat {chat_session_id} not found")
        if chat.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        message_in = Message(**message.model_dump(), chat_session_id=chat_session_id)
        resp = await self._repo.create(message_in)
        await self._chat_repo.touch(chat_session_id)
        await self._db.commit()
        return MessageResponse.model_validate(resp)

    async def get_history(self, chat_session_id: uuid.UUID, cursor: MessageCursor | None, limit: int = 10) -> MessageHistoryResponse:
        messages = await self._repo.list_by_chat_id(
            chat_id=chat_session_id,
            cursor=cursor,
            limit=limit
        )
        has_next = len(messages) > limit

        if has_next:
            messages = messages[:limit]

        next_cursor = None
        if messages and has_next:
            last = messages[-1]
            next_cursor = MessageCursor(
                id=last.id,
                created_at=last.created_at
            )

        return MessageHistoryResponse(
            items=[MessageResponse.model_validate(msg) for msg in messages],
            next_cursor=next_cursor,
        )

    async def get_context_history(
        self,
        chat_session_id: uuid.UUID,
        limit: int = 20
    ) -> list[MessageResponse]:
        messages = await self._repo.get_last_messages(chat_session_id, limit)
        return [MessageResponse.model_validate(msg) for msg in messages]
