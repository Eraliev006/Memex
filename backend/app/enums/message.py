
import enum


class MessageRole(str, enum.Enum):
    user = 'user'
    tool = 'tool'
    assistant = 'assistant'
    system = 'system'
    
    
class MessageStatus(str, enum.Enum):
    created = 'created'
    processing = 'processing'
    streaming = 'streaming'
    completed = 'completed'
    failed = 'failed'