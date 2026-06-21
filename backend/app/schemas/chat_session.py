from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.chat_cursor import ChatCursor


class ChatSessionCreate(BaseModel):
    title: str = "new chat"

class ChatSessionUpdate(BaseModel):
    title: str | None = None

class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str | None
    created_at: datetime
    updated_at: datetime | None
    last_message_at: datetime | None
    message_count: int
    
    model_config = ConfigDict(from_attributes=True)
    
class ChatListResponse(BaseModel):
    items: list[ChatSessionResponse]
    next_cursor: ChatCursor | None