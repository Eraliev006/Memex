
import asyncio
import uuid

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.workflows.document import DocumentWorkflows
from app.core.celery_app import celery_app
from app.core import engine


async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

    
@celery_app.task(name='process_document_task')
def process_document_task(doc_id: str):
    _doc_id: uuid.UUID = uuid.UUID(doc_id)
    
    async def runner():
        async with async_session_maker() as session:
            await DocumentWorkflows.run(_doc_id, session)
            
    asyncio.run(runner())
