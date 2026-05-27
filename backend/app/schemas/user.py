

from datetime import datetime
import uuid

from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    
class UserResponse(UserBase):
    id: uuid.UUID
    create_at: datetime
    