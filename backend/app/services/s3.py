from aiobotocore.session import get_session
from fastapi import UploadFile

from app.core import settings

class S3Storage:
    def __init__(self):
        self.session = get_session()
        self.bucket_name = settings.S3_BUCKET_NAME
        
    def _client_params(self):
        return {
            "service_name": "s3",
            "endpoint_url": settings.S3_ENDPOINT_URL,
            "aws_access_key_id": settings.S3_ACCESS_KEY,
            "aws_secret_access_key": settings.S3_SECRET_KEY,
            "region_name": "us-east-1"
        }
        
    async def upload_documents(self, file_bytes: bytes, object_key: str, content_type: str = "application/pdf") -> str:
        """Upload document in S3 buckets

        Args:
            document (UploadFile): Document for uploading
            object_key (str):

        Returns:
            str: return upload path
        """
        
        async with self.session.create_client(**self._client_params()) as client:
            await client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=file_bytes,
                ContentType=content_type
            ) # type: ignore
            
            return object_key
    
    async def download_documents(self, storage_path: str):
        """Download documents from S3 storage by storage path

        Args:
            storage_path (str): document's path in storage
        """
        async with self.session.create_client(**self._client_params()) as client:
            response = await client.get_object(
                Bucket=self.bucket_name,
                Key=storage_path
            ) # type: ignore
            
            return await response['Body'].read() # type: ignore