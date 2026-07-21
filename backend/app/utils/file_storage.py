from app.utils.storage import get_storage_provider, StorageProvider, StorageException

def get_file_storage() -> StorageProvider:
    """Returns the globally configured StorageProvider instance."""
    return get_storage_provider()
