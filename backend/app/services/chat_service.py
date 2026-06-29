from typing import AsyncIterator
from uuid import UUID

from app.services.llm import LLMService
from app.services.message import MessageService
from app.services.search_service import SearchService
from app.repositories.chat_session import ChatSessionRepository
from app.schemas.search_result import SearchResultItem
from app.enums.message import MessageStatus


class ChatService:
    def __init__(
        self,
        message_service: MessageService,
        search_service: SearchService,
        llm_service: LLMService,
        chat_session_repo: ChatSessionRepository,
    ):
        self._messages = message_service
        self._search = search_service
        self._llm = llm_service
        self._chat_session_repo = chat_session_repo

    async def chat(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        user_message: str,
        doc_ids: list[UUID] | None = None,
    ) -> AsyncIterator[str]:
        await self._messages.create_user_message(
            session_id=session_id,
            user_id=user_id,
            content=user_message,
        )

        history = await self._messages.get_context_history(
            chat_session_id=session_id,
            limit=10,
        )

        chunks: list[SearchResultItem] = await self._search.search(
            query=user_message,
            user_id=user_id,
            docs_ids=doc_ids,
        )

        context_text = self._build_context(chunks)

        llm_messages = self._build_messages(
            history=history,
            context=context_text,
            user_message=user_message,
        )

        assistant_msg = await self._messages.create_assistant_message(
            session_id=session_id,
        )

        full_response = ""
        final_status = MessageStatus.failed

        try:
            async for token in self._llm.stream(llm_messages):
                full_response += token
                yield token
            final_status = MessageStatus.completed
        finally:
            sources = (
                [
                    {
                        "chunk_id": str(c.chunk_id),
                        "document_id": str(c.document_id),
                        "text": c.text,
                        "score": c.score,
                    }
                    for c in chunks
                ]
                if final_status == MessageStatus.completed
                else None
            )
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

    def _build_messages(self, history, context: str, user_message: str) -> list[dict]:
        system_content = "You are a helpful assistant."
        if context:
            system_content += f"\n\nUse the following context to answer the question:\n\n{context}"

        messages: list[dict] = [{"role": "system", "content": system_content}]

        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": user_message})

        return messages
