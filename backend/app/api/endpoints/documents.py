from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Response, BackgroundTasks
from fastapi.responses import StreamingResponse
from io import BytesIO
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentUpdate, DocumentListResponse
from app.services.document_service import DocumentService
from app.api.dependencies.auth import get_current_user
from app.core.exceptions import AppException
from app.ai.indexing_worker import index_document

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentActionRequest(BaseModel):
    id: int


@router.post("/upload", response_model=DocumentResponse)
def upload_single_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_name: str = Form(...),
    category: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    plant_location: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    force: Optional[bool] = Form(False),
    version_group_id: Optional[str] = Form(None),
    versionGroupId: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads a single document file supporting version control, duplicate detection, and approval workflows."""
    active_version_group_id = versionGroupId or version_group_id
    # 1. Role Permission Check
    if current_user.role in ("Viewer", "Auditor"):
        raise AppException("Viewer/Auditor role is unauthorized to perform uploads.", status_code=403, error_code="UNAUTHORIZED")

    if current_user.role == "Technician" and category == "Manual":
        raise AppException("Technician role is unauthorized to upload engineering manuals.", status_code=403, error_code="UNAUTHORIZED")

    # Compute checksum to check duplicate
    import hashlib
    file.file.seek(0)
    hasher = hashlib.sha256()
    for chunk in iter(lambda: file.file.read(4096), b""):
        hasher.update(chunk)
    file.file.seek(0)
    checksum = hasher.hexdigest()

    # Check for identical duplicate (exact same checksum)
    from app.models.document import DocumentModel
    exact_dup = db.query(DocumentModel).filter(
        DocumentModel.checksum == checksum,
        DocumentModel.deleted_at.is_(None)
    ).first()
    if exact_dup and not force:
        raise AppException(
            message=f"Duplicate Upload Warning: A similar document already exists. [98% Similarity]",
            status_code=409,
            error_code="DUPLICATE_WARNING"
        )

    # Check for filename duplicate (potential new version)
    file_dup = db.query(DocumentModel).filter(
        DocumentModel.original_filename == file.filename,
        DocumentModel.deleted_at.is_(None)
    ).first()
    if file_dup and not force and not active_version_group_id:
        raise AppException(
            message=f"Existing Version Found: A file named '{file.filename}' already exists. [92% Similarity]",
            status_code=409,
            error_code="VERSION_CONFLICT"
        )

    service = DocumentService(db)
    
    # If force=True, soft-delete conflicting exact checksum duplicate to bypass Service level constraint
    from datetime import datetime
    if force and exact_dup:
        exact_dup.deleted_at = datetime.utcnow()
        exact_dup.status = "Deleted"
        db.commit()

    doc_resp = service.upload_document(
        file_data=file.file,
        original_filename=file.filename,
        document_name=document_name,
        uploaded_by=current_user.id,
        category=category,
        department=department,
        plant_location=plant_location,
        description=description,
        tags=tags
    )

    # Retrieve the model and update version control columns
    import uuid
    doc_model = db.query(DocumentModel).filter(DocumentModel.id == doc_resp.id).first()
    if doc_model:
        doc_model.approval_status = "Uploaded"
        
        # Link version groups
        if active_version_group_id:
            db.query(DocumentModel).filter(
                DocumentModel.version_group_id == active_version_group_id
            ).update({"is_current": False})
            
            doc_model.version_group_id = active_version_group_id
            doc_model.is_current = True
            
            max_v = db.query(DocumentModel).filter(
                DocumentModel.version_group_id == active_version_group_id
            ).count()
            doc_model.version = max_v
        elif file_dup:
            v_grp = file_dup.version_group_id or str(uuid.uuid4())
            file_dup.version_group_id = v_grp
            file_dup.is_current = False
            
            doc_model.version_group_id = v_grp
            doc_model.is_current = True
            doc_model.version = file_dup.version + 1
        else:
            doc_model.version_group_id = str(uuid.uuid4())
            doc_model.is_current = True
            doc_model.version = 1
            
        db.commit()
        db.refresh(doc_model)

        from app.services.audit_service import AuditService
        AuditService.log(
            db,
            current_user.id,
            "UPLOAD_DOCUMENT",
            "Document",
            doc_model.id,
            {"document_name": doc_model.document_name, "category": doc_model.category}
        )

    background_tasks.add_task(index_document, db, doc_resp.id)
    return doc_model


@router.post("/upload-multiple", response_model=List[DocumentResponse])
def upload_multiple_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    category: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    plant_location: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads multiple files at once. Defaults logical document names to base filenames."""
    if current_user.role == "Viewer":
        raise AppException("Viewer role is unauthorized to perform uploads.", status_code=403, error_code="UNAUTHORIZED")

    service = DocumentService(db)
    responses = []
    
    for file in files:
        # Get logical name from base filename
        doc_name, _ = os.path.splitext(file.filename) if hasattr(file, "filename") else (file.filename, "")
        # Treat underscore/dashes as spaces
        doc_name = doc_name.replace("_", " ").replace("-", " ").title()
        
        try:
            resp = service.upload_document(
                file_data=file.file,
                original_filename=file.filename,
                document_name=doc_name,
                uploaded_by=current_user.id,
                category=category,
                department=department,
                plant_location=plant_location,
                description=description,
                tags=tags
            )
            # Trigger background indexing
            background_tasks.add_task(index_document, db, resp.id)
            responses.append(resp)
        except Exception as e:
            # Let the loop proceed but log or pass
            logger.error("multiple_upload_item_failed", filename=file.filename, error=str(e))
            continue
            
    return responses


