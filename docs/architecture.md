# System Architecture - INDUSMIND AI

INDUSMIND AI follows the principles of **Clean Architecture** to ensure separations of concern, testability, and independence from external libraries or frameworks.

## Layers Overview

```text
       ┌────────────────────────────────────────────────────────┐
       │                       Presentation                     │
       │           (Next.js Pages, Styles, Components)          │
       └───────────────────────────┬────────────────────────────┘
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                       Application                      │
       │          (FastAPI Routers, DocumentServices)           │
       └───────────────────────────┬────────────────────────────┘
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                          Domain                        │
       │         (Pydantic Validation Schemas, Models)          │
       └───────────────────────────┬────────────────────────────┘
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                     Infrastructure                     │
       │       (PostgreSQL Session, Modular Storage Client)     │
       └────────────────────────────────────────────────────────┘
```

### 1. Presentation Layer
- **Components**: Next.js 15 pages (`app/`), styling (`globals.css`), interactive state.
- **Role**: Render dashboards, trigger client form validations via React Hook Form/Zod, and interface with backend routers via Axios.

### 2. Application Layer
- **Components**: FastAPI controllers and service implementations (`backend/app/services/`).
- **Role**: Coordinates business rules, controls transaction lifecycles, and interacts with repositories and storage providers.

### 3. Domain Layer
- **Components**: Core data entities, SQLAlchemy schemas (`backend/app/models/`), validation structures (`backend/app/schemas/`).
- **Role**: Represents the state and constraints of industrial assets and document records.

### 4. Infrastructure Layer
- **Components**: PostgreSQL database connection (`session.py`), repository queries (`repositories/`), concrete Storage providers (Local, S3, Azure, MinIO).
- **Role**: External mechanisms and drivers.

## Storage Module Strategy

The storage layer is engineered around a generic `StorageProvider` abstract interface:
- **Local Storage**: Persists files locally to `/app/storage` (default).
- **AWS S3**: Connects to Amazon Web Services using `boto3`.
- **Azure Blob**: Connects to Microsoft Azure cloud container.
- **MinIO**: Enables local S3-compatible cloud storage deployment.
To switch providers, simply change the `STORAGE_PROVIDER` key in the `.env` environment configuration.
