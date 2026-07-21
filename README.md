# INDUSMIND AI
### AI-Powered Industrial Knowledge Intelligence Platform

INDUSMIND AI is an enterprise-grade web platform designed to aggregate, parse, and link engineering documents, maintenance records, SOPs, drawings, and quality manuals into an intelligent, searchable knowledge base.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS & Vanilla CSS Variables
- **Icons**: Lucide React
- **Validation**: React Hook Form + Zod
- **Type Checking**: Strict TypeScript

### Backend
- **Framework**: Python 3.12 + FastAPI
- **Database driver**: SQLAlchemy ORM (v2.0)
- **Object Validation**: Pydantic v2
- **Logging**: Structlog
- **Security**: Raw BCrypt password hashing & PyJWT tokens

### Infrastructure & Operations
- **Database**: PostgreSQL 16
- **Storage**: Multi-cloud Storage Engine (Local File System, AWS S3, Azure Blob, MinIO)
- **Dockerization**: Multi-container compose (NextJS, FastAPI, Postgres)

---

## 🔑 Enterprise Authentication & RBAC

The system implements a production-ready authentication and authorization architecture:

### 1. Security Flow
- **Registration**: Creates a user, hashes password using `bcrypt`, generates a verification link, and dispatches mock activation emails.
- **Login**: Verifies credentials, updates `last_login`, and returns short-lived JWT Access Tokens alongside long-lived JWT Refresh Tokens.
- **Refresh Token Rotation**: Automated via Axios interceptors on the frontend. When a request returns a `401 Unauthorized`, the interceptor calls `/api/auth/refresh` to rotate tokens and retries the request seamlessly.
- **Deactivation**: Admins can suspend accounts. Deactivated user sessions are immediately invalidated across the network.

### 2. Role-Based Access Control (RBAC)
We support five standard corporate roles with explicit scopes enforced by backend FastAPI dependencies (`RoleChecker`):

| Role | Permissions & Scopes |
| :--- | :--- |
| **Super Admin** | Full access to portal settings, database status, and user roles elevations. |
| **Admin** | Manage users activation, update roles, and clean documents registry. |
| **Engineer** | Upload drawings/blueprints, access AI Copilot, and trace Knowledge Graphs. |
| **Technician** | Read documents, view maps, and submit calibration/maintenance logs. |
| **Viewer** | Read-only access to asset lists and active documentation logs. |

---

## 🔌 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - Create account & dispatch verification link
- `POST /api/auth/login` - Authenticate credentials and get JWT token
- `POST /api/auth/logout` - Invalidate session tokens
- `POST /api/auth/refresh` - Rotate and issue new access tokens
- `POST /api/auth/forgot-password` - Generate password reset token
- `POST /api/auth/reset-password` - Apply reset token to change password
- `POST /api/auth/verify-email` - Validate verification token

### 👤 Profile Management
- `GET /api/users/me` - Fetch authenticated user profile
- `PUT /api/users/me` - Update name, company, and department details
- `PUT /api/users/change-password` - Update account password

### 🏢 User Administration
- `GET /api/admin/users` - Query registered users (Search, Filter, Paginate)
- `PUT /api/admin/users/{id}/activate` - Restore account status
- `PUT /api/admin/users/{id}/deactivate` - Suspend account status
- `PUT /api/admin/users/{id}/role` - Modify staff role permissions

---

## 📊 Machine Learning Telemetry Classifier (`ml_sandbox/`)

To support predictive health categorization, we use a custom, zero-dependency machine learning classifier which acts as a preprocessing feed into the Multi-Agent RCA / predictive-maintenance pipeline:
- **Telemetry Anomaly Preprocessing**: `ml_sandbox/data_preprocessing.py` applies MinMax scaling to raw temperature and vibration streams.
- **Centroid Classification Feed**: `ml_sandbox/model_training.py` trains a Nearest-Centroid Classifier to map multi-variable telemetry boundaries for statuses (`Operational`, `Maintenance`, `Degraded`). Parameters are exported to `ml_sandbox/models/failure_predictor.json`.
- **RCA Agent Ingestion**: The Root Cause Analysis (RCA) and Maintenance agents consume these centroid predictions as local feature indicators, blending them with domain heuristic rules and Graph RAG documents to formulate recommendations.
- **Inference Sandbox**: `ml_sandbox/predict.py` demonstrates zero-dependency classification loading directly from the exported model parameters.

---

## 🚀 Installation & Running

### Option 1: Docker Compose (Recommended)
To run the containers, execute:

```bash
docker-compose up --build
```
- **Frontend Panel**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Run Automation Scripts
We have created automation controllers to check ports and launch container builds easily:
- **PowerShell (Windows)**: Run `powershell ./docker/run.ps1`
- **Shell (Linux/Git Bash)**: Run `bash ./docker/run.sh`
