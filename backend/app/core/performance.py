import time
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from sqlalchemy.engine import Engine
from app.database.session import engine
from app.core.logging import logger

def get_connection_pool_stats() -> Dict[str, Any]:
    """Retrieve real-time stats from SQLAlchemy connection pool."""
    try:
        pool = engine.pool
        size = pool.size() if hasattr(pool, 'size') else 10
        checkedin = pool.checkedin() if hasattr(pool, 'checkedin') else 10
        checkedout = pool.checkedout() if hasattr(pool, 'checkedout') else 0
        overflow = pool.overflow() if hasattr(pool, 'overflow') else 0
        
        pool_utilization = round((checkedout / (size + overflow or 1)) * 100, 2)
        
        return {
            "pool_size": size,
            "checked_in_connections": checkedin,
            "checked_out_connections": checkedout,
            "overflow_connections": overflow,
            "pool_utilization_pct": pool_utilization,
            "status": "Optimal" if pool_utilization < 80 else "High Load"
        }
    except Exception as e:
        logger.warning("pool_stats_failed", error=str(e))
        return {
            "pool_size": 10,
            "checked_in_connections": 10,
            "checked_out_connections": 0,
            "overflow_connections": 0,
            "pool_utilization_pct": 0.0,
            "status": "Available (Mock/Fallback)"
        }

class QueryOptimizer:
    """Helper utilities to paginate and optimize large dataset queries."""
    
    @staticmethod
    def apply_pagination_params(limit: int = 50, offset: int = 0, max_limit: int = 500) -> Dict[str, int]:
        safe_limit = min(max(1, limit), max_limit)
        safe_offset = max(0, offset)
        return {"limit": safe_limit, "offset": safe_offset}

    @staticmethod
    def estimate_query_cost(total_records: int, has_vector_index: bool = True) -> Dict[str, Any]:
        estimated_ms = round(1.2 * (total_records / 1000.0) + (15.0 if has_vector_index else 5.0), 2)
        return {
            "total_records": total_records,
            "estimated_execution_time_ms": estimated_ms,
            "recommendation": "Use pagination index" if total_records > 1000 else "Direct query optimal"
        }

async def stream_large_data_chunks(data_items: List[Any], chunk_size: int = 100) -> AsyncGenerator[str, None]:
    """Generates JSON chunks for streaming large responses without blocking memory."""
    yield "[\n"
    total = len(data_items)
    for i, item in enumerate(data_items):
        import json
        chunk = json.dumps(item)
        if i < total - 1:
            chunk += ",\n"
        yield chunk
        if (i + 1) % chunk_size == 0:
            await asyncio.sleep(0.001)  # Yield control to event loop
    yield "\n]"
