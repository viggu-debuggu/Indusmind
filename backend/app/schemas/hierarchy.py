from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CustomBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class OrganizationBase(CustomBaseModel):
    name: str
    description: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: datetime

class PlantBase(CustomBaseModel):
    name: str
    location: Optional[str] = None

class PlantCreate(PlantBase):
    organization_id: int

class PlantResponse(PlantBase):
    id: int
    uuid: str
    organization_id: int
    created_at: datetime
    updated_at: datetime

class DepartmentBase(CustomBaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    plant_id: int

class DepartmentResponse(DepartmentBase):
    id: int
    uuid: str
    plant_id: int
    created_at: datetime
    updated_at: datetime

# Nested Tree representations for Frontend
class DepartmentTreeNode(CustomBaseModel):
    id: int
    uuid: str
    name: str

class PlantTreeNode(CustomBaseModel):
    id: int
    uuid: str
    name: str
    location: Optional[str] = None
    departments: List[DepartmentTreeNode] = []

class OrganizationTreeNode(CustomBaseModel):
    id: int
    uuid: str
    name: str
    description: Optional[str] = None
    plants: List[PlantTreeNode] = []

class HierarchyNodeResponse(CustomBaseModel):
    id: int
    name: str
    type: str
    healthScore: Optional[float] = None
    criticalAlertsCount: Optional[int] = None
    children: Optional[List["HierarchyNodeResponse"]] = None

HierarchyNodeResponse.model_rebuild()

