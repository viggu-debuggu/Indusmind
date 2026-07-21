import time
import json
import hashlib
from typing import Any, Dict, Optional, List
from collections import OrderedDict
import threading

class LRUCache:
    """Thread-safe LRU Cache with Time-To-Live (TTL) and tag tracking."""
    def __init__(self, capacity: int = 1000, default_ttl: int = 300):
        self.capacity = capacity
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.lock = threading.RLock()
        self.hits = 0
        self.misses = 0

    def _generate_key(self, raw_key: str) -> str:
        if len(raw_key) > 128:
            return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        return raw_key

    def get(self, key: str) -> Optional[Any]:
        k = self._generate_key(key)
        with self.lock:
            if k not in self.cache:
                self.misses += 1
                return None
            
            item = self.cache[k]
            if time.time() > item["expires_at"]:
                del self.cache[k]
                self.misses += 1
                return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(k)
            self.hits += 1
            return item["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None, tags: Optional[List[str]] = None) -> None:
        k = self._generate_key(key)
        expire_in = ttl if ttl is not None else self.default_ttl
        expires_at = time.time() + expire_in
        
        with self.lock:
            if k in self.cache:
                self.cache.move_to_end(k)
            self.cache[k] = {
                "value": value,
                "expires_at": expires_at,
                "tags": tags or [],
                "created_at": time.time()
            }
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)

    def invalidate_by_tag(self, tag: str) -> int:
        count = 0
        with self.lock:
            keys_to_remove = [
                k for k, v in self.cache.items() if tag in v.get("tags", [])
            ]
            for k in keys_to_remove:
                del self.cache[k]
                count += 1
        return count

    def clear(self) -> None:
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0

    def stats(self) -> Dict[str, Any]:
        with self.lock:
            total = self.hits + self.misses
            hit_rate = round((self.hits / total * 100), 2) if total > 0 else 100.0
            now = time.time()
            valid_keys = sum(1 for v in self.cache.values() if v["expires_at"] > now)
            return {
                "capacity": self.capacity,
                "active_items": valid_keys,
                "total_items": len(self.cache),
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate_pct": hit_rate
            }

# Instantiate domain-specific caches
response_cache = LRUCache(capacity=2000, default_ttl=300)      # 5 mins
embedding_cache = LRUCache(capacity=5000, default_ttl=3600)     # 1 hour
knowledge_graph_cache = LRUCache(capacity=3000, default_ttl=600) # 10 mins
recommendation_cache = LRUCache(capacity=1000, default_ttl=900)  # 15 mins
analytics_cache = LRUCache(capacity=1000, default_ttl=300)       # 5 mins

def get_all_cache_stats() -> Dict[str, Any]:
    return {
        "response_cache": response_cache.stats(),
        "embedding_cache": embedding_cache.stats(),
        "knowledge_graph_cache": knowledge_graph_cache.stats(),
        "recommendation_cache": recommendation_cache.stats(),
        "analytics_cache": analytics_cache.stats(),
        "overall_status": "Healthy"
    }

def clear_all_caches() -> Dict[str, str]:
    response_cache.clear()
    embedding_cache.clear()
    knowledge_graph_cache.clear()
    recommendation_cache.clear()
    analytics_cache.clear()
    return {"status": "success", "message": "All system caches flushed successfully"}
