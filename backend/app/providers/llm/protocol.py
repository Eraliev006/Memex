
from typing import AsyncIterator, Callable, Protocol

from app.schemas.tool_call import LLMResponse, StreamEvent


class LLMProtocol(Protocol):
    def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        ...
        
    async def complete(self, messages: list[dict]) -> str:
        ...
        
    async def complete_with_tools(self, messages: list[dict], tools: list[dict]) -> LLMResponse:
        ...
        
    def stream_with_tools(self, messages: list[dict], tools: list[dict]) -> AsyncIterator[StreamEvent]:
        ...