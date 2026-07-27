from typing import Protocol

from app.schemas.source import WebSource

class SearchClientProtocol(Protocol):
    async def search(self, query: str, max_results: int) -> list[WebSource]:
        ...