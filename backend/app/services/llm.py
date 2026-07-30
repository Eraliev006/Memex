from typing import AsyncGenerator, AsyncIterator

from app.providers.llm.protocol import LLMProtocol
from app.schemas.tool_call import LLMResponse, StreamEvent


class LLMService:
    def __init__(self, provider: LLMProtocol):
        self._provider = provider

    async def stream(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        async for token in self._provider.stream(messages):
            if token:
                yield token

    async def complete(self, messages: list[dict]) -> str:
        return await self._provider.complete(messages)

    async def complete_with_tools(self, messages: list[dict], tools: list[dict]) -> LLMResponse:
        return await self._provider.complete_with_tools(messages=messages, tools=tools)
    
    async def stream_with_tools(self, messages: list[dict], tools: list[dict]) -> AsyncIterator[StreamEvent]:
        async for event in self._provider.stream_with_tools(messages, tools=tools):
            yield event