# Ревью кода — путеводитель по сценариям

Читай перед тем как что-то писать сегодня. Задача: вспомнить как что устроено, пройти каждый сценарий руками в браузере/Swagger и свериться с описанием. Код нигде не менялся под это ревью — это чистое описание текущего состояния.

---

## 1. Загрузка документов

**Сценарий в UI:** `/documents` → перетащить файл в `UploadZone` (или выбрать) → карточка появляется в статусе `pending`, страница поллит `GET /document` каждые 2 сек пока есть документ в `pending`/`processing`, статус сам обновится на `ready` (или `failed`).

**Путь по коду:**
1. `POST /api/v1/document/upload` (`backend/app/api/routes/document.py:19`) — лимит **5 запросов/минуту на пользователя** (`@limiter.limit("5/minute", key_func=get_user_id)`). Если долбишь загрузку в тестах — упрёшься в этот лимит.
2. `DocumentService.upload_document` (`app/services/document.py:23`):
   - проверка расширения (`pdf`, `md`, `txt`, `docx`)
   - файл льётся в MinIO (`S3Storage.upload_documents`) по пути `documents/{uuid}.{ext}`
   - создаётся строка в Postgres со статусом `pending`
   - **важно:** `process_document_task.delay(...)` вызывается **до** `commit()` — Celery-воркер может успеть взять таску раньше, чем транзакция закоммитится в БД, тогда воркер её просто не найдёт (`try_start_processing` вернёт `None`/`False`) и молча выйдет. Race theoretically possible, но т.к. Celery берёт таску не мгновенно, на практике редко стреляет. Держи в уме если увидишь документ вечно висящий в `pending`.
3. Celery-таска `process_document_task` (`app/tasks/document.py:18`) — просто открывает новую сессию БД и вызывает `DocumentWorkflows.run`.
4. `DocumentWorkflows.run` (`app/workflows/document.py:12`) — сердце пайплайна:
   - `try_start_processing(doc_id)` — атомарный переход `pending → processing`, защита от двойной обработки, если `False` (уже кто-то забрал) — тихий `return`.
   - скачать файл из MinIO → распарсить через `LlamaParser` → разбить на чанки (`ChunkingService.split`) → если чанков нет (`not chunks`) → `ValueError`.
   - эмбеддинги чанков батчем (`EmbeddingService.create_embeddings`, Voyage).
   - для каждого чанка формируется `PointStruct` (Qdrant) и параллельно dict для Postgres (`chunks` таблица) — **дублирование данных**: контент и метаданные лежат и в Qdrant payload, и в Postgres `chunks`. Это осознанно (Qdrant — для векторного поиска, Postgres `chunks` — источник истины/для будущего Graph RAG через `entity_mentions.chunk_id`).
   - `qdrant.upsert_points` → `chunk_repo.bulk_create` → статус документа `ready`, коммит.
   - **except:** статус `failed`, плюс попытка подчистить Qdrant-точки, которые могли частично записаться до ошибки.

**На что проверить руками:** загрузить документ, последить `docker compose logs celery_worker -f`, убедиться что статус доходит до `ready`, найти чанки в Postgres (`SELECT * FROM chunks WHERE document_id = ...`) и в Qdrant (`curl localhost:6333/collections/.../points/scroll`).

---

## 2. Чат (ReAct агент)

**Сценарий в UI:** `/chat` → выбрать search_scope (пилюли `docs`/`web`/`both`, `frontend/app/pages/chat/index.tsx`) → написать сообщение → ответ стримится через SSE.

**Путь по коду:**
1. `POST /api/v1/chat/{session_id}/message` (`app/api/routes/chat.py:88`) — тело: `{message, search_scope, doc_ids}`. Оборачивает `chat_service.chat(...)` в SSE-генератор (`data: <token>\n\n`), при исключении шлёт `data: [ERROR]\n\n`, в любом случае в конце — `data: [DONE]\n\n`.
2. `ChatService.chat` (`app/services/chat_service.py:84`):
   - проверка владения сессией (404/403)
   - сохраняет user-сообщение, тянет последние 10 сообщений как историю (`get_context_history`)
   - строит системный промпт через `_build_messages` — тут зашиты все правила которые мы чинили: обязательный вызов тула вместо угадывания, запрет придумывать что "искал", честный ответ если тул ничего не нашёл, игнор нерелевантных результатов для small talk.
   - **важный нюанс:** `search_scope` определяет и список тулов (`_resolve_tools`), и `tool_choice` (`_resolve_tool_choice`) — при `docs`/`web` тул форсится (гарантированный хотя бы один вызов), при `both` — `"auto"`, модель сама решает.
   - создаёт пустое assistant-сообщение (`status=streaming`) сразу, до начала генерации — чтобы в БД уже была строка на случай обрыва.
   - создаёт `ReactAgent`, гоняет `agent.run(...)`, копит `full_response` из стримящихся токенов.
   - `finally`: если всё ок и есть источники — сохраняет `sources`, иначе `sources=None`; статус `completed` только если цикл дошёл до конца без исключения, иначе `failed` (дефолт, который никогда не перезаписывается при exception).
