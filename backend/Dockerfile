FROM python:3.13-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev

COPY ./backend/app /app/app
COPY ./backend/alembic.ini /app/alembic.ini

RUN useradd -u 1001 -m appuser && chown -R appuser:appuser /app
USER appuser

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]