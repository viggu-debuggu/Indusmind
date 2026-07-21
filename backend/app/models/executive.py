import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class ExecutiveMetric(Base):
    """
    SQLAlchemy model storing strategic metric snapshots for the Executive AI Command Center.
    """
    __tablename__ = "executive_metrics"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ExecutiveReport(Base):
    """
    SQLAlchemy model storing generated weekly and monthly executive report summaries.
    """
    __tablename__ = "executive_reports"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    report_name = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False) # Weekly, Monthly, Special
    
    summary = Column(Text, nullable=False)
    kpi_data = Column(Text, nullable=False) # JSON payload
    financial_summary = Column(Text, nullable=False)
    risk_summary = Column(Text, nullable=False)
    recommendations_summary = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class FinancialImpact(Base):
    """
    SQLAlchemy model tracking financial metrics (downtime cost, predicted savings, maintenance optimization,
    avoided failures, compliance cost reduction, and knowledge reuse savings).
    """
    __tablename__ = "financial_impact"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class EnterpriseKPI(Base):
    """
    SQLAlchemy model storing calculated Enterprise KPIs across plant health, AI confidence,
    knowledge health, compliance readiness, maintenance readiness, reliability, downtime risk, and learning scores.
    """
    __tablename__ = "enterprise_kpis"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    plant_health_score = Column(Float, default=91.2, nullable=False)
    ai_confidence_score = Column(Float, default=94.0, nullable=False)
    knowledge_health_score = Column(Float, default=86.4, nullable=False)
    compliance_readiness_score = Column(Float, default=95.0, nullable=False)
    maintenance_readiness_score = Column(Float, default=92.0, nullable=False)
    asset_reliability_score = Column(Float, default=94.5, nullable=False)
    operational_readiness_score = Column(Float, default=91.8, nullable=False)
    downtime_risk_score = Column(Float, default=8.5, nullable=False)
    knowledge_growth_score = Column(Float, default=34.5, nullable=False)
    continuous_learning_score = Column(Float, default=88.5, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RiskSummary(Base):
    """
    SQLAlchemy model aggregating top business risks, emerging telemetry wear spikes,
    compliance audit exposures, and safety bottlenecks.
    """
    __tablename__ = "risk_summary"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True, nullable=False)
    
    risk_category = Column(String(100), nullable=False) # Critical Risk, Emerging Risk, Compliance Risk, Safety Risk, Operational Bottleneck
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False) # Critical, High, Medium, Low
    impact_description = Column(Text, nullable=False)
    affected_assets = Column(String(255), nullable=False)
    financial_exposure = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
