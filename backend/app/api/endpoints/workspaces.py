from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace import Workspace, workspace_documents
from app.models.document import DocumentModel
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, WorkspaceDetailsResponse
from app.core.exceptions import AppException

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all isolated workspaces."""
    workspaces = db.query(Workspace).order_by(Workspace.name.asc()).all()
    
    resp = []
    for ws in workspaces:
        # Count documents associated with this workspace
        doc_count = db.query(workspace_documents).filter(
            workspace_documents.c.workspace_id == ws.id
        ).count()
        
        resp.append(
            WorkspaceResponse(
                id=ws.id,
                uuid=ws.uuid,
                name=ws.name,
                description=ws.description,
                created_by=ws.created_by,
                created_at=ws.created_at,
                updated_at=ws.updated_at,
                document_count=doc_count
            )
        )
    return resp

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    payload: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new workspace (restricted to Super Admin, Admin, Engineer, Technician)."""
    if current_user.role == "Viewer":
        raise AppException("Viewer role is unauthorized to create workspaces.", status_code=403, error_code="UNAUTHORIZED")
        
    existing = db.query(Workspace).filter(Workspace.name == payload.name).first()
    if existing:
        raise AppException(f"A workspace named '{payload.name}' already exists.", status_code=400, error_code="DUPLICATE_NAME")
        
    ws = Workspace(
        name=payload.name,
        description=payload.description,
        created_by=current_user.id
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    
    return WorkspaceResponse(
        id=ws.id,
        uuid=ws.uuid,
        name=ws.name,
        description=ws.description,
        created_by=ws.created_by,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        document_count=0
    )

@router.get("/{uuid}", response_model=WorkspaceDetailsResponse)
def get_workspace_details(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves workspace detail sheets, including linked documents."""
    ws = db.query(Workspace).filter(Workspace.uuid == uuid).first()
    if not ws:
        raise AppException("Workspace not found.", status_code=404, error_code="WORKSPACE_NOT_FOUND")
        
    doc_count = len(ws.documents)
    
    return WorkspaceDetailsResponse(
        id=ws.id,
        uuid=ws.uuid,
        name=ws.name,
        description=ws.description,
        created_by=ws.created_by,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        document_count=doc_count,
        documents=ws.documents
    )

@router.put("/{uuid}", response_model=WorkspaceResponse)
def update_workspace(
    uuid: str,
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates workspace details (restricted to Admins, or creator Engineer/Technician)."""
    ws = db.query(Workspace).filter(Workspace.uuid == uuid).first()
    if not ws:
        raise AppException("Workspace not found.", status_code=404, error_code="WORKSPACE_NOT_FOUND")
        
    is_admin = current_user.role in ("Super Admin", "Admin")
    is_creator = ws.created_by == current_user.id
    
    if not is_admin and not is_creator:
        raise AppException("Unauthorized to modify this workspace.", status_code=403, error_code="UNAUTHORIZED")
        
    if payload.name is not None:
        # Check duplicate name
        existing = db.query(Workspace).filter(Workspace.name == payload.name, Workspace.id != ws.id).first()
        if existing:
            raise AppException(f"A workspace named '{payload.name}' already exists.", status_code=400, error_code="DUPLICATE_NAME")
        ws.name = payload.name
        
    if payload.description is not None:
        ws.description = payload.description
        
    db.commit()
    db.refresh(ws)
    
    doc_count = db.query(workspace_documents).filter(workspace_documents.c.workspace_id == ws.id).count()
    return WorkspaceResponse(
        id=ws.id,
        uuid=ws.uuid,
        name=ws.name,
        description=ws.description,
        created_by=ws.created_by,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        document_count=doc_count
    )

@router.delete("/{uuid}")
def delete_workspace(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a workspace (restricted to Super Admin, Admin, or Workspace Creator)."""
    ws = db.query(Workspace).filter(Workspace.uuid == uuid).first()
    if not ws:
        raise AppException("Workspace not found.", status_code=404, error_code="WORKSPACE_NOT_FOUND")
        
    is_admin = current_user.role in ("Super Admin", "Admin")
    is_creator = ws.created_by == current_user.id
    
    if not is_admin and not is_creator:
        raise AppException("Unauthorized to delete this workspace.", status_code=403, error_code="UNAUTHORIZED")
        
    db.delete(ws)
    db.commit()
    return {"message": "Workspace deleted successfully."}

@router.post("/{uuid}/documents", response_model=WorkspaceDetailsResponse)
def link_documents_to_workspace(
    uuid: str,
    payload: Dict[str, List[int]], # expects {"document_ids": [1, 2, ...]}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Links multiple documents to a workspace."""
    if current_user.role == "Viewer":
        raise AppException("Viewer role is unauthorized to modify workspaces.", status_code=403, error_code="UNAUTHORIZED")
        
    ws = db.query(Workspace).filter(Workspace.uuid == uuid).first()
    if not ws:
        raise AppException("Workspace not found.", status_code=404, error_code="WORKSPACE_NOT_FOUND")
        
    doc_ids = payload.get("document_ids", [])
    if not doc_ids:
        raise AppException("document_ids list parameter is required.", status_code=400, error_code="INVALID_PARAMETER")
        
    # Query documents
    docs = db.query(DocumentModel).filter(DocumentModel.id.in_(doc_ids)).all()
    
    # Add new connections (avoiding duplicate checks automatically via relationship secondary list mapping)
    for doc in docs:
        if doc not in ws.documents:
            ws.documents.append(doc)
            
    db.commit()
    db.refresh(ws)
    
    return WorkspaceDetailsResponse(
        id=ws.id,
        uuid=ws.uuid,
        name=ws.name,
        description=ws.description,
        created_by=ws.created_by,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        document_count=len(ws.documents),
        documents=ws.documents
    )

@router.delete("/{uuid}/documents/{doc_id}", response_model=WorkspaceDetailsResponse)
def unlink_document_from_workspace(
    uuid: str,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unlinks a document from a workspace."""
    if current_user.role == "Viewer":
        raise AppException("Viewer role is unauthorized to modify workspaces.", status_code=403, error_code="UNAUTHORIZED")
        
    ws = db.query(Workspace).filter(Workspace.uuid == uuid).first()
    if not ws:
        raise AppException("Workspace not found.", status_code=404, error_code="WORKSPACE_NOT_FOUND")
        
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise AppException("Document not found.", status_code=404, error_code="DOCUMENT_NOT_FOUND")
        
    if doc in ws.documents:
        ws.documents.remove(doc)
        db.commit()
        db.refresh(ws)
        
    return WorkspaceDetailsResponse(
        id=ws.id,
        uuid=ws.uuid,
        name=ws.name,
        description=ws.description,
        created_by=ws.created_by,
        created_at=ws.created_at,
        updated_at=ws.updated_at,
        document_count=len(ws.documents),
        documents=ws.documents
    )
