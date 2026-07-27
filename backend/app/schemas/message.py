

from datetime import datetime
from typing import Literal
import uuid

from pydantic import BaseModel, ConfigDict

from app.enums.message import MessageRole, MessageStatus
from app.schemas.message_cursor import MessageCursor
from app.schemas.source import Source


class MessageCreate(BaseModel):
    role: MessageRole
    content: str
    search_scope: Literal['docs', 'web', 'both'] = 'docs'

class MessageUpdate(BaseModel):
    status: MessageStatus | None = None

class MessageResponse(BaseModel):
    id: uuid.UUID
    chat_session_id: uuid.UUID
    role: MessageRole
    content: str
    status: MessageStatus
    sources: list[Source] | None
    tool_calls: list[dict] | None
    created_at: datetime
    updated_at: datetime | None
    
    model_config = ConfigDict(from_attributes=True)
    
class MessageStreamChunk(BaseModel):
    message_id: uuid.UUID
    content: str
    is_final: bool = False
    
class MessageHistoryResponse(BaseModel):
    items: list[MessageResponse]
    next_cursor: MessageCursor | None