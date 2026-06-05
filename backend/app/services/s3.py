from aiobotocore.session import get_session
from fastapi import UploadFile

from app.core import settings

class S3Storage:
    def __init__(self):
        self.session = get_session()
        self.bucket_name = settings.S3_BUCKET_NAME
        
    async def upload_documents(self, file: UploadFile, object_key: str) -> str:
        """Upload document in S3 buckets

        Args:
            document (UploadFile): Document for uploading
            object_key (str):

        Returns:
            str: return upload path
        """
        
        async with self.session.create_client(
            's3',
            endpoint_url = settings.S3_ENDPOINT_URL,
            aws_access_key_id = settings.S3_ACCESS_KEY,
            aws_secret_access_key = settings.S3_SECRET_KEY,
            region_name="us-east-1"
        ) as client:
            file_content = await file.read()
            
            await client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=file_content,
                ContentType=file.content_type
            ) # type: ignore
            
            return object_key