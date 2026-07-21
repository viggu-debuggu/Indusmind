# INDUSMIND AI - Production Deployment Guide

## Docker Compose Deployment
1. **Build and start services**:
   ```bash
   docker-compose up -d --build
   ```
2. **Verify Container Status**:
   ```bash
   docker-compose ps
   ```
3. **Execute Production Audit**:
   ```bash
   python docker/verify_enterprise_production.py
   ```

## Production Security & Environment Checklist
- Ensure `SECRET_KEY` in `.env` is set to a secure, random string (min 32 chars).
- Set `ENVIRONMENT=production`.
- Verify database connection string uses SSL (`sslmode=require`).
- Confirm storage volume mounts have appropriate file read/write permissions.
