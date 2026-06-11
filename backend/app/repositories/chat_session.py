
import datetime
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, delete, or_, select, update

from app.schemas.chat_session import ChatSessionCreate, ChatSessionUpdate
from app.models.chat_session import ChatSession
from app.schemas.chat_cursor import ChatCursor

class ChatSessionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        
    async def create(self, chat_session: ChatSession) -> ChatSession:
        
        self.db.add(chat_session)
        await self.db.flush()
        return chat_session
    
    async def delete(self, chat_session_id: uuid.UUID) -> ChatSession | None:
        stmt = (
            delete(ChatSession)
            .where(ChatSession.id == chat_session_id)
            .returning(ChatSession)
            )
        
        result = await self.db.execute(stmt)
        await self.db.flush()
        
        return result.scalar_one_or_none() 
    
    async def update(self, chat_session_id: uuid.UUID, new_data: dict) -> ChatSession | None:
        stmt = (
            update(ChatSession)
            .where(ChatSession.id == chat_session_id)
            .values(**new_data)
            .returning(ChatSession)
        )
        result = await self.db.execute(stmt)
        
        updated_chat = result.scalar_one_or_none()
        
        await self.db.flush()
        return updated_chat
    
    async def list_chat_by_user_id(self, user_id: uuid.UUID, cursor: ChatCursor | None = None, limit: int = 20) -> list[ChatSession]:
        stmt = select(ChatSession).where(ChatSession.user_id == user_id)
        
        if cursor:
            stmt = stmt.where(
                or_(
                    ChatSession.last_message_at < cursor.last_message_at,
                    and_(
                        ChatSession.last_message_at == cursor.last_message_at,
                        ChatSession.id < cursor.id
                    )
                )
                
            )
            
        stmt = stmt.order_by(ChatSession.last_message_at.desc(), ChatSession.id.desc()).limit(limit)
        
        result = await self.db.execute(stmt)
        
        return list(result.scalars().all())
    
    async def get_by_id(self, chat_session_id: uuid.UUID) -> ChatSession | None:
        stmt = select(ChatSession).where(ChatSession.id == chat_session_id)
        
        result = await self.db.execute(stmt)
        
        return result.scalar_one_or_none()