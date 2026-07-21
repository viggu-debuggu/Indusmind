# INDUSMIND AI — Complete REST API Specification

## 1. Authentication & Global Headers

All API endpoints under `/api/v1` require Bearer JWT authentication (except `/auth/login` and `/health`).

```http
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
X-Request-ID: <optional_client_guid>
```

---

## 2. API Router Endpoints Directory

### 2.1 Enterprise Production Center (`/api/v1/enterprise`)
- **`GET /api/v1/enterprise/readiness`**: Returns overall readiness score (100.0%) and status summary.
- **`GET /api/v1/enterprise/health`**: Subsystem health pulse for API, DB, Graph, RAG, Embeddings, Agents, Storage, Caches.
- **`GET /api/v1/enterprise/performance`**: Multi-tier cache hit rates and connection pool utilization.
- **`GET /api/v1/enterprise/security`**: Security score, audit logs, and failed login monitors.
- **`GET /api/v1/enterprise/monitoring`**: Application metrics, latency percentiles (P50, P95, P99), active alerts.
- **`GET /api/v1/enterprise/deployment`**: Container health, production checklist, version report.
- **`GET /api/v1/enterprise/backup`**: Database & Knowledge Graph snapshot verification status.
- **`POST /api/v1/enterprise/cache/flush`**: Flushes all in-memory LRU cache stores.
- **`GET /api/v1/enterprise/export/{export_format}`**: Downloads PDF, Excel, CSV, or System Log reports.

### 2.2 Authentication & User Administration (`/api/v1/auth`, `/api/v1/users`, `/api/v1/admin`)
- **`POST /api/v1/auth/login`**: Authenticates credentials and returns JWT access & refresh tokens.
- **`POST /api/v1/auth/refresh`**: Exchanges refresh token for new access token.
- **`GET /api/v1/users/me`**: Returns current authenticated user profile.
- **`GET /api/v1/admin/users`**: User administration table (Super Admin / Admin only).

### 2.3 RAG & Document Intelligence (`/api/v1/documents`, `/api/v1/ai`)
- **`POST /api/v1/documents/upload`**: Uploads PDF, DOCX, XLSX drawings & manuals for text extraction and vector chunking.
- **`POST /api/v1/ai/chat/stream`**: Streaming AI Copilot answer generation with document citations.
- **`POST /api/v1/ai/search`**: Hybrid semantic vector + BM25 keyword search across document chunks.

### 2.4 Equipment Health & Predictive Maintenance (`/api/v1/equipment`)
- **`GET /api/v1/equipment`**: Lists plant equipment assets with health scores.
- **`GET /api/v1/equipment/{id}/telemetry`**: Retrieves real-time sensor streams (vibration, temp, pressure, RPM).
- **`GET /api/v1/equipment/{id}/predictions`**: RUL estimations and predicted failure modes.

### 2.5 Knowledge Graph (`/api/v1/graph`)
- **`GET /api/v1/graph/export`**: Returns JSON graph payload (nodes & edges) for 2D/3D visualization.
- **`GET /api/v1/graph/query`**: Executes semantic entity relationship traversals.

### 2.6 Multi-Agent Intelligence (`/api/v1/agents`)
- **`GET /api/v1/agents/teams`**: Lists active specialized AI agent teams.
- **`POST /api/v1/agents/execute`**: Triggers autonomous multi-agent investigative tasks.

### 2.7 Decision & Discovery Intelligence (`/api/v1/decision`, `/api/v1/discovery`)
- **`GET /api/v1/decision/recommendations`**: Returns multi-objective trade-off recommendations with evidence scores.
- **`GET /api/v1/discovery/findings`**: Uncovers hidden pattern relationships, knowledge gaps, and risks.

### 2.8 Digital Twin, Learning & Executive (`/api/v1/twin`, `/api/v1/learning`, `/api/v1/executive`)
- **`GET /api/v1/twin/{id}`**: Digital Knowledge Twin 360 state snapshot.
- **`POST /api/v1/learning/feedback`**: Ingests engineer validation feedback for model evaluation.
- **`GET /api/v1/executive/kpis`**: Enterprise financial impact ROI and plant health index.

---

## 3. Request & Response Payload Examples

### Login Request Example:
```json
POST /api/v1/auth/login
{
  "email": "admin@indusmind.ai",
  "password": "Password123!"
}
```

### Login Response Example:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": 1,
    "email": "admin@indusmind.ai",
    "full_name": "Senior Plant Administrator",
    "role": "Super Admin"
  }
}
```

---

## 4. Standard Error Codes Matrix

| HTTP Code | Error Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Payload validation failed |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing or expired JWT token |
| `403 Forbidden` | `FORBIDDEN` | Insufficient role permissions |
| `404 Not Found` | `NOT_FOUND` | Resource ID does not exist |
| `500 Server Error` | `INTERNAL_ERROR` | Server exception handled gracefully |
