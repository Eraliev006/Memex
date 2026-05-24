
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.core import settings


password_hash = PasswordHash(
    (
        Argon2Hasher(),
    )
)

ALGORITHM = 'HS256'

def _generate_token(subject: str | Any, expires_delta: timedelta, type: Literal['access', 'refresh']) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode: dict[str, Any] = {
        'exp': expire,
        'sub': str(subject),
        'type': type
    }
    return jwt.encode(payload=to_encode, algorithm=ALGORITHM, key=settings.SECRET_KEY) # type: ignore

def create_access_token(subject: str | Any, expires_delta: timedelta | None = None):
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _generate_token(subject=subject,expires_delta=delta,type='access')
    


def create_refresh_token(subject: str | Any, expires_delta: timedelta | None = None) -> str:
    delta = expires_delta or timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return _generate_token(subject=subject,expires_delta=delta,type='refresh')


def verify_password(
    plain_password: str, hashed_password:str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def hash_password(plain_password: str) -> str:
    return password_hash.hash(plain_password)
    