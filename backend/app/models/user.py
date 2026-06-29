from typing import TYPE_CHECKING
import uuid

from datetime import datetime

from sqlalchemy import UUID, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from .document import Document
    from .chat_session import ChatSession

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(),nullable=False)
    
    documents: Mapped[list['Document']] = relationship(back_populates='user')
    chat_sessions: Mapped[list['ChatSession']] = relationship(back_populates='user')