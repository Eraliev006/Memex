

from datetime import datetime
import enum
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import UUID, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.enums.document import DocumentStatuses

if TYPE_CHECKING:
    from .user import User


class Document(Base):
    __tablename__ = 'documents'
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, index=True, default=(uuid.uuid4))
    title: Mapped[str] = mapped_column(nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    original_filename: Mapped[str] = mapped_column(nullable=False)
    storage_path: Mapped[str] = mapped_column(nullable=False)
    content: Mapped[str | None]
    status: Mapped[DocumentStatuses] = mapped_column(Enum(DocumentStatuses, name="document_statuses"))    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(),nullable=False)
    
    
    user: Mapped['User'] = relationship(back_populates='documents')