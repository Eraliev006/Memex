import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_session import ChatSession
from app.repositories import ChatSessionRepository
from app.schemas import ChatSessionCreate, ChatSessionResponse, ChatSessionUpdate, ChatCursor, ChatListResponse


class ChatSessionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._repo = ChatSessionRepository(db)

    async def create_chat_session(self, chat_session: ChatSessionCreate, user_id: uuid.UUID) -> ChatSessionResponse:
        chat_session_in = ChatSession(**chat_session.model_dump(), user_id=user_id)
        result = await self._repo.create(chat_session_in)
        await self.db.commit()
        return ChatSessionResponse.model_validate(result)

    async def _get_owned_session(self, chat_session_id: uuid.UUID, user_id: uuid.UUID) -> ChatSession:
        chat_session = await self._repo.get_by_id(chat_session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail='Chat session not found')
        if chat_session.user_id != user_id:
            raise HTTPException(status_code=403, detail='Access denied')
        return chat_session

    async def update_chat_session(self, chat_session_id: uuid.UUID, user_id: uuid.UUID, new_data: ChatSessionUpdate) -> ChatSessionResponse:
        await self._get_owned_session(chat_session_id, user_id)

        new = await self._repo.update(
            chat_session_id=chat_session_id,
            new_data=new_data.model_dump(exclude_unset=True)
        )
        await self.db.commit()
        return ChatSessionResponse.model_validate(new)

    async def delete_chat_session(self, chat_session_id: uuid.UUID, user_id: uuid.UUID) -> None:
        await self._get_owned_session(chat_session_id, user_id)

        await self._repo.delete(chat_session_id)
        await self.db.commit()

    async def get_chat_list(self, user_id: uuid.UUID, cursor: ChatCursor | None = None, limit: int = 20) -> ChatListResponse:
        results = await self._repo.list_chat_by_user_id(user_id, cursor, limit)

        has_next = len(results) > limit
        if has_next:
            results = results[:limit]

        next_cursor = None
        if has_next:
            last = results[-1]
            if last.last_message_at is not None:
                next_cursor = ChatCursor(
                    last_message_at=last.last_message_at,
                    id=last.id,
                )

        return ChatListResponse(
            items=[ChatSessionResponse.model_validate(r) for r in results],
            next_cursor=next_cursor,
        )
