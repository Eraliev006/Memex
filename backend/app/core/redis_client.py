import redis.asyncio as redis

from app.core import settings

class RedisClient:
    def __init__(self):
        self.host = settings.REDIS_HOST
        self.client: redis.Redis | None = None
    
    async def connect(self):
        r = redis.Redis(
            host=self.host,
            decode_responses=True
        )
        self.client = r
    
    async def disconnect(self):
        if self.client:
            await self.client.aclose()
    
    async def store_session(self, user_id: str, family: str, jti: str, ttl: int) -> None:
        assert self.client
        pipe = self.client.pipeline()
        pipe.set(f"refresh:{user_id}:{family}", jti, ex=ttl)
        pipe.sadd(f"sessions:{user_id}", family)
        await pipe.execute()
    
    async def rotate(self, user_id: str, family: str) -> str | None:
        assert self.client
        key = f"refresh:{user_id}:{family}"
        return await self.client.getdel(key) # type: ignore
    
    async def revoke_session(self, user_id: str, family: str) -> None:
        assert self.client
        pipe = self.client.pipeline()
        pipe.delete(f"refresh:{user_id}:{family}")
        pipe.srem(f"sessions:{user_id}", family)
        await pipe.execute()
    
    async def revoke_all_sessions(self, user_id: str) -> None:
        assert self.client
        families = await self.client.smembers(f"sessions:{user_id}")
        if families:
            pipe = self.client.pipeline()
            for family in families:
                pipe.delete(f"refresh:{user_id}:{family}")
            pipe.delete(f"sessions:{user_id}")
            await pipe.execute()



redis_client = RedisClient()