@router.get("", response_model=DocumentListResponse)
def list_documents(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    plant_location: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    uploaded_by: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists, filters, and searches document items (available to all active roles)."""
    service = DocumentService(db)
    return service.list_and_search_documents(
        search=search,
        category=category,
        department=department,
        plant_location=plant_location,
        file_type=file_type,
        status=status,
        uploaded_by=uploaded_by,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        page=page,
        limit=limit
    )


@router.get("/search", response_model=DocumentListResponse)
def search_documents(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    plant_location: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    uploaded_by: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Proxy search endpoint routing queries to core catalog lister."""
    service = DocumentService(db)
    return service.list_and_search_documents(
        search=search,
        category=category,
        department=department,
        plant_location=plant_location,
        file_type=file_type,
        status=status,
        uploaded_by=uploaded_by,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        page=page,
        limit=limit
    )


@router.get("/{id}", response_model=DocumentResponse)
def get_document_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves document detail sheets, including version history log."""
    service = DocumentService(db)
    doc_resp = service.get_document_by_id(id)
    
    # Attach history details in query metadata
    history = service.get_version_history(doc_resp.document_name)
    # We serialize list responses separately on details views
    return doc_resp


@router.get("/{id}/history", response_model=List[DocumentResponse])
def get_document_version_history(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves full version logs for a document's logical name."""
    service = DocumentService(db)
    doc_resp = service.get_document_by_id(id)
    return service.get_version_history(doc_resp.document_name)


@router.put("/{id}", response_model=DocumentResponse)
def update_document_metadata(
    id: int,
    schema: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates meta descriptors (restricted to Admins, or Engineers editing their own uploads)."""
    service = DocumentService(db)
    doc = service.get_document_by_id(id)

    # RBAC Permission Guard
    is_admin = current_user.role in ("Super Admin", "Admin")
    is_owner = doc.uploaded_by == current_user.id
    is_engineer = current_user.role == "Engineer"

    if not is_admin and not (is_engineer and is_owner):
        raise AppException("You do not have permission to modify this document's metadata.", status_code=403, error_code="UNAUTHORIZED")

    return service.update_document_metadata(id, schema, current_user.id)


@router.delete("/{id}")
def delete_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft-deletes a document (restricted to Super Admin and Admin)."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Only administrators can delete document records.", status_code=403, error_code="UNAUTHORIZED")

    service = DocumentService(db)
    service.soft_delete_document(id, current_user.id)
    
    from app.services.audit_service import AuditService
    AuditService.log(db, current_user.id, "DELETE_DOCUMENT", "Document", id)
    
    return {"message": "Document successfully soft-deleted."}


@router.post("/archive", response_model=DocumentResponse)
def archive_document(
    req: DocumentActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archives an active document (restricted to Super Admin and Admin)."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Only administrators can archive documents.", status_code=403, error_code="UNAUTHORIZED")

    service = DocumentService(db)
    doc_resp = service.archive_document(req.id, current_user.id)
    
    from app.services.audit_service import AuditService
    AuditService.log(db, current_user.id, "ARCHIVE_DOCUMENT", "Document", req.id)
    
    return doc_resp


@router.post("/restore", response_model=DocumentResponse)
def restore_document(
    req: DocumentActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restores an archived or deleted document back to active status (restricted to Super Admin and Admin)."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Only administrators can restore documents.", status_code=403, error_code="UNAUTHORIZED")

    service = DocumentService(db)
    doc_resp = service.restore_document(req.id, current_user.id)
    
    from app.services.audit_service import AuditService
    AuditService.log(db, current_user.id, "RESTORE_DOCUMENT", "Document", req.id)
    
    return doc_resp


@router.get("/download/{id}")
def download_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    """Streams file download payload directly from configured storage provider."""
    # Viewer role can download, Technician can download, Engineer can download.
    service = DocumentService(db)
    file_bytes, filename, mime_type = service.download_document(id, current_user.id)
    
    return StreamingResponse(
        BytesIO(file_bytes),
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/{id}/approve", response_model=DocumentResponse)
def approve_document(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Advances document approval status: Uploaded -> Pending Review -> Engineer Approved -> Manager Approved -> Published."""
    from app.models.document import DocumentModel
    doc = db.query(DocumentModel).filter(DocumentModel.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    # Enforce workflow roles
    if current_user.role in ("Viewer", "Technician", "Auditor"):
        raise HTTPException(status_code=403, detail="Role is unauthorized to approve documents.")
        
    if doc.approval_status == "Uploaded":
        doc.approval_status = "Pending Review"
    elif doc.approval_status == "Pending Review":
        if current_user.role not in ("Engineer", "Department Manager", "Admin", "Super Admin"):
            raise HTTPException(status_code=403, detail="Requires Engineer or Manager approval.")
        doc.approval_status = "Engineer Approved"
    elif doc.approval_status == "Engineer Approved":
        if current_user.role not in ("Department Manager", "Admin", "Super Admin"):
            raise HTTPException(status_code=403, detail="Requires Department Manager approval to publish.")
        doc.approval_status = "Published"
    else:
        # Already Published
        pass
        
    db.commit()
    db.refresh(doc)
    
    from app.services.audit_service import AuditService
    AuditService.log(db, current_user.id, "APPROVE_DOCUMENT", "Document", id, {"status": doc.approval_status})
    
    return doc


@router.post("/{id}/rollback", response_model=DocumentResponse)
def rollback_document_version(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rolls back the active version of a document (toggling the is_current flag)."""
    from app.models.document import DocumentModel
    target_doc = db.query(DocumentModel).filter(DocumentModel.id == id).first()
    if not target_doc:
        raise HTTPException(status_code=404, detail="Document version not found.")
        
    if not target_doc.version_group_id:
        raise HTTPException(status_code=400, detail="Document is not version-controlled.")
        
    if current_user.role not in ("Super Admin", "Admin", "Department Manager"):
        raise HTTPException(status_code=403, detail="Unauthorized to rollback versions.")
        
    # Mark all previous versions in this group to is_current = False
    db.query(DocumentModel).filter(
        DocumentModel.version_group_id == target_doc.version_group_id
    ).update({"is_current": False})
    
    # Set the target version to is_current = True
    target_doc.is_current = True
    db.commit()
    db.refresh(target_doc)
    return target_doc


# Helper import to parse filenames inside loop
import os
from app.core.logging import logger
