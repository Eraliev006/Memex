

import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import UUID, Enum, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base
from app.enums.message import MessageRole, MessageStatus

if TYPE_CHECKING:
    from .chat_session import ChatSession

class Message(Base):
    __tablename__ = 'messages'
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    chat_session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), name='message_roles')
    content: Mapped[str]
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now(), onupdate=func.now())
    sources: Mapped[list[dict] | None] = mapped_column(JSON)
    tool_calls: Mapped[list[dict] | None] = mapped_column(JSON)
    prompt_tokens: Mapped[int | None]
    completion_tokens: Mapped[int | None]
    meta: Mapped[dict | None] = mapped_column(JSON) 
    status: Mapped[MessageStatus] = mapped_column(Enum(MessageStatus), name='message_statuses', default=MessageStatus.created)
    
    chat_session: Mapped['ChatSession'] = relationship(back_populates='messages', lazy='select')
    