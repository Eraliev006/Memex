
import uuid

from pydantic import BaseModel


class ToolCall(BaseModel):
    id: str
    tool_name: str
    arguments: dict
    
class LLMResponse(BaseModel):
    content: str | None
    tool_calls: list[ToolCall] | None
    

class StreamEvent(BaseModel):
    content: str | None = None
    tool_calls: list[ToolCall] | None = None
    