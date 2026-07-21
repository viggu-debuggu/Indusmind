import os
import sys
# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database.session import Base, engine

# Force import all models so they register on Base.metadata
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
from app.models.agent_intelligence import AgentExecution, AgentMemory, AgentMessage, AgentMetric, AgentCollaboration

print("Dropping all database tables to apply new schema columns...")
try:
    Base.metadata.drop_all(bind=engine)
    print("SUCCESS: Dropped all tables.")
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Recreated all tables with updated schema.")
except Exception as e:
    print("ERROR resetting database:", str(e))
