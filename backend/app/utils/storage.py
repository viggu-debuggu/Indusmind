import os
import shutil
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import StorageException

class StorageProvider(ABC):
    """Abstract interface for modular file storage providers."""
    
    @abstractmethod
    def upload_file(self, file_data: BinaryIO, filename: str) -> str:
        """Uploads a file and returns its storage path or URL."""
        pass

    @abstractmethod
    def download_file(self, file_path: str) -> bytes:
        """Downloads a file and returns its binary content."""
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Deletes a file from storage."""
        pass

    @abstractmethod
    def get_file_url(self, file_path: str) -> str:
        """Gets a download URL for the file."""
        pass


class LocalStorageProvider(StorageProvider):
    """Local disk storage provider."""
    
    def __init__(self, base_path: str):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)
        logger.info("local_storage_initialized", path=self.base_path)

    def upload_file(self, file_data: BinaryIO, filename: str) -> str:
        try:
            target_path = os.path.join(self.base_path, filename)
            with open(target_path, "wb") as f:
                shutil.copyfileobj(file_data, f)
            logger.info("file_uploaded_local", filename=filename, path=target_path)
            return target_path
        except Exception as e:
            raise StorageException(f"Failed to upload local file: {str(e)}")

    def download_file(self, file_path: str) -> bytes:
        try:
            with open(file_path, "rb") as f:
                return f.read()
        except Exception as e:
            raise StorageException(f"Failed to read local file: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info("file_deleted_local", path=file_path)
                return True
            return False
        except Exception as e:
            raise StorageException(f"Failed to delete local file: {str(e)}")

    def get_file_url(self, file_path: str) -> str:
        # Return local path reference
        return f"/api/files/download?path={file_path}"


class S3StorageProvider(StorageProvider):
    """AWS S3 storage provider."""
    
    def __init__(self):
        try:
            import boto3
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.bucket_name = settings.AWS_BUCKET_NAME
            logger.info("s3_storage_initialized", bucket=self.bucket_name)
        except Exception as e:
            logger.warning("s3_storage_init_failed", error=str(e))
            self.s3_client = None

    def upload_file(self, file_data: BinaryIO, filename: str) -> str:
        if not self.s3_client or not self.bucket_name:
            raise StorageException("S3 Storage is not configured.")
        try:
            self.s3_client.upload_fileobj(file_data, self.bucket_name, filename)
            url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
            logger.info("file_uploaded_s3", filename=filename, url=url)
            return url
        except Exception as e:
            raise StorageException(f"Failed to upload file to S3: {str(e)}")

    def download_file(self, file_path: str) -> bytes:
        if not self.s3_client or not self.bucket_name:
            raise StorageException("S3 Storage is not configured.")
        try:
            filename = os.path.basename(file_path)
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=filename)
            return response["Body"].read()
        except Exception as e:
            raise StorageException(f"Failed to download file from S3: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            raise StorageException("S3 Storage is not configured.")
        try:
            filename = os.path.basename(file_path)
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=filename)
            logger.info("file_deleted_s3", filename=filename)
            return True
        except Exception as e:
            raise StorageException(f"Failed to delete file from S3: {str(e)}")

    def get_file_url(self, file_path: str) -> str:
        # Pre-signed URL or direct URL
        filename = os.path.basename(file_path)
        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": filename},
                ExpiresIn=3600
            )
        except Exception:
            return file_path


class AzureStorageProvider(StorageProvider):
    """Azure Blob Storage provider."""
    
    def __init__(self):
        try:
            from azure.storage.blob import BlobServiceClient
            self.blob_service_client = BlobServiceClient.from_connection_string(settings.AZURE_CONNECTION_STRING)
            self.container_name = settings.AZURE_CONTAINER_NAME
            logger.info("azure_storage_initialized", container=self.container_name)
        except Exception as e:
            logger.warning("azure_storage_init_failed", error=str(e))
            self.blob_service_client = None

    def upload_file(self, file_data: BinaryIO, filename: str) -> str:
        if not self.blob_service_client or not self.container_name:
            raise StorageException("Azure Storage is not configured.")
        try:
            blob_client = self.blob_service_client.get_blob_client(container=self.container_name, blob=filename)
            blob_client.upload_blob(file_data, overwrite=True)
            logger.info("file_uploaded_azure", filename=filename)
            return blob_client.url
        except Exception as e:
            raise StorageException(f"Failed to upload to Azure Blob: {str(e)}")

    def download_file(self, file_path: str) -> bytes:
        if not self.blob_service_client or not self.container_name:
            raise StorageException("Azure Storage is not configured.")
        try:
            filename = os.path.basename(file_path)
            blob_client = self.blob_service_client.get_blob_client(container=self.container_name, blob=filename)
            return blob_client.download_blob().readall()
        except Exception as e:
            raise StorageException(f"Failed to download from Azure Blob: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        if not self.blob_service_client or not self.container_name:
            raise StorageException("Azure Storage is not configured.")
        try:
            filename = os.path.basename(file_path)
            blob_client = self.blob_service_client.get_blob_client(container=self.container_name, blob=filename)
            blob_client.delete_blob()
            logger.info("file_deleted_azure", filename=filename)
            return True
        except Exception as e:
            raise StorageException(f"Failed to delete from Azure Blob: {str(e)}")

    def get_file_url(self, file_path: str) -> str:
        return file_path


class MinioStorageProvider(StorageProvider):
    """MinIO (S3-compatible) storage provider."""
    
    def __init__(self):
        try:
            import boto3
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.MINIO_ENDPOINT,
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
                region_name="us-east-1"
            )
            self.bucket_name = settings.MINIO_BUCKET
            logger.info("minio_storage_initialized", endpoint=settings.MINIO_ENDPOINT)
        except Exception as e:
            logger.warning("minio_storage_init_failed", error=str(e))
            self.s3_client = None

    def upload_file(self, file_data: BinaryIO, filename: str) -> str:
        if not self.s3_client or not self.bucket_name:
            raise StorageException("MinIO Storage is not configured.")
        try:
            self.s3_client.upload_fileobj(file_data, self.bucket_name, filename)
            url = f"{settings.MINIO_ENDPOINT}/{self.bucket_name}/{filename}"
            logger.info("file_uploaded_minio", filename=filename, url=url)
            return url
        except Exception as e:
            raise StorageException(f"Failed to upload to MinIO: {str(e)}")

    def download_file(self, file_path: str) -> bytes:
        if not self.s3_client or not self.bucket_name:
            raise StorageException("MinIO Storage is not configured.")
        try:
            filename = os.path.basename(file_path)
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=filename)
            return response["Body"].read()
        except Exception as e:
            raise StorageException(f"Failed to download from MinIO: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        if not self.s3_client or not self.bucket_name:
            raise StorageException("MinIO Storage is not configured.")
        try:
            filename = os.path.basename(file_path)
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=filename)
            logger.info("file_deleted_minio", filename=filename)
            return True
        except Exception as e:
            raise StorageException(f"Failed to delete from MinIO: {str(e)}")

    def get_file_url(self, file_path: str) -> str:
        filename = os.path.basename(file_path)
        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": filename},
                ExpiresIn=3600
            )
        except Exception:
            return file_path


def get_storage_provider() -> StorageProvider:
    """Factory to retrieve storage provider based on configuration."""
    provider_type = settings.STORAGE_PROVIDER.lower()
    
    if provider_type == "s3":
        return S3StorageProvider()
    elif provider_type == "azure":
        return AzureStorageProvider()
    elif provider_type == "minio":
        return MinioStorageProvider()
    else:
        return LocalStorageProvider(base_path=settings.LOCAL_STORAGE_PATH)
