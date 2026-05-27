from typing import Any

import jwt
from app.core import settings
from app.core import security

def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token: dict[str, Any] = jwt.decode(  # type: ignore
            token=token, key=settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"]) 
    except jwt.InvalidTokenError:
        return None