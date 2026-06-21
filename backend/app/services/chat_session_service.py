import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_session import ChatSession
from app.repositories import ChatSessionRepository
from app.schemas import ChatSessionCreate, ChatSessionResponse, ChatSessionUpdate, ChatCursor


class ChatSessionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._repo = ChatSessionRepository(db)

    async def create_chat_session(self, chat_session: ChatSessionCreate, user_id: uuid.UUID) -> ChatSessionResponse:
        chat_session_in = ChatSession(**chat_session.model_dump(), user_id=user_id)
        result = await self._repo.create(chat_session_in)
        await self.db.commit()
        return ChatSessionResponse.model_validate(result)

    async def update_chat_session(self, chat_session_id: uuid.UUID, new_data: ChatSessionUpdate) -> ChatSessionResponse:
        chat_session = await self._repo.get_by_id(chat_session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail='Incorrect chat session ID')

        new = await self._repo.update(
            chat_session_id=chat_session_id,
            new_data=new_data.model_dump(exclude_unset=True)
        )
        await self.db.commit()
        return ChatSessionResponse.model_validate(new)

    async def delete_chat_session(self, chat_session_id: uuid.UUID) -> None:
        chat_session = await self._repo.get_by_id(chat_session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail='Incorrect chat session ID')

        await self._repo.delete(chat_session_id)
        await self.db.commit()

    async def get_chat_list(self, user_id: uuid.UUID, cursor: ChatCursor | None = None, limit: int = 20) -> list[ChatSessionResponse]:
        results = await self._repo.list_chat_by_user_id(user_id, cursor, limit)
        return [ChatSessionResponse.model_validate(result) for result in results]
