import hashlib
import logging
import re

from pydantic import TypeAdapter
import redis.asyncio as redis

from app.providers import SearchClientProtocol
from app.schemas import WebSource

logger = logging.getLogger(__name__)

_TIME_SENSITIVE_MARKERS = {
    "сейчас", "сегодня", "latest", "now", "today", "текущ", "последний"
}
_FILLER_PHRASES = [
    "скажи", "можешь ли ты", "как думаешь", "расскажи", "что ты можешь сказать",
]

_web_source_list_adapter = TypeAdapter(list[WebSource])

class WebSearchService:
    def __init__(self, redis: redis.Redis, client: SearchClientProtocol, ttl: int = 3600, short_ttl: int = 300):
        self._client = client
        self._ttl = ttl
        self._redis = redis
        self._short_ttl = short_ttl
        
    def _normalize(self, query: str) -> str:
        q = query.lower().strip()
        q = re.sub(r"[^\w\s]", "", q)
        for phrase in _FILLER_PHRASES:
            q = re.sub(rf"\b{re.escape(phrase)}\b", "", q)
        return re.sub(r"\s+", " ", q).strip()

    def _is_time_sensitive(self, normalized_query: str) -> bool:
        return any(marker in normalized_query for marker in _TIME_SENSITIVE_MARKERS)

    def _cache_key(self, normalized_query: str, max_results: int) -> str:
        digest = hashlib.sha256(f"{normalized_query}:{max_results}".encode()).hexdigest()
        return f"websearch:{digest}"

        
    async def search(self, query: str, max_results: int = 5) -> list[WebSource]:
        normalized = self._normalize(query)
        if not normalized:
            return []

        time_sensitive = self._is_time_sensitive(normalized)
        key = self._cache_key(normalized, max_results)

        try:
            cached = await self._redis.get(key)
        except Exception:
            logger.warning("Cache read failed; continuing without cache")
            cached = None
            
        if cached:
            try:
                return _web_source_list_adapter.validate_json(cached)
            except Exception:
                logger.warning("Failed to parse cached web search result for key %s", key)

        try:
            sources = await self._client.search(query=query, max_results=max_results)
        except Exception:
            logger.exception("Web search failed for query: %s", query)
            return []
        
        ttl = self._short_ttl if time_sensitive else self._ttl
        try:
            payload = _web_source_list_adapter.dump_json(sources)
            await self._redis.set(key, payload, ex=ttl)
        except Exception:
            logger.warning("Failed to write web search cache for key %s", key)

        return sources