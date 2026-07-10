import asyncio
from dataclasses import dataclass

import httpx
import jwt
from fastapi import HTTPException
from app.core.config import settings


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUER = "https://accounts.google.com"

_jwks_client = jwt.PyJWKClient(GOOGLE_CERTS_URL)

@dataclass
class GoogleUserInfo:
    sub: str
    email: str
    name: str


class GoogleAuthService:
    async def exchange_code(self, code: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            print(response.json())
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code")
            return response.json()

    async def get_user_info_from_id_token(self, id_token: str) -> GoogleUserInfo:
        signing_key = await asyncio.to_thread(
            _jwks_client.get_signing_key_from_jwt,
            id_token
        )

        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            issuer=GOOGLE_ISSUER,
        )

        return GoogleUserInfo(
            sub =payload["sub"],
            email =payload["email"],
            name =payload.get("name", ""),
        )