3. `ReactAgent.run` (`app/services/react_agent.py:32`) — до 5 итераций:
   - форсированный `tool_choice` **только на первой итерации** (комментарий в коде прямо объясняет почему — иначе модель обязана дёргать тул бесконечно).
   - стримит контент как есть, копит tool_calls.
   - если модель вернула чистый текст без tool_calls — `return` (конец диалога).
   - иначе — выполняет все tool calls параллельно (`asyncio.gather`), **ошибки тулов не роняют gather** — они превращаются в `{"error": ...}` JSON и уходят как содержимое tool-сообщения, модель сама увидит ошибку и отреагирует текстом.
   - после 5 итераций без финального текста — `RuntimeError("Max iterations reached")` (уйдёт в `[ERROR]` на фронт).
4. Исполнители тулов живут прямо в `ChatService.chat` как замыкания (`qdrant_search_executor`, `web_search_executor`) — оба параллельно копят `collected_sources` для итогового ответа (то что уходит в UI как источники).

**На что проверить руками:** спросить что-то из своих доков (scope=`docs`), что-то текущее (scope=`web`), и что-то смешанное (scope=`both`) — последи в логах какой тул реально вызвался.

---

## 3. Сессия чата

**Сценарий в UI:** список сессий в сайдбаре чата → создание новой → переименование → удаление → история сообщений подгружается при открытии.

**Путь по коду:**
- `ChatSessionService` (`app/services/chat_session_service.py`) — CRUD + `get_owned_session` (публичный метод, раньше был `_get_owned_session`, переименовали при разборе IDOR) — единая точка проверки владения (404 если сессии нет, 403 если чужая).
- Листинг — курсорная пагинация по `(last_message_at, id)` (`get_chat_list`), не offset-based.
- `MessageService.get_history` (`app/services/message.py:35`) — **здесь** финально живёт fix IDOR-уязвимости на `GET /{session_id}/messages`: проверка владения сделана прямо в сервисе через собственный `_chat_repo`, а не в отдельном сервисе на уровне роута (осознанное решение — единообразно с `create()` в том же файле).
- **Заметь:** `ChatService.chat` тоже сама по себе проверяет владение сессией (строки 93-97) — то есть проверка владения продублирована в двух местах (`ChatService.chat` и `MessageService.get_history`), но не является багом — это два разных входа (отправка сообщения vs чтение истории), каждый со своей независимой проверкой. Не пытайся "унифицировать" это в отдельный shared-guard без необходимости.

**На что проверить руками:** попробовать открыть чужую (не свою) сессию по ID через Swagger (заменить UUID) — ожидать 403/404, не 200.

---

## 4. Reranking

**Статус: не реализовано.** Проверено: `find app -iname "*rerank*"` — пусто.

Сейчас `SearchService.search` (`app/services/search_service.py`) → `QdrantService.search` (`app/services/qdrant.py:56`) — чистый косинусный top-`k=5`, без порога релевантности, без reranking. Отсюда и жалоба "поиск по докам плохой" — если ничего реально релевантного нет, всё равно вернутся 5 ближайших по вектору кусков.

План (Фаза 1 в `docs/plan_today.md`, детально — в plan-mode файле): двухэтапный retrieval — over-fetch ~20 кандидатов из Qdrant → Voyage rerank (`rerank-2`) → top-5 по реальной релевантности + отсечение по `RERANK_MIN_SCORE`. Ты решил писать это сам сегодня.

**На что проверить руками (после того как напишешь):** вопрос про тему которой вообще нет в документах → `qdrant_search` должен вернуть пусто, а не "притянутые" чанки.

---

## 5. Ротация токена

**Сценарий в UI:** невидимый пользователю — при истечении access-токена (30 мин) фронт дергает `/api/v1/auth/refresh` (httpOnly cookie с refresh-токеном уходит автоматически), получает новую пару.

