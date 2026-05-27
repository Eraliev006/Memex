
from pydantic import BaseModel

class ResetPasswordRequest(BaseModel):
    new_password:str
    token: str

class ResetPasswordResponse(BaseModel):
    message: str