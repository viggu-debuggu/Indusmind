# INDUSMIND AI - Developer Guide

## Local Environment Setup
1. **Prerequisites**: Python 3.11+, Node.js 18+, PostgreSQL 16 with `pgvector`.
2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Development Guidelines
- Always preserve existing SQLAlchemy models and Alembic migrations.
- Use `app.core.caching` for high-frequency queries.
- Use `app.core.observability.metrics_collector` for telemetry recording.
- Run tests: `pytest backend/tests/`.
