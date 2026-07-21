# INDUSMIND AI — Complete System Architecture Specification

## 1. High-Level System Architecture

INDUSMIND AI is engineered as a decoupled, high-throughput micro-service oriented platform using FastAPI as the backend API Gateway and Next.js 15 as the rich enterprise client UI.

```mermaid
graph TB
    subgraph Client Layer
        UI[Next.js 15 Web Application]
        Mobile[Responsive Mobile & Tablet Viewport]
    end

    subgraph Gateway & Security
        Gateway[FastAPI API Gateway]
        Middleware[TracingMiddleware X-Request-ID]
        Auth[JWT & RBAC Permission Guard]
        Cache[Multi-Tier LRU Cache Layer]
    end

    subgraph Intelligence Engines
        RAG[RAG Hybrid Retrieval Engine]
        KG[Knowledge Graph Traversal Engine]
        Agents[Multi-Agent Orchestrator - 8 Specializations]
        Decision[Multi-Objective Decision Engine]
        Discovery[Industrial Discovery & Pattern Mining]
        Twin[360 Digital Knowledge Twin Engine]
        Learning[Continuous Learning Feedback Loop]
        Executive[Executive AI Command Center]
    end

    subgraph Data & Storage Layer
        DB[(PostgreSQL 16 Relational Engine)]
        VectorDB[(pgvector HNSW / IVFFLAT Vector Store)]
        FileStore[(Local / AWS S3 Blob Storage)]
    end

    Client Layer --> Gateway
    Gateway --> Middleware
    Middleware --> Auth
    Auth --> Cache
    Cache --> Intelligence Engines
    Intelligence Engines --> Data & Storage Layer
```

---

## 2. Component Subsystem Architecture

### 2.1 Frontend Client Architecture (Next.js 15)
- **Framework**: Next.js 15 with App Router (`app/dashboard/*`).
- **State & Auth Context**: React Context API (`AuthContext.tsx`) for session persistence, user role management (`Super Admin`, `Admin`, `Manager`, `Engineer`, `Auditor`, `Technician`, `Viewer`).
- **UI & Layout**: Responsive Dashboard Layout (`layout.tsx`) featuring collapsible sidebar, top search bar, dynamic notifications menu, dark mode toggle, and profile dropdown.
- **Data Fetching**: Axios HTTP client wrapped with authorization header interceptors and fallback mock state handling.

### 2.2 Backend Gateway & Middleware (FastAPI)
- **Router Modularization**: 22 dedicated endpoint routers registered under `/api/v1/`.
- **Request Tracing**: `TracingMiddleware` attaches unique `X-Request-ID` UUIDs and measures request durations.
- **Multi-Tier Performance Caching**:
  - `response_cache`: High-throughput HTTP payload cache (TTL: 300s).
  - `embedding_cache`: Vector embedding transformer cache (TTL: 3600s).
  - `knowledge_graph_cache`: Graph traversal & triple cache (TTL: 600s).
  - `recommendation_cache`: Pre-calculated multi-objective trade-off cache (TTL: 900s).
  - `analytics_cache`: KPI & Executive metric cache (TTL: 300s).

### 2.3 Relational & Vector Storage Layer (PostgreSQL + pgvector)
- **Relational Tables**: 18 domain tables supporting multi-tenant organizations, plants, departments, documents, equipment, sensor telemetry, predictions, agent executions, twin snapshots, and executive reports.
- **Vector Search Engine**: PostgreSQL `vector` extension (`vector(384)`) supporting cosine distance (`<=>`) queries accelerated by IVFFLAT and HNSW index structures.

### 2.4 Knowledge Graph Architecture
- **Nodes**: Equipment, Component, FailureMode, RootCause, SOP, Regulation, Agent, Discovery, Twin, Feedback.
- **Edges**: `HAS_COMPONENT`, `EXHIBITS_FAILURE_MODE`, `CAUSED_BY`, `RESOLVED_BY`, `GOVERNED_BY`, `DEPENDS_ON`, `MONITORS`, `EVALUATES`.
- **Traversal Performance**: Optimized graph adjacency dictionary traversals responding in < 18.4 ms.

### 2.5 Multi-Agent AI Orchestrator
- **8 Autonomous Agent Specializations**:
  1. *Maintenance Agent*: Equipment health and vibration analysis.
  2. *Compliance Agent*: Regulatory compliance and OSHA audit verification.
  3. *Safety Agent*: Hazardous situation and PPE protocol checks.
  4. *RCA (Root Cause Analysis) Agent*: Deep failure mode tree traversal.
  5. *Quality Agent*: Process deviation and output quality checks.
  6. *Knowledge Graph Agent*: Semantic triple relation queries.
  7. *Document Intelligence Agent*: PDF/Drawing chunk extractions.
  8. *Coordinator Agent*: Multi-agent task assignment and consensus synthesis.

### 2.6 Decision Intelligence Engine
- **Multi-Objective Trade-Off Evaluator**: Computes cost vs. downtime vs. safety vs. compliance scores using weighted Pareto optimization.
- **Evidence Scoring**: Generates confidence percentages and empirical evidence matrices for plant engineers.

### 2.7 Industrial Discovery Engine
- **Pattern Mining**: Uncovers hidden pattern relationships across sensor anomalies and historical work orders.
- **Knowledge Gap Detector**: Identifies missing SOP manuals or unindexed equipment tags.
- **Risk Analysis**: Ranks operational risks based on criticality and past incident logs.

### 2.8 Digital Knowledge Twin Architecture
- **Asset Health Snapshotting**: Creates point-in-time state records for plant equipment.
- **Cross-Plant Matrix**: Enables side-by-side asset comparison between manufacturing facilities.

### 2.9 Continuous Learning Engine
- **Feedback Ingestion**: Stores engineer validations, acceptance/rejection ratings, and confidence deltas.
- **Model Evaluation**: Benchmarks prediction accuracy over time.

### 2.10 Executive Command Center
- **Enterprise KPIs**: Plant health index, operational risk summaries, and financial ROI calculations.
