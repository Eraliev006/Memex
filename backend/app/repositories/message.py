import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, or_, select, update


from app.models.message import Message
from app.schemas.message_cursor import MessageCursor

class MessageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        
    async def create(self, message: Message) -> Message:
        self.db.add(message)
        
        await self.db.flush()
        await self.db.refresh(message)
        return message
    
    async def update(self, message_id: uuid.UUID, new_data: dict) -> Message | None:
        stmt = (
            update(Message)
            .where(Message.id == message_id)
            .values(**new_data)
        )
        
        await self.db.execute(stmt)        
        await self.db.flush()
        
        return await self.get_by_id(message_id)
    
    async def get_by_id(self, message_id: uuid.UUID) -> Message | None:
        stmt = select(Message).where(Message.id == message_id)
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def list_by_chat_id(self, chat_id: uuid.UUID, cursor: MessageCursor | None= None, limit: int = 10) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.chat_session_id == chat_id)
        )
        
        if cursor:
            stmt = stmt.where(
                or_(
                    Message.created_at > cursor.created_at,
                    and_(
                        Message.created_at == cursor.created_at,
                        Message.id > cursor.id
                    )
                )
            )
        
        stmt = stmt.order_by(Message.created_at.asc(), Message.id.asc()).limit(limit + 1)
        
        result = await self.db.execute(stmt)
        messages = list(result.scalars().all())
        
        return messages
    
    async def get_last_messages(
        self,
        chat_id: uuid.UUID,
        limit: int = 20,    
    ) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.chat_session_id == chat_id)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        messages = list(result.scalars().all())
        
        messages.reverse()
        return messages