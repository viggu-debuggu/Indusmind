from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditUserRef(BaseModel):
    id: int
    full_name: str
    email: str


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    user_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime
    user: Optional[AuditUserRef] = None
