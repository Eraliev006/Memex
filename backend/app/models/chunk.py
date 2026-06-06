from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import UUID, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


if TYPE_CHECKING:
    from .document import Document
    
    
class Chunk(Base):
    __tablename__ = 'chunks'
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content: Mapped[str]
    chunk_index: Mapped[int] = mapped_column(nullable=False)
    qdrant_point_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(),nullable=False)
    
    document: Mapped['Document'] = relationship(back_populates='chunks')
