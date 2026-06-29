
from typing import AsyncIterator

from groq import AsyncGroq

from app.core import settings


class GroqLLM:
    def __init__(self, client: AsyncGroq):
        self.client = client
    
    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        response = await self.client.chat.completions.create(
            messages=messages,  # type: ignore
            model=settings.GROQ_MODEL,
            max_completion_tokens=settings.GROQ_MAX_TOKENS,
            top_p=1,
            temperature=0.5,
            stop=None,
            stream=True,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
        
    async def complete(self, messages: list[dict]) -> str:
        response = await self.client.chat.completions.create(
            messages=messages,  # type: ignore
            model=settings.GROQ_MODEL,
            max_completion_tokens=settings.GROQ_MAX_TOKENS,
            top_p=1,
            temperature=0.5,
            stop=None,
            stream=False,
        )
        return response.choices[0].message.content or ""