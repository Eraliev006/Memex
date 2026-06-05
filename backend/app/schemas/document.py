
from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, field_validator

from app.enums.document import DocumentStatuses
class DocumentBase(BaseModel):
    title: str
    storage_path: str
    status: DocumentStatuses

class DocumentCreate(DocumentBase):
    original_filename: str
    
    model_config = ConfigDict(use_enum_values=True)
    
class DocumentResponse(DocumentBase):
    id: uuid.UUID
    original_filename: str
    user_id: uuid.UUID
    status: DocumentStatuses
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DocumentUpdate(BaseModel):
    content: str | None = None
    title: str | None = None
    status: DocumentStatuses | None = None