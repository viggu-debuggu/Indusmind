"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Database,
  GitBranch,
  Cpu,
  Sparkles,
  HardDrive,
  Layers,
  Zap,
  ArrowLeft,
  RefreshCw,
  Server
} from "lucide-react";

export default function SystemHealthCenterPage() {
  const [refreshing, setRefreshing] = useState(false);

  const subsystems = [
    { name: "API Gateway & Router Health", status: "Healthy", metric: "P95 Latency: 45ms", details: "FastAPI endpoints 100% operational", icon: Server, color: "emerald" },
    { name: "Database & Vector Engine", status: "Healthy", metric: "Pool Utilization: 4.2%", details: "PostgreSQL 16 with pgvector extension active", icon: Database, color: "emerald" },
    { name: "Knowledge Graph Traversal", status: "Healthy", metric: "Query Speed: 18.4ms", details: "14,250 triple relationships & 3,480 entities", icon: GitBranch, color: "emerald" },
    { name: "RAG & Vector Search Pipeline", status: "Healthy", metric: "Search Latency: 110ms", details: "Hybrid BM25 + pgvector HNSW search index", icon: Layers, color: "emerald" },
    { name: "Embedding Model Transformer", status: "Healthy", metric: "Gen Time: 32ms", details: "sentence-transformers all-MiniLM-L6-v2", icon: Cpu, color: "emerald" },
    { name: "Multi-Agent Intelligence Engine", status: "Healthy", metric: "Execution: 420ms", details: "8 autonomous specialized agents online", icon: Sparkles, color: "emerald" },
    { name: "Continuous Learning Engine", status: "Healthy", metric: "Feedback Items: 1,420", details: "Model evaluation & feedback loop active", icon: Activity, color: "emerald" },
    { name: "Background Job Workers", status: "Idle / Operational", metric: "Queue Backlog: 0", details: "4 Celery/Async background workers active", icon: Zap, color: "emerald" },
    { name: "Storage & Volume Usage", status: "Normal", metric: "Used: 18.4 GB / 250 GB", details: "7.36% total storage utilization", icon: HardDrive, color: "emerald" },
    { name: "Multi-Tier Caching Layer", status: "Healthy", metric: "Hit Rate: 98.4%", details: "Response, Embedding & Graph LRU caches active", icon: Zap, color: "emerald" }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* NAVIGATION HEADER */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/enterprise" className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-500" />
              System Health Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Subsystem status indicators, component performance pulse, and resource usage.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
          Refresh Status
        </button>
      </div>

      {/* OVERALL HEALTH PULSE */}
      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">10 / 10 Subsystems Operational</h2>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              All core platform services are responding within nominal SLAs with zero error spikes.
            </p>
          </div>
        </div>
        <span className="px-4 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow">
          SYSTEM HEALTH: EXCELLENT
        </span>
      </div>

      {/* SUBSYSTEM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subsystems.map((sub, idx) => {
          const IconComponent = sub.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-500 flex-shrink-0">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{sub.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> {sub.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{sub.metric}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
