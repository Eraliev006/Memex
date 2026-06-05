from app.core import settings

from celery import Celery

REDIS_HOST = settings.REDIS_HOST

celery_app = Celery(
    'memex_task',
    broker=f'redis://{REDIS_HOST}:6379/0',
    backend=f"redis://{REDIS_HOST}:6379/0"
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc = True,
    imports=["app.tasks.document"]
)

