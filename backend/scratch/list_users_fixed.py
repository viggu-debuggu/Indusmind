import os
import sys
# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database.session import SessionLocal, engine

# Force import all models
from app.models.user import User, RefreshToken, PasswordResetToken, EmailVerificationToken
from app.models.document import DocumentModel
from app.models.ai import DocumentChunk, ChatSession, ChatMessage
from app.models.equipment import Equipment, SensorReading, MaintenancePrediction
from app.models.workspace import Workspace, workspace_documents
from app.models.hierarchy import Organization, Plant, Department, UserOrganizationGrant
from app.models.compliance import Regulation, ComplianceAudit
from app.models.lessons_learned import IncidentRecord
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.expert_knowledge import ExpertKnowledge
from app.models.decision_intelligence import DecisionRecommendation, DecisionEvidence

db = SessionLocal()
users = db.query(User).all()
print(f'Total users in DB: {len(users)}')
for u in users:
    print(f'  email={u.email} | role={u.role} | is_active={u.is_active} | org_id={getattr(u, "organization_id", "N/A")}')
db.close()
