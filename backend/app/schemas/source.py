

import datetime
from typing import Annotated, Literal
import uuid

from pydantic import BaseModel, Field, HttpUrl


class BaseSource(BaseModel):
    id: uuid.UUID
    source: Literal['web', 'docs']
    title: str
    snippet: str
    score: float | None = None
    
class DocsSource(BaseSource):
    source: Literal['docs']
    document_name: str
    doc_id: uuid.UUID
    chunk_id: uuid.UUID
    page: int | None = None
    
    
class WebSource(BaseSource):
    source: Literal['web']
    url: HttpUrl
    published_at: datetime.datetime | None = None
    favicon: HttpUrl | None = None
    
Source = Annotated[DocsSource | WebSource, Field(discriminator='source')]