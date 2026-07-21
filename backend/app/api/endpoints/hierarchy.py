from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.hierarchy import Organization, Plant, Department
from app.models.workspace import Workspace
from app.models.equipment import Equipment
from app.schemas.hierarchy import (
    OrganizationCreate, OrganizationResponse,
    PlantCreate, PlantResponse,
    DepartmentCreate, DepartmentResponse,
    OrganizationTreeNode, PlantTreeNode, DepartmentTreeNode,
    HierarchyNodeResponse
)
from app.api.dependencies.auth import get_current_user
from app.core.exceptions import AppException


router = APIRouter(prefix="/hierarchy", tags=["hierarchy"])

@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new enterprise organization tenant. Super Admin restricted."""
    if current_user.role != "Super Admin":
        raise AppException("Only Super Admins can register new organizations.", status_code=403, error_code="FORBIDDEN")
    
    # Check duplicate
    existing = db.query(Organization).filter(Organization.name == payload.name).first()
    if existing:
        raise AppException("An organization with this name already exists.", status_code=400, error_code="DUPLICATE")
        
    org = Organization(name=payload.name, description=payload.description)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/organizations", response_model=List[OrganizationResponse])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists organizations. Super Admins see all, others only their linked organization."""
    if current_user.role == "Super Admin":
        return db.query(Organization).all()
    
    if not current_user.organization_id:
        return []
        
    return db.query(Organization).filter(Organization.id == current_user.organization_id).all()

@router.post("/plants", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
def create_plant(
    payload: PlantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new plant. Restricted to Super Admin or Org Admin of the organization."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Unauthorized to create plants.", status_code=403, error_code="FORBIDDEN")
        
    if current_user.role == "Admin" and current_user.organization_id != payload.organization_id:
        raise AppException("Cannot create plants for other organizations.", status_code=403, error_code="FORBIDDEN")
        
    plant = Plant(
        organization_id=payload.organization_id,
        name=payload.name,
        location=payload.location
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new department division under a plant."""
    if current_user.role not in ("Super Admin", "Admin"):
        raise AppException("Unauthorized to create departments.", status_code=403, error_code="FORBIDDEN")
        
    plant = db.query(Plant).filter(Plant.id == payload.plant_id).first()
    if not plant:
        raise AppException("Target plant not found.", status_code=404, error_code="NOT_FOUND")
        
    if current_user.role == "Admin" and current_user.organization_id != plant.organization_id:
        raise AppException("Cannot create departments for other organizations.", status_code=403, error_code="FORBIDDEN")
        
    dept = Department(
        plant_id=payload.plant_id,
        name=payload.name
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/tree", response_model=List[HierarchyNodeResponse])
def get_hierarchy_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the full recursive hierarchy tree of organizations, plants, departments, workspaces, and equipment."""
    # Find allowed organizations
    if current_user.role == "Super Admin":
        orgs = db.query(Organization).all()
    else:
        if not current_user.organization_id:
            return []
        orgs = db.query(Organization).filter(Organization.id == current_user.organization_id).all()
        
    tree = []
    for org in orgs:
        org_children = []
        
        for plant in org.plants:
            # Gather all equipments for this plant dynamically to compute health/alerts
            plant_equipments = (
                db.query(Equipment)
                .join(Workspace, Equipment.workspace_id == Workspace.id)
                .join(Department, Workspace.department_id == Department.id)
                .filter(Department.plant_id == plant.id)
                .all()
            )
            
            # Compute average health score for the plant
            health_scores = [eq.health_score for eq in plant_equipments if eq.health_score is not None]
            avg_health = sum(health_scores) / len(health_scores) if health_scores else 100.0
            
            # Compute critical alerts count (degraded/maintenance status)
            alerts_count = sum(1 for eq in plant_equipments if eq.status != "Operational")
            
            plant_children = []
            for dept in plant.departments:
                dept_children = []
                
                # Fetch workspaces under this department
                workspaces = db.query(Workspace).filter(Workspace.department_id == dept.id).all()
                for ws in workspaces:
                    ws_children = []
                    
                    # Fetch equipment assigned to this workspace
                    equipments = db.query(Equipment).filter(Equipment.workspace_id == ws.id).all()
                    for eq in equipments:
                        eq_node = HierarchyNodeResponse(
                            id=eq.id,
                            name=eq.asset_name,
                            type="Equipment",
                            healthScore=eq.health_score,
                            criticalAlertsCount=0,
                            children=[]
                        )
                        ws_children.append(eq_node)
                        
                    ws_node = HierarchyNodeResponse(
                        id=ws.id,
                        name=ws.name,
                        type="Workspace",
                        healthScore=None,
                        criticalAlertsCount=0,
                        children=ws_children
                    )
                    dept_children.append(ws_node)
                    
                dept_node = HierarchyNodeResponse(
                    id=dept.id,
                    name=dept.name,
                    type="Department",
                    healthScore=None,
                    criticalAlertsCount=0,
                    children=dept_children
                )
                plant_children.append(dept_node)
                
            plant_node = HierarchyNodeResponse(
                id=plant.id,
                name=plant.name,
                type="Plant",
                healthScore=round(avg_health, 1),
                criticalAlertsCount=alerts_count,
                children=plant_children
            )
            org_children.append(plant_node)
            
        org_node = HierarchyNodeResponse(
            id=org.id,
            name=org.name,
            type="Organization",
            healthScore=None,
            criticalAlertsCount=0,
            children=org_children
        )
        tree.append(org_node)
        
    return tree

