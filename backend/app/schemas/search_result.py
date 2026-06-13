import uuid

from pydantic import BaseModel
    
class SearchResultItem(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    text: str
    score: float
    metadata: dict
    

class SearchResult(BaseModel):
    items: list[SearchResultItem]