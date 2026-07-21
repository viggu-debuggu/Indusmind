from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database.session import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.models.agent_intelligence import AgentExecution, AgentMemory, AgentMessage, AgentCollaboration
from app.schemas.agent_intelligence import (
    AgentExecutionResponse,
    AgentMemoryResponse,
    AgentCollaborationResponse,
    AgentStatsResponse
)

router = APIRouter()

@router.get("/stats", response_model=AgentStatsResponse)
def get_agent_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregates multi-agent metrics, collaborations, speed, and accuracy ratios."""
    total_execs = db.query(AgentExecution).count()
    
    # Executions averages
    avg_conf = db.query(func.avg(AgentExecution.confidence)).scalar() or 0.0
    avg_dur = db.query(func.avg(AgentExecution.duration)).scalar() or 0.0
    
    # Core utilization counts
    agents = [
        "Maintenance Agent",
        "Compliance Agent",
        "Safety Agent",
        "Root Cause Analysis Agent",
        "Quality Agent",
        "Knowledge Graph Agent",
        "Document Intelligence Agent"
    ]
    
    # Calculate stats dynamically
    utilization_dict = {}
    accuracy_dict = {}
    
    for a in agents:
        mem_count = db.query(AgentMemory).filter(AgentMemory.agent_name == a).count()
        avg_a_conf = db.query(func.avg(AgentMemory.confidence)).filter(AgentMemory.agent_name == a).scalar() or 0.0
        utilization_dict[a] = float(mem_count)
        accuracy_dict[a] = float(avg_a_conf)
        
    # Get most used agent
    most_used = max(utilization_dict, key=utilization_dict.get) if (utilization_dict and any(v > 0 for v in utilization_dict.values())) else "None"
    
    # Collaboration trace matrix logs
    collabs = db.query(AgentCollaboration).limit(20).all()
    collab_list = []
    for c in collabs:
        collab_list.append({
            "uuid": c.uuid,
            "session_uuid": c.session_uuid,
            "type": c.collaboration_type,
            "initiator": c.initiator,
            "collaborators": c.collaborators,
            "outcome": c.outcome,
            "downtime_saved": c.downtime_saved_estimate,
            "cost_saved": c.cost_saved_estimate
        })
        
    return AgentStatsResponse(
        total_executions=total_execs,
        average_confidence=float(avg_conf),
        average_duration=float(avg_dur),
        most_used_agent=most_used,
        agents_utilization=utilization_dict,
        agents_accuracy=accuracy_dict,
        collaboration_matrix=collab_list
    )


@router.get("/activity", response_model=List[AgentExecutionResponse])
def get_agent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100)
):
    """Retrieves timeline list of execution traces, duration times, and steps."""
    return db.query(AgentExecution).order_by(desc(AgentExecution.created_at)).limit(limit).all()


@router.get("/collaboration", response_model=List[AgentCollaborationResponse])
def get_agent_collaborations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100)
):
    """Retrieves records of collaborative agent message groups and outcomes."""
    return db.query(AgentCollaboration).order_by(desc(AgentCollaboration.created_at)).limit(limit).all()


@router.get("/memory", response_model=List[AgentMemoryResponse])
def get_agent_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    agent_name: str = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """Lists agent learnings history, previous reasoning blocks, and grounding parameters."""
    query = db.query(AgentMemory)
    if agent_name:
        query = query.filter(AgentMemory.agent_name == agent_name)
    return query.order_by(desc(AgentMemory.created_at)).limit(limit).all()
