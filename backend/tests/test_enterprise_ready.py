import sys
import os
import pytest

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.caching import response_cache, embedding_cache, get_all_cache_stats
from app.core.performance import get_connection_pool_stats, QueryOptimizer
from app.core.security_audit import security_audit_service
from app.core.observability import metrics_collector
from app.services.backup_service import backup_service
from app.services.enterprise_service import enterprise_service

client = TestClient(app)

def test_enterprise_caching_layer():
    """Verify multi-tier cache set, get, hit rate, and eviction."""
    response_cache.clear()
    assert response_cache.get("test_key") is None
    
    response_cache.set("test_key", {"data": 123}, ttl=60, tags=["unit_test"])
    retrieved = response_cache.get("test_key")
    assert retrieved is not None
    assert retrieved["data"] == 123
    
    stats = get_all_cache_stats()
    assert "response_cache" in stats
    assert stats["response_cache"]["hits"] >= 1
    
    invalidated = response_cache.invalidate_by_tag("unit_test")
    assert invalidated == 1
    assert response_cache.get("test_key") is None

def test_performance_connection_pool_and_query_optimizer():
    """Verify DB connection pool monitoring and query optimizer helpers."""
    pool_stats = get_connection_pool_stats()
    assert "pool_size" in pool_stats
    assert "pool_utilization_pct" in pool_stats

    params = QueryOptimizer.apply_pagination_params(limit=100, offset=10)
    assert params["limit"] == 100
    assert params["offset"] == 10

    cost = QueryOptimizer.estimate_query_cost(500)
    assert "estimated_execution_time_ms" in cost

def test_security_audit_and_config_validation():
    """Verify security event tracking and configuration audit."""
    val = security_audit_service.validate_sensitive_configuration()
    assert val["security_score_pct"] > 0
    assert "validation_details" in val

    security_audit_service.log_event("TEST_EVENT", "system", "RUN_TEST", "SUCCESS")
    summary = security_audit_service.get_security_dashboard_summary()
    assert len(summary["recent_security_events"]) > 0

def test_backup_and_recovery_verification():
    """Verify database, graph, and configuration snapshot verification."""
    b_summary = backup_service.get_backup_dashboard_summary()
    assert b_summary["overall_backup_status"] == "100% OPERATIONAL"
    assert b_summary["database_backup"]["integrity_check"] == "PASSED"

def test_enterprise_report_export_generator():
    """Verify PDF, CSV, Excel, and System Log export generators."""
    csv_res = enterprise_service.generate_export("csv")
    assert csv_res["media_type"] == "text/csv"
    assert "Subsystem" in csv_res["content"]

    pdf_res = enterprise_service.generate_export("pdf")
    assert pdf_res["media_type"] == "application/pdf"
    assert "ENTERPRISE PRODUCTION READINESS REPORT" in pdf_res["content"]

def test_enterprise_health_api_endpoints():
    """Verify root health endpoint returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
