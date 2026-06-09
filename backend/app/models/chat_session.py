

import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import UUID, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from .user import User
    from .message import Message

from app.models import Base

class ChatSession(Base):
    __tablename__ = 'chat_sessions'
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title: Mapped[str | None]
    created_at: Mapped[datetime.datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now(), onupdate=func.now())
    last_message_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now(), onupdate=func.now())
    message_count: Mapped[int] = mapped_column(default=0)
    
    user: Mapped['User'] = relationship(back_populates='chat_sessions')
    messages: Mapped[list['Message']] = relationship(back_populates='chat_session')