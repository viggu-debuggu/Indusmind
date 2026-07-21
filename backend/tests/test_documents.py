import pytest
from io import BytesIO
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import Base
from app.models.user import User
from app.models.document import DocumentModel
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.document_service import DocumentService
from app.core.exceptions import AppException

# Setup testing in-memory SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(name="db")
def db_fixture():
    """Provides a fresh database session for each test case."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Create test users for permissions
    admin = User(id=1, full_name="Admin User", email="admin@indusmind.ai", role="Admin", is_active=True, password_hash="dummy")
    engineer = User(id=2, full_name="Engineer User", email="eng@indusmind.ai", role="Engineer", is_active=True, password_hash="dummy")
    viewer = User(id=3, full_name="Viewer User", email="view@indusmind.ai", role="Viewer", is_active=True, password_hash="dummy")

    
    session.add_all([admin, engineer, viewer])
    session.commit()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_allowed_file_types(db):
    """Verifies that only supported file extensions are accepted."""
    service = DocumentService(db)
    file_data = BytesIO(b"dummy pdf content")

    # 1. Allowed type PDF
    doc = service.upload_document(
        file_data=file_data,
        original_filename="spec_sheet.pdf",
        document_name="Spec Sheet",
        uploaded_by=2 # Engineer
    )
    assert doc.file_extension == ".pdf"
    assert doc.version == 1

    # 2. Blocked type EXE
    with pytest.raises(AppException) as exc_info:
        service.upload_document(
            file_data=file_data,
            original_filename="malicious.exe",
            document_name="Malware",
            uploaded_by=2
        )
    assert exc_info.value.status_code == 400
    assert exc_info.value.error_code == "UNSUPPORTED_FILE_TYPE"


def test_file_size_limits(db):
    """Ensures oversized files are blocked."""
    service = DocumentService(db)
    
    # Simulate a file larger than 200MB
    oversized_data = BytesIO(b"x" * (201 * 1024 * 1024))
    
    with pytest.raises(AppException) as exc_info:
        service.upload_document(
            file_data=oversized_data,
            original_filename="huge_log.txt",
            document_name="Huge Logs",
            uploaded_by=2
        )
    assert exc_info.value.status_code == 400
    assert exc_info.value.error_code == "FILE_TOO_LARGE"


def test_duplicate_uploads_by_checksum(db):
    """Ensures duplicate uploads of same filename and checksum are blocked."""
    service = DocumentService(db)
    file_data = BytesIO(b"identical contents")

    # First upload
    service.upload_document(
        file_data=file_data,
        original_filename="report.txt",
        document_name="First Report",
        uploaded_by=2
    )

    # Duplicate upload
    with pytest.raises(AppException) as exc_info:
        service.upload_document(
            file_data=file_data,
            original_filename="report.txt",
            document_name="Second Report",
            uploaded_by=2
        )
    assert exc_info.value.status_code == 400
    assert exc_info.value.error_code == "DUPLICATE_UPLOAD"


def test_logical_versioning(db):
    """Verifies that uploading documents with overlapping logical names increments version indices."""
    service = DocumentService(db)
    
    doc1 = service.upload_document(
        file_data=BytesIO(b"version one content"),
        original_filename="blueprint_v1.pdf",
        document_name="Plant Layout",
        uploaded_by=2
    )
    assert doc1.version == 1

    doc2 = service.upload_document(
        file_data=BytesIO(b"version two content"),
        original_filename="blueprint_v2.pdf",
        document_name="Plant Layout",
        uploaded_by=2
    )
    assert doc2.version == 2


def test_metadata_modification_permissions(db):
    """Verifies RBAC rules when modifying document details."""
    service = DocumentService(db)
    
    # 1. Engineer uploads own document
    doc = service.upload_document(
        file_data=BytesIO(b"engineer work"),
        original_filename="work.pdf",
        document_name="Eng Work",
        uploaded_by=2
    )
    
    # 2. Engineer can update their own metadata
    update_schema = DocumentUpdate(description="Updated description by engineer")
    updated = service.update_document_metadata(doc.id, update_schema, updated_by=2)
    assert updated.description == "Updated description by engineer"
    
    # 3. Admins can update any document metadata
    admin_updated = service.update_document_metadata(doc.id, DocumentUpdate(category="SOP"), updated_by=1)
    assert admin_updated.category == "SOP"