**Путь по коду (`app/services/auth.py:131`, `refresh_tokens`):**
1. Декодируется JWT refresh-токен (подпись + `type == "refresh"`).
2. `RedisClient.rotate(user_id, family)` (`app/core/redis_client.py:28`) — `GETDEL` по ключу `refresh:{user_id}:{family}` — атомарно читает и сразу удаляет старый `jti`. Это и есть "ротация": использованный refresh-токен нельзя переиспользовать физически, ключ в Redis исчезает сразу после первого использования.
3. Если `old_jti is None` — в Redis вообще нет такой сессии (уже потрачена или никогда не существовала) → 401.
4. **Reuse detection:** если `old_jti != payload['jti']` (токен из запроса не совпадает с тем, что реально было последним валидным для этой `family`) → `revoke_all_sessions` для юзера целиком + 401. Сценарий: если старый (уже использованный) refresh-токен где-то утёк и кто-то пытается его переиспользовать повторно — вся "семья" сессий этого пользователя убивается разом. Обрати внимание: этот кейс сработает только если у тебя уже есть **свежий** jti в Redis, отличный от предъявленного — то есть детектится именно повторное использование, а не первое использование протухшего токена.
5. Если всё ок — новый refresh-токен создаётся **в той же `family`**, `store_session` с новым `jti`. Access-токен — просто новый JWT с 30-минутным сроком, без состояния в Redis.

**Ключевая структура в Redis:** `refresh:{user_id}:{family}` → текущий валидный `jti` (TTL = 7 дней), `sessions:{user_id}` → set всех активных `family` (используется для `revoke_all_sessions`/логаута со всех устройств).

**На что проверить руками:** залогиниться → `POST /auth/refresh` дважды подряд с одним и тем же (первым) refresh-токеном из cookie — второй раз должен убить всю сессию (проверить через `redis-cli SMEMBERS sessions:{user_id}` — должно опустеть).

---

## 6. Google авторизация

**Сценарий в UI:** `/login` → кнопка `GoogleButton` → редирект на Google OAuth consent → редирект обратно на `VITE_GOOGLE_REDIRECT_URI` (`/auth/google/callback`) с `?code=...` → страница `auth-google-callback` отправляет `code` на бэкенд.

**Путь по коду:**
1. `POST /api/v1/auth/login/google` (`app/api/routes/auth.py:47`) принимает `{code}`.
2. `AuthService.login_with_google` (`app/services/auth.py:67`) → `GoogleAuthService.exchange_code` (`app/services/google_auth.py:24`) — меняет `code` на Google id_token через `POST https://oauth2.googleapis.com/token`.
3. `get_user_info_from_id_token` — **важно:** это не просто decode без проверки — реально валидируется подпись через JWKS Google (`PyJWKClient`, кэширует ключи), плюс проверка `audience` (наш `GOOGLE_CLIENT_ID`) и `issuer`. Без этого кто угодно мог бы подделать id_token.
4. Дальше логика связывания аккаунта: ищем юзера по `google_id` → если нет, ищем по `email` (существующий пароль-аккаунт получает привязанный `google_id`) → если и там нет — создаём нового `UserCreateWithGoogle`.
5. Токен-пара выдаётся так же как при обычном логине (та же `family`/Redis-сессия схема).

**На что проверить руками:** залогиниться Google-аккаунтом, у которого email совпадает с уже существующим пароль-аккаунтом — убедиться что произошла привязка (`google_id` проставился), а не создание дубликата пользователя.

---

## 7. Celery-таски

**Что есть сейчас:** ровно одна таска — `process_document_task` (`app/tasks/document.py`), фигурирует в `celery_app.conf.imports`. Отдельного модуля тасок для чата/graph нет — они появятся только с Фазой 2 (`extract_graph_task`).

**Конфиг** (`app/core/celery_app.py`): брокер и backend — один и тот же Redis (`db 0`), `task_serializer='json'`. Воркер поднимается отдельным контейнером `celery_worker` в docker-compose (тем же образом `memex:latest`, что и backend).

**Механизм таски:** т.к. вся остальная кодовая база async, а Celery-таска сама по себе синхронная функция — таска оборачивает `async def runner()` и гонит его через `asyncio.run(...)`. Отдельный `async_sessionmaker`, привязанный к `celery_db_engine` (не тот же engine, что у FastAPI — на всякий случай изолированный пул соединений для воркера).

**На что проверить руками:** `docker compose logs celery_worker -f` во время загрузки документа — увидеть что таска реально забрана и выполнена (сейчас, до Фазы 3, залогировано будет мало — почти ничего кроме traceback при ошибке, это тоже то, что чинит Фаза 3).

---

## Что не покрыто этим ревью (не спрашивал — но рядом)
- `Rerank`/`Graph RAG`/структурированные логи — не существуют в коде, это Фазы 1-3 плана.
- `docker compose ps` сейчас показывает backend как `unhealthy` — это ложная тревога: healthcheck дергает `curl` внутри контейнера, а его там нет (`exec: "curl": executable file not found`). Приложение реально работает (проверено — `/docs` отдаёт 200). Не тратить время на "починку" этого, если только сам не захочешь поправить healthcheck на `python -c` или `wget`.
