from typing import AsyncIterator, Callable
from uuid import UUID, uuid4
import uuid

from fastapi import HTTPException

from app.services.llm import LLMService
from app.services.message import MessageService
from app.services.web_search import WebSearchService
from app.services.search_service import SearchService
from app.repositories.chat_session import ChatSessionRepository
from app.schemas.search_result import SearchResultItem
from app.schemas.source import DocsSource
from app.enums.message import MessageStatus
from app.services.react_agent import ReactAgent


QDRANT_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "qdrant_search",
        "description": "Search the user's uploaded documents for relevant information. Use this when the question might be answered by the user's own documents.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
            },
            "required": ["query"],
        },
    },
}

WEB_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": "Search the web for current information. Use this when the question is about recent events, or when the user's documents don't contain enough information.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
            },
            "required": ["query"],
        },
    },
}

class ChatService:
    def __init__(
        self,
        message_service: MessageService,
        search_service: SearchService,
        llm_service: LLMService,
        chat_session_repo: ChatSessionRepository,
        web_search_service: WebSearchService
    ):
        self._messages = message_service
        self._search = search_service
        self._llm = llm_service
        self._chat_session_repo = chat_session_repo
        self._web_search_service = web_search_service
        
    def _resolve_tools(self, search_scope: str) -> list[dict]:
        if search_scope == "docs":
            return [QDRANT_SEARCH_TOOL]
        if search_scope == "web":
            return [WEB_SEARCH_TOOL]
        return [QDRANT_SEARCH_TOOL, WEB_SEARCH_TOOL]  # both
    
    def _resolve_executors(self, search_scope: str, web_executor: Callable, qdrant_executor: Callable) -> dict:
        all_executors = {"web_search": web_executor, "qdrant_search": qdrant_executor}
        if search_scope == "docs":
            return {"qdrant_search": qdrant_executor}
        if search_scope == "web":
            return {"web_search": web_executor}
        return all_executors  # both
    

    async def chat(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        user_message: str,
        doc_ids: list[UUID] | None = None,
        search_scope: str = "docs",
    ) -> AsyncIterator[str]:
        session = await self._chat_session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        if session.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        await self._messages.create_user_message(
            session_id=session_id,
            user_id=user_id,
            content=user_message,
        )

        history = await self._messages.get_context_history(
            chat_session_id=session_id,
            limit=10,
        )

        llm_messages = self._build_messages(
            history=history,
            user_message=user_message,
        )

        assistant_msg = await self._messages.create_assistant_message(
            session_id=session_id,
        )
        
        collected_sources: list[dict] = []
        
        async def web_search_executor(query: str) -> list[dict]:
            sources = await self._web_search_service.search(query=query)
            dumped = [s.model_dump(mode="json") for s in sources]
            collected_sources.extend(dumped)
            return dumped

        async def qdrant_search_executor(query: str) -> list[dict]:
            chunks = await self._search.search(query=query, user_id=user_id, docs_ids=doc_ids)
            dumped = [
                DocsSource(
                    id=uuid4(),
                    source="docs",
                    title=c.metadata.get("document_title") or "",
                    snippet=c.text,
                    score=c.score,
                    document_name=c.metadata.get("document_title") or "",
                    doc_id=c.document_id,
                    chunk_id=c.chunk_id,
                    page=c.metadata.get("page"),
                ).model_dump(mode="json")
                for c in chunks
            ]
            collected_sources.extend(dumped)
            return dumped
            
        executors = self._resolve_executors(search_scope, web_search_executor, qdrant_search_executor)
        tools = self._resolve_tools(search_scope)
        
        agent = ReactAgent(llm=self._llm, executors=executors)

        full_response = ""
        final_status = MessageStatus.failed

        try:
            async for token in agent.run(messages=llm_messages, tools=tools):
                full_response += token
                yield token
            final_status = MessageStatus.completed
        finally:
            sources = collected_sources if (final_status == MessageStatus.completed and collected_sources) else None
            await self._messages.update_message(
                assistant_msg.id,
                content=full_response,
                status=final_status,
                sources=sources,
            )

    def _build_context(self, chunks: list[SearchResultItem]) -> str:
        if not chunks:
            return ""
        return "\n\n".join(
            f"[{c.metadata.get('document_title', 'document')}]\n{c.text}"
            for c in chunks
        )

    def _build_messages(self, history, user_message: str) -> list[dict]:
        system_content = "You are a helpful assistant with access to search tools."
        messages: list[dict] = [{"role": "system", "content": system_content}]

        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": user_message})

        return messages