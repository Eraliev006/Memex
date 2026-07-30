
import json
from typing import AsyncIterator

from groq import AsyncGroq

from app.core import settings
from app.schemas import ToolCall, LLMResponse, StreamEvent


class GroqLLM:
    def __init__(self, client: AsyncGroq):
        self.client = client
        self.model = settings.GROQ_MODEL
        self.max_tokens = settings.GROQ_MAX_TOKENS
    
    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        response = await self.client.chat.completions.create(
            messages=messages,  # type: ignore
            model=self.model,
            max_completion_tokens=self.max_tokens,
            top_p=1,
            temperature=0.5,
            stop=None,
            stream=True,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
        
    async def complete(self, messages: list[dict]) -> str:
        response = await self.client.chat.completions.create(
            messages=messages,  # type: ignore
            model=self.model,
            max_completion_tokens=self.max_tokens,
            top_p=1,
            temperature=0.5,
            stop=None,
            stream=False,
        )
        return response.choices[0].message.content or ""
    
    async def complete_with_tools(self, messages: list[dict], tools: list[dict]) -> LLMResponse:
        response = await self.client.chat.completions.create(
            messages=messages, # type: ignore
            model=self.model,
            max_completion_tokens=self.max_tokens,
            tools=tools, # type: ignore
            tool_choice='auto',
            temperature=0.5
        )
        
        message = response.choices[0].message
        tool_calls = None
        
        if message.tool_calls:
            tool_calls = [
                ToolCall(
                    id= tc.id,
                    tool_name=tc.function.name,
                    arguments=json.loads(tc.function.arguments)
                )
                for tc in message.tool_calls
            ]
        
        return LLMResponse(content=message.content, tool_calls=tool_calls)

    async def stream_with_tools(self, messages: list[dict], tools: list[dict]) -> AsyncIterator[StreamEvent]:
        response = await self.client.chat.completions.create(
            messages=messages, # type: ignore
            tools=tools, # type: ignore
            tool_choice='auto',
            model=self.model,
            max_completion_tokens=self.max_tokens,
            stream=True,
            stop=None,
            temperature=0.5,
            top_p=1
        ) 
        
        collected: dict[int, dict] = {}
        async for chunk in response:
            delta = chunk.choices[0].delta
            
            if delta.content:
                yield StreamEvent(content=delta.content)
                
            if delta.tool_calls:
                for tc_delta in delta.tool_calls:
                    index = tc_delta.index
                    if index not in collected:
                        collected[index] = {'id': tc_delta.id, 'name': tc_delta.function.name, "arguments": ""}
                    
                    if tc_delta.function.arguments:
                        collected[index]["arguments"] += tc_delta.function.arguments
        if collected:
            tool_calls = [
                ToolCall(
                    id=data['id'],
                    tool_name=data['name'],
                    arguments=json.loads(data['arguments'])
                )
                for data in collected.values()
            ]
            yield StreamEvent(tool_calls=tool_calls)