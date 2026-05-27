

from pydantic import BaseModel


class PasswordResetBase(BaseModel):
    new_password:str
    
    
class ResetPasswordRequest(PasswordResetBase):
    pass

class ResetPasswordResponse(PasswordResetBase):
    pass