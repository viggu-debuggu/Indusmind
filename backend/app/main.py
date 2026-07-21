import torch
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.exceptions import AppException, app_exception_handler, global_exception_handler
from app.api.endpoints.health import router as health_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.admin import router as admin_router
from app.api.endpoints.documents import router as documents_router
from app.api.endpoints.ai import router as ai_router
from app.api.endpoints.equipment import router as equipment_router
from app.api.endpoints.workspaces import router as workspaces_router
from app.api.endpoints.hierarchy import router as hierarchy_router
from app.api.endpoints.compliance import router as compliance_router
from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.notifications import router as notifications_router
from app.api.endpoints.lessons_learned import router as incidents_router
from app.api.endpoints.audit import router as audit_router
from app.api.endpoints.expert_knowledge import router as expert_knowledge_router
from app.api.endpoints.decision_intelligence import router as decision_router
from app.api.endpoints.agent_intelligence import router as agent_router
from app.api.endpoints.discovery import router as discovery_router
from app.api.endpoints.twin import router as twin_router
from app.api.endpoints.learning import router as learning_router
from app.api.endpoints.executive import router as executive_router
from app.api.endpoints.enterprise import router as enterprise_router
from app.core.observability import TracingMiddleware
from app.database.session import Base, engine, verify_db_connection, SessionLocal


# Force import models to register them on Base.metadata
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
from app.models.discovery import DiscoveryFinding, PatternRelationship, KnowledgeGapRecord, OptimizationOpportunity, RiskDiscovery
from app.models.twin import KnowledgeTwin, KnowledgeHealth, AssetComparison, TwinSnapshot
from app.models.learning import FeedbackRecord, LearningEvent, RecommendationValidation, KnowledgeEvolution, ModelEvaluation
from app.models.executive import ExecutiveMetric, ExecutiveReport, FinancialImpact, EnterpriseKPI, RiskSummary


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    setup_logging()
    logger.info("application_startup", environment=settings.ENVIRONMENT, project=settings.PROJECT_NAME)
    
    db_connected = verify_db_connection()
    if db_connected:
        logger.info("database_connection_established")
        # Initialize pgvector extension in PostgreSQL
        from sqlalchemy import text
        try:
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            logger.info("postgres_vector_extension_loaded")
        except Exception as e:
            logger.error("postgres_vector_extension_failed", error=str(e))
            

        
        # Seed industrial enterprise hierarchy
        from app.database.seed import seed_hierarchy_data
        try:
            with SessionLocal() as db:
                seed_hierarchy_data(db)
        except Exception as seed_err:
            logger.error("database_seeding_failed", error=str(seed_err))
    else:
        logger.warning("database_connection_unavailable_on_startup")
        
    yield
    
    # Shutdown tasks
    logger.info("application_shutdown")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Industrial Knowledge Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS configuration
origins = [
    origin.strip()
    for origin in settings.ALLOWED_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom error handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.add_middleware(TracingMiddleware)

# Include endpoint routes
app.include_router(health_router, prefix=settings.API_PREFIX, tags=["Diagnostics"])
app.include_router(auth_router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(users_router, prefix=f"{settings.API_PREFIX}/users", tags=["Users"])
app.include_router(admin_router, prefix=f"{settings.API_PREFIX}/admin", tags=["Admin Administration"])
app.include_router(documents_router, prefix=settings.API_PREFIX)
app.include_router(ai_router, prefix=settings.API_PREFIX)
app.include_router(equipment_router, prefix=f"{settings.API_PREFIX}/equipment", tags=["Equipment Health & Predictive Intelligence"])
app.include_router(workspaces_router, prefix=settings.API_PREFIX)
app.include_router(hierarchy_router, prefix=settings.API_PREFIX)
app.include_router(compliance_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(notifications_router, prefix=settings.API_PREFIX)
app.include_router(incidents_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(expert_knowledge_router, prefix=settings.API_PREFIX)
app.include_router(decision_router, prefix=settings.API_PREFIX)
app.include_router(agent_router, prefix=f"{settings.API_PREFIX}/agents", tags=["Multi-Agent Intelligence"])
app.include_router(discovery_router, prefix=settings.API_PREFIX)
app.include_router(twin_router, prefix=settings.API_PREFIX)
app.include_router(learning_router, prefix=settings.API_PREFIX)
app.include_router(executive_router, prefix=settings.API_PREFIX)
app.include_router(enterprise_router, prefix=settings.API_PREFIX)

from app.api.endpoints.ai import get_knowledge_graph
from app.ai.schemas import GraphResponse
app.get(f"{settings.API_PREFIX}/graph", response_model=GraphResponse, tags=["AI Copilot & Search"])(get_knowledge_graph)




@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API Portal",
        "docs_url": "/docs" if settings.ENVIRONMENT != "production" else "disabled"
    }
