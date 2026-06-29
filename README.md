

<h3 align='center'>Memex</h3>

<p align="center">
    AI-powered personal open-source knowledge base.
    <br />
    <br />
    <a href="#introduction"><strong>Introduction</strong></a> ·
    <a href="#tech-stack"><strong>Tech Stack</strong></a>
</p>



## Introduction
Memex is the modern, open-source personal knowledge base designed to turn your scattered documents into an interactive second brain. Powered by an intelligent ReAct agent, the platform seamlessly indexes your data and bridges the gap between your local knowledge and live web search for instant, contextual answers.



## Tech Stack
- [FastAPI](https://fastapi.tiangolo.com/) – framework
- [Python](https://www.python.org/) – language
- [React](https://react.dev/) – frontend framework
- [React Router v7](https://reactrouter.com/) – routing & SSR
- [TanStack Query](https://tanstack.com/query) – server state management
- [shadcn/ui](https://ui.shadcn.com/) – UI components
- [LangChain](https://www.langchain.com/) – LLM orchestration & ReAct agent
- [Qdrant](https://qdrant.tech/) – vector database
- [PostgreSQL](https://www.postgresql.org/) – relational database
- [Redis](https://redis.io/) – message broker & caching
- [Celery](https://docs.celeryq.dev/) – asynchronous task queue
- [Nginx](https://nginx.org/) – reverse proxy & rate limiting
- [AWS S3](https://aws.amazon.com/s3/) – object storage (or MinIO)
- [MinIO](https://min.io/) – self-hosted S3-compatible object storage
- [Docker & Compose](https://www.docker.com/) – local & server orchestration
- [Ollama](https://ollama.com/) – (optional) local LLM runner for 100% offline privacy



## Architecture
### Upload Flow
![Upload Flow](docs/upload-flow.png)

### Chat Flow  
![Chat Flow](docs/chat-flow.png)



## Quick Start
```bash
git clone https://github.com/Eraliev006/memex
cp .env.example .env
docker compose up -d
```