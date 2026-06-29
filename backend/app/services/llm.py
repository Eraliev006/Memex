from typing import AsyncGenerator

from app.providers.llm.protocol import LLMProtocol


class LLMService:
    def __init__(self, provider: LLMProtocol):
        self._provider = provider

    async def stream(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        async for token in self._provider.stream(messages):
            if token:
                yield token

    async def complete(self, messages: list[dict]) -> str:
        return await self._provider.complete(messages)
