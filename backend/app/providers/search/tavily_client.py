
import uuid

from tavily import AsyncTavilyClient

from app.schemas.source import WebSource


class TavilySearchClient:
    def __init__(self, api_key: str, timeout: float = 5.0):
        self._client = AsyncTavilyClient(api_key=api_key)
        self._timeout = timeout
    
    async def search(self, query: str, max_results: int = 5, include_raw_content: bool = False) -> list[WebSource]:
        raw = await self._client.search(query=query, max_results=max_results, include_raw_content=include_raw_content, timeout=self._timeout)
        return [self._map(item) for item in raw["results"]]
    
    def _map(self, item: dict) -> WebSource:
        return WebSource(
            id=uuid.uuid4(),
            source="web",
            title=item["title"],
            snippet=item["content"],
            score=item.get("score"), 
            url=item["url"],
            published_at=item.get("published_date"),
            favicon=item.get("favicon"),
        )

