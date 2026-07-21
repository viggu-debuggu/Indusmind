# INDUSMIND AI — Enterprise Deployment & Operational Guide

## 1. Local Environment Deployment

### 1.1 Backend Service (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 1.2 Frontend Service (Next.js 15)
```bash
cd frontend
npm install
npm run dev
```

---

## 2. Docker Compose Production Deployment

```yaml
version: '3.8'

services:
  db:
    image: pgvector/pgvector:pg16
    container_name: indusmind-db-postgres
    restart: always
    environment:
      POSTGRES_DB: indusmind_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_production_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: indusmind-backend
    restart: always
    environment:
      DATABASE_URL: postgresql://postgres:secure_production_password@db:5432/indusmind_db
      ENVIRONMENT: production
      SECRET_KEY: super_secret_enterprise_jwt_key_min_32_chars
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    container_name: indusmind-frontend
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Deployment Commands:
```bash
docker-compose up -d --build
python docker/verify_enterprise_production.py
```

---

## 3. Environment Variables Reference

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `INDUSMIND AI` | Platform Title |
| `ENVIRONMENT` | `production` | Active Environment Mode |
| `API_PREFIX` | `/api/v1` | API Route Prefix |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/indusmind_db` | PostgreSQL Connection URI |
| `SECRET_KEY` | `super_secret_enterprise_jwt_key` | JWT Signing Secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hrs) | JWT Expiration Time |
