
import tiktoken

from app.core import settings

class ChunkingService:
    def __init__(self):
        self._encoder = tiktoken.get_encoding("cl100k_base")
        
    def split(self, text: str) -> list[str]:
        if not text or not text.strip():
            return []
        
        tokens = self._encoder.encode(text)
        total_tokens = len(tokens)
        
        if total_tokens <= 512:
            return [text]
        

        chunks = []
        start_idx = 0
        
        while start_idx < total_tokens:
            end_idx = min(start_idx + 512, total_tokens)
            
            chunk_tokens = tokens[start_idx:end_idx]
        
            chunk_text = self._encoder.decode(chunk_tokens)
            chunks.append(chunk_text)
        
            if end_idx == total_tokens:
                break
            
            start_idx += 462
        return chunks
        