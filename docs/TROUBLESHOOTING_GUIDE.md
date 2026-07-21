# INDUSMIND AI - Troubleshooting & Diagnostics Guide

## Common Diagnostics & Solutions

### 1. High API Response Latency
- **Diagnosis**: Check `/dashboard/enterprise/performance` connection pool utilization.
- **Solution**: Flush response cache via `/api/v1/enterprise/cache/flush` or increase pool size in `backend/app/core/config.py`.

### 2. Database Connection Error
- **Diagnosis**: Inspect `/dashboard/enterprise/health` for PostgreSQL error messages.
- **Solution**: Ensure PostgreSQL container is running and `pgvector` extension is installed (`CREATE EXTENSION IF NOT EXISTS vector;`).

### 3. RAG Search Returning No Results
- **Diagnosis**: Verify document chunking status under `/dashboard/documents`.
- **Solution**: Re-trigger indexing worker or upload valid PDF/SOP document.
