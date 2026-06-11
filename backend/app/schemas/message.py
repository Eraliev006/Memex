

from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.enums.message import MessageRole, MessageStatus


class MessageCreate(BaseModel):
    role: MessageRole
    content: str

class MessageUpdate(BaseModel):
    status: MessageStatus | None = None

class MessageResponse(BaseModel):
    id: uuid.UUID
    chat_session_id: uuid.UUID
    role: MessageRole
    content: str
    status: MessageStatus
    sources: list[dict] | None
    tool_calls: list[dict] | None
    created_at: datetime
    updated_at: datetime | None
    
    model_config = ConfigDict(from_attributes=True)
    
class MessageStreamChunk(BaseModel):
    message_id: uuid.UUID
    content: str
    is_final: bool = False