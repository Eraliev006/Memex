import asyncio
import json
from typing import AsyncIterator, Callable

from app.schemas import ToolCall
from app.providers.llm.protocol import LLMProtocol



class ReactAgent:
    def __init__(self, llm: LLMProtocol, executors: dict[str, Callable], max_iterations: int = 5):
        self._llm = llm
        self._executors = executors
        self._max_iterations = max_iterations

    async def _execute_tool_calls(self, tool_calls: list[ToolCall]) -> list[dict]:
        async def run_one(tc: ToolCall) -> dict:
            executor = self._executors[tc.tool_name]
            try:
                result = await executor(**tc.arguments)
                content = json.dumps(result)
            except Exception as e:
                content = json.dumps({"error": str(e)})
            return {
                "role": "tool",
                "tool_call_id": tc.id,
                "name": tc.tool_name,
                "content": content,
            }
        return await asyncio.gather(*(run_one(tc) for tc in tool_calls))

    async def run(self, messages: list[dict], tools: list[dict], tool_choice: dict | str = "auto") -> AsyncIterator[str]:
        for i in range(self._max_iterations):
            # форсированный tool_choice (конкретная функция) применяется только на первом
            # раунде — чтобы гарантировать хотя бы один поиск. На последующих раундах
            # tool_choice всегда 'auto', иначе модель будет обязана вызывать тот же тул
            # бесконечно и никогда не сможет дать финальный текстовый ответ.
            current_tool_choice = tool_choice if i == 0 else "auto"
            tool_calls = None
            async for event in self._llm.stream_with_tools(messages=messages, tools=tools, tool_choice=current_tool_choice):
                if event.content:
                    yield event.content
                if event.tool_calls:
                    tool_calls = event.tool_calls
                    
            if tool_calls is None:
                return
            
            messages.append({
                            "role": "assistant",
                            "tool_calls": [
                                {
                                    "id": tc.id,
                                    "type": "function",
                                    "function": {"name": tc.tool_name, "arguments": json.dumps(tc.arguments)},
                                }
                                for tc in tool_calls
                            ],
                        })
            tool_messages = await self._execute_tool_calls(tool_calls)
            messages.extend(tool_messages)
            
        raise RuntimeError("Max iterations reached")
