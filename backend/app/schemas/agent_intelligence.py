from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AgentExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    chat_message_id: Optional[int] = None
    session_uuid: str
    agents_used: str
    reasoning_steps: List[str]
    evidence: Optional[str] = None
    confidence: float
    duration: float
    created_at: datetime


class AgentMemoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    agent_name: str
    task_name: str
    reasoning: str
    evidence: Optional[str] = None
    confidence: float
    status: str
    created_at: datetime


class AgentCollaborationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uuid: str
    session_uuid: str
    collaboration_type: str
    initiator: str
    collaborators: str
    outcome: str
    downtime_saved_estimate: float
    cost_saved_estimate: float
    created_at: datetime


class AgentStatsResponse(BaseModel):
    total_executions: int
    average_confidence: float
    average_duration: float
    most_used_agent: str
    agents_utilization: Dict[str, float]
    agents_accuracy: Dict[str, float]
    collaboration_matrix: List[Dict[str, Any]]
