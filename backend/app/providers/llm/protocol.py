
from typing import AsyncIterator, Protocol


class LLMProtocol(Protocol):
    def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        ...
        
    async def complete(self, messages: list[dict]) -> str:
        ...