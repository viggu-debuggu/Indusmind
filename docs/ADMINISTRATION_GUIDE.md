# INDUSMIND AI - Administration Guide

## User Management & RBAC
Admins can manage platform roles (`Super Admin`, `Admin`, `Department Manager`, `Engineer`, `Auditor`, `Technician`, `Viewer`) under `/dashboard/admin`.

## System Monitoring & Maintenance
- **System Health Center**: Monitor sub-system status at `/dashboard/enterprise/health`.
- **Security Center**: Inspect failed login attempts and permission matrix at `/dashboard/enterprise/security`.
- **Cache Management**: Flush system caches via UI button or API endpoint `/api/v1/enterprise/cache/flush`.
- **Backups**: Trigger snapshot verification checks at `/dashboard/enterprise/deployment`.
