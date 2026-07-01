# Memex — Plan до 10 июля

## Что строим (заморожено)
Пользователь загружает документы → задаёт вопросы → получает стриминг-ответ из документов + из интернета. Автоназвание чатов. Hybrid search.

---

## Порядок (не менять)

### Шаг 1 — Критические баги (сначала это, потом всё остальное)
- [✅] `alembic revision --autogenerate -m "add_chat_sessions_and_messages"` + `upgrade head`
- [✅] `create_chat_session` добавить `user_id` параметр (`chat_session_service.py:17`)
- [✅ ] chunk_id добавить в Qdrant payload (`workflows/document.py`) + фикс `_mapping` (`search_service.py:22`)
- [✅] `except:` → `except Exception:` (`document.py:41`)
- [✅] `ValueError` → `HTTPException(404)` (`message.py:25`)
- [✅] `asyncio_mode = "auto"` в `pyproject.toml`

### Шаг 2 — ChatService + streaming
- [ ] `uv add anthropic` - заменен на groq
- [✅] `ANTHROPIC_API_KEY` + `LLM_PROVIDER` в `Settings` (`core/config.py`)
- [✅] `providers/llm/protocol.py` — `LLMProtocol` (stream + complete)
- [✅] `providers/llm/anthropic.py` — `AnthropicProvider` - Groq
- [✅] `get_llm_provider()` в `core/providers.py`
- [ ] `status` поле в `MessageCreate` (`schemas/message.py`) - зачем?
- [ ] Реализовать `ChatService` (`services/chat_service.py`)
- [ ] Создать `routes/chat.py`
- [ ] Зарегистрировать роут в `api/main.py`
- [ ] DI в `deps.py`
- [ ] Smoke test: curl → SSE stream с источниками

### Шаг 3 — Web search
- [ ] `uv add tavily-python` (или SerpAPI)
- [ ] `WebSearchService` — обёртка вокруг API
- [ ] В `ChatService`: если Qdrant вернул < 3 чанков → добавить web результаты в контекст
- [ ] В ответе помечать источник: `"source": "document"` или `"source": "web"`

### Шаг 4 — Деплой
- [ ] `uv remove langchain llama-cloud` + `uv add pypdf`
- [ ] `.env.example`
- [ ] GitHub Actions CI (`.github/workflows/ci.yml`)
- [ ] Hetzner VPS — `docker compose up -d`
- [ ] Домен + HTTPS

### Шаг 5 — Hybrid search
- [ ] `uv add fastembed`
- [ ] Sparse vectors при индексации документа (`workflows/document.py`)
- [ ] Qdrant named vectors: `dense` + `sparse`
- [ ] `QdrantService.search` → hybrid query (RRF fusion)

### Шаг 6 — Финальный polish
- [ ] Автоназвание чата (1 LLM-вызов после первого сообщения)
- [ ] 10+ тестов
- [ ] README: архитектура, why each tech, демо GIF
- [ ] Заполнить метрики: latency, кол-во тестов, live URL

---

## После деплоя — строим параллельно с поиском работы
- GraphRAG / knowledge graph
- Shared workspaces
- Агенты / ReAct
- (Frontend — отдельное решение, не сейчас)

---

## Файлы с деталями
- `advice/master_plan.md` — критические баги с кодом
- `advice/execution_plan.md` — ChatService с кодом
- `advice/architecture_decisions.md` — что говорить на интервью
- `advice/interview_preparation.md` — вопросы и ответы
- `advice/resume.md` — буллеты для резюме
