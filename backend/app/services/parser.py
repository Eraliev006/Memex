from abc import ABC, abstractmethod
import asyncio
from io import BytesIO
from typing import Awaitable, Callable, TypeVar

from llama_cloud import AsyncLlamaCloud

T = TypeVar("T")

from app.core import settings

class BaseParser(ABC):
    @abstractmethod
    async def parse(self, file_bytes: bytes, filename: str) -> str | None:
        """Parse file and return extracted text."""
        pass
    
    
class LlamaParser(BaseParser):
    def __init__(self) -> None:
        self._parser = AsyncLlamaCloud(
            api_key=settings.LLAMA_CLOUD_API_KEY
        )
        
    async def _with_retry(self, fn: Callable[[],Awaitable[T]], retries: int = 3) -> T: # type: ignore
        for attempt in range(retries):
            try:
                return await fn()
            except Exception as e:
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
        
    async def parse(self, file_bytes: bytes, filename: str) -> str | None:
        async def create_file():
            return await self._parser.files.create(
                file=(filename, file_bytes, "application/pdf"),
                purpose="parse",
            )
            
        file_obj = await self._with_retry(create_file)
        async def run_parse():
            return await self._parser.parsing.parse(
                file_id=file_obj.id,
                tier="fast",
                version="latest",
                expand=["markdown_full"],
            )

        result = await self._with_retry(run_parse)

        return result.markdown_full