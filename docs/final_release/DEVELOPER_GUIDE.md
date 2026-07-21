# INDUSMIND AI — Enterprise Developer & Contributor Guide

## 1. Repository Folder Structure

```
INDUSMIND AI/
├── backend/
│   ├── app/
│   │   ├── ai/                 # RAG, Embeddings, Vector Store, Predictive Engine
│   │   ├── api/                # FastAPI Routers & Endpoints (22 modules)
│   │   ├── core/               # Caching, Performance, Observability, Security
│   │   ├── database/           # SQLAlchemy Session, Base, Seed Data
│   │   ├── models/             # 18 Domain SQLAlchemy ORM Models
│   │   ├── schemas/            # Pydantic Request/Response Validation Schemas
│   │   ├── services/           # Business Logic Domain Services
│   │   └── main.py             # FastAPI App Gateway
│   ├── tests/                  # Pytest Unit & Integration Test Suites
│   └── requirements.txt
├── frontend/
│   ├── app/                    # Next.js 15 App Router (23 Dashboard Pages)
│   ├── components/             # Reusable UI Components
│   └── context/                # React Context (Auth, Theme)
├── docker/
│   └── verify_enterprise_production.py  # Production Readiness Audit Script
└── docs/final_release/          # Enterprise Documentation Package
```

---

## 2. Coding Standards & Principles

1. **Extension-Only Paradigm**: Never modify working existing endpoints or ORM tables without backward compatibility.
2. **Type Hints**: Always use Python 3.11 type annotations (`Dict[str, Any]`, `Optional[int]`).
3. **Pydantic Validation**: All request payloads must be validated via Pydantic schemas.
4. **Caching Strategy**: Use `app.core.caching` stores for repeat read queries.
5. **Observability**: Record component metrics via `metrics_collector.record_metric(...)`.

---

## 3. Database Migrations Workflow

To add new fields or tables safely:

```bash
cd backend

# Generate Alembic migration script
alembic revision --autogenerate -m "Add new field to equipment table"

# Upgrade database to head revision
alembic upgrade head
```

---

## 4. Running Test Suites

```bash
# Set PYTHONPATH and run all 33 pytest suites
cmd /c "set PYTHONPATH=backend && backend\.venv\Scripts\python.exe -m pytest backend/tests/"

# Run end-to-end production audit script
python docker/verify_enterprise_production.py
```
