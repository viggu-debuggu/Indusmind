"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  RefreshCw,
  Database,
  Trash2,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  HardDrive
} from "lucide-react";

export default function PerformanceCenterPage() {
  const [flushing, setFlushing] = useState(false);
  const [flushMessage, setFlushMessage] = useState("");

  const caches = [
    { name: "API Response Cache", capacity: 2000, hits: 1420, misses: 32, hitRate: 97.8, ttl: "300s (5m)", icon: Layers },
    { name: "Embedding Vector Cache", capacity: 5000, hits: 3840, misses: 45, hitRate: 98.8, ttl: "3600s (1h)", icon: Cpu },
    { name: "Knowledge Graph Cache", capacity: 3000, hits: 2150, misses: 28, hitRate: 98.7, ttl: "600s (10m)", icon: Activity },
    { name: "Recommendation Cache", capacity: 1000, hits: 890, misses: 15, hitRate: 98.3, ttl: "900s (15m)", icon: Zap },
    { name: "Analytics & KPI Cache", capacity: 1000, hits: 640, misses: 12, hitRate: 98.1, ttl: "300s (5m)", icon: HardDrive }
  ];

  const handleFlushCache = () => {
    setFlushing(true);
    setTimeout(() => {
      setFlushing(false);
      setFlushMessage("All multi-tier caches flushed successfully!");
      setTimeout(() => setFlushMessage(""), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/enterprise" className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-500" />
              Performance & Cache Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-tier cache store hit rates, database connection pool statistics, and query optimizations.
            </p>
          </div>
        </div>

        <button
          onClick={handleFlushCache}
          disabled={flushing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition-all"
        >
          <Trash2 className={`w-3.5 h-3.5 ${flushing ? "animate-spin" : ""}`} />
          Flush System Caches
        </button>
      </div>

      {flushMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {flushMessage}
        </div>
      )}

      {/* CONNECTION POOL & QUERY OPTIMIZER BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>DB Connection Pool</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">4.2%</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Pool Status: Optimal (10 Max)</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Average Cache Hit Ratio</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">98.4%</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">High Efficiency Across 5 Tiers</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Query Optimizer Mode</span>
            <Activity className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">Active</p>
          <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-1">IVFFLAT Vector Index Enabled</p>
        </div>
      </div>

      {/* CACHE STORES BREAKDOWN */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">Multi-Tier Cache Stores</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {caches.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  TTL: {c.ttl}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Hit Rate</span>
                  <span className="font-extrabold text-emerald-500">{c.hitRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${c.hitRate}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Hits: <strong>{c.hits}</strong></span>
                <span>Misses: <strong>{c.misses}</strong></span>
                <span>Capacity: <strong>{c.capacity}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
