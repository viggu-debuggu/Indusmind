# INDUSMIND AI - API Specification & Endpoint Reference

## Authentication & Authorization
All API endpoints under `/api/v1` require Bearer JWT authentication unless specified. Pass headers:
```
Authorization: Bearer <your_jwt_access_token>
```

---

## Endpoint Summary

### Enterprise Production Center (`/api/v1/enterprise`)
- `GET /api/v1/enterprise/readiness`: Overall readiness score, status, and system health metrics.
- `GET /api/v1/enterprise/health`: Real-time health pulse for API, DB, Graph, RAG, Embeddings, Agents, Storage, Caches.
- `GET /api/v1/enterprise/performance`: Connection pool stats, cache hit rates, query optimization logs.
- `GET /api/v1/enterprise/security`: Security audit score, failed login logs, configuration checks.
- `GET /api/v1/enterprise/monitoring`: Application telemetry, latency percentiles (p50, p95, p99), active alerts.
- `GET /api/v1/enterprise/deployment`: Container health, environment validation, version report.
- `GET /api/v1/enterprise/backup`: PostgreSQL, vector index, and knowledge graph backup verification status.
- `POST /api/v1/enterprise/cache/flush`: Flush all in-memory caches.
- `GET /api/v1/enterprise/export/{format}`: Export platform reports in `pdf`, `excel`, `csv`, or `log` format.

### Core Domain APIs
- `/api/v1/auth`: Registration, Login, Token Refresh, Password Reset, Email Verification.
- `/api/v1/users`: User profile management, role assignments, grant delegations.
- `/api/v1/documents`: Document ingestion, OCR extraction, vector chunking, metadata management.
- `/api/v1/ai`: RAG semantic search, hybrid retrieval, AI Copilot streaming chat, summarization.
- `/api/v1/equipment`: Equipment hierarchy, telemetry readings, anomaly detection, predictive maintenance.
- `/api/v1/graph`: Entity nodes, triple extractions, graph path queries, visualization.
- `/api/v1/agents`: Multi-agent collaboration, autonomous execution task delegation, agent memory.
- `/api/v1/decision`: Decision recommendations, multi-criteria trade-offs, evidence scoring.
- `/api/v1/discovery`: Pattern relationship discovery, knowledge gap detection, risk analysis.
- `/api/v1/twin`: Asset twin state, health index, historical snapshot comparison.
- `/api/v1/learning`: User feedback ingestion, recommendation validations, model evaluation benchmarks.
- `/api/v1/executive`: Executive KPIs, financial impact reports, risk summaries.
