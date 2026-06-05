
from datetime import datetime
import enum
import uuid

from pydantic import BaseModel, field_validator

class Statuses(enum.Enum):
    ready = 'ready'
    processing = 'processing'
    pending = 'pending'
    failed = 'failed'


class DocumentBase(BaseModel):
    title: str
    storage_path: str
    status: Statuses

class DocumentCreate(DocumentBase):
    original_filename: str
    
    class Config:
        use_enum_values = True
    
class DocumentResponse(DocumentBase):
    id: uuid.UUID
    original_filename: str
    user_id: uuid.UUID
    status: str
    created_at: datetime
    
    @field_validator("status", mode="before")
    @classmethod
    def serialize_enum(cls, v):
        if hasattr(v, "value"):
            return v.value
        return v

    class Config:
        from_attributes = True

class DocumentUpdate(BaseModel):
    content: str