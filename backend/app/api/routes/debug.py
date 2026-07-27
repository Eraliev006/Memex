# app/api/routes/debug.py
from fastapi import APIRouter, Depends

from app.api.deps import WebSearchServiceDep


router = APIRouter(prefix="/debug", tags=["debug"])


@router.post("/web-search")
async def debug_web_search(
    query: str,
    service: WebSearchServiceDep,
    max_results: int = 5,
):
    return await service.search(query=query, max_results=max_results)