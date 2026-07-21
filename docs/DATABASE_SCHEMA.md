# INDUSMIND AI - Database Schema Documentation

## Database Engine
- **Engine**: PostgreSQL 16
- **Extensions**: `vector` (pgvector 0.6.0) for vector embeddings and similarity search
- **ORM**: SQLAlchemy 2.0 with Alembic migration version control

---

## Core Tables & Models

### 1. User & Authentication
- `users`: User credentials, fullName, email, role, jobTitle, departmentId, isActive.
- `refresh_tokens`: Active JWT refresh session tokens.
- `password_reset_tokens`: Reset tokens with expiration.
- `email_verification_tokens`: Email validation tokens.

### 2. Enterprise Hierarchy
- `organizations`: Enterprise org entities.
- `plants`: Industrial manufacturing facilities.
- `departments`: Plant operating units.
- `user_organization_grants`: Delegated multi-plant permissions.

### 3. Documents & AI Knowledge Base
- `documents`: Document file metadata, file size, status, category, storage path.
- `document_chunks`: Extracted text chunks, page numbers, and vector embeddings (`vector(384)`).
- `chat_sessions`: AI Copilot chat session state.
- `chat_messages`: Copilot conversation history and citations.

### 4. Equipment & Predictive Maintenance
- `equipment`: Plant asset registry, model, serial number, install date, criticality index.
- `sensor_readings`: Real-time telemetry (vibration, temperature, pressure, RPM).
- `maintenance_predictions`: RUL estimates, failure probabilities, recommended actions.

### 5. Multi-Agent & Intelligence Platform
- `agent_executions`: Task execution logs, agent roles, status, runtime duration.
- `agent_memories`: Persistent agent memories and vector context.
- `agent_messages`: Inter-agent collaboration messages.
- `discovery_findings`: Pattern relationships, knowledge gaps, risk discoveries.
- `knowledge_twins`: Asset state snapshots, health indices, twin comparison metrics.
- `learning_events`: Continuous learning feedback records and model benchmarks.
- `executive_reports`: Executive KPI aggregations, financial impact assessments.
