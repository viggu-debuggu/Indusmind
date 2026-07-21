"use client";

import React from "react";
import Link from "next/link";
import {
  Gauge,
  ArrowLeft,
  Activity,
  Server,
  Clock,
  AlertTriangle,
  Terminal,
  CheckCircle2
} from "lucide-react";

export default function ObservabilityMonitoringPage() {
  const componentTimings = [
    { name: "Database Response Time", ms: 12.4, target: "< 25ms", status: "Optimal" },
    { name: "Knowledge Graph Traversal", ms: 18.4, target: "< 50ms", status: "Optimal" },
    { name: "Embedding Generation", ms: 32.0, target: "< 100ms", status: "Optimal" },
    { name: "RAG Pipeline Retrieval", ms: 110.5, target: "< 200ms", status: "Optimal" },
    { name: "AI Agent Execution Time", ms: 420.0, target: "< 1000ms", status: "Optimal" }
  ];

  const recentTraces = [
    { reqId: "req-8f92a10b", path: "/api/v1/ai/chat/stream", duration: "118.2ms", status: 200, time: "Just now" },
    { reqId: "req-3c41e99f", path: "/api/v1/equipment/predictions", duration: "24.5ms", status: 200, time: "1 min ago" },
    { reqId: "req-1a2b3c4d", path: "/api/v1/graph/query", duration: "18.1ms", status: 200, time: "2 mins ago" },
    { reqId: "req-7e8f9a0b", path: "/api/v1/enterprise/health", duration: "8.4ms", status: 200, time: "3 mins ago" }
  ];

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
              <Gauge className="w-6 h-6 text-violet-500" />
              Observability & Telemetry Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured application metrics, latency percentiles, request tracing, and SLA alerts.
            </p>
          </div>
        </div>
      </div>

      {/* LATENCY PERCENTILES HERO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">P50 Latency</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">14.2 ms</p>
          <span className="text-[11px] text-emerald-500 font-semibold">Median Response Time</span>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">P95 Latency</span>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">45.0 ms</p>
          <span className="text-[11px] text-emerald-500 font-semibold">95th Percentile</span>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">P99 Latency</span>
          <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">112.5 ms</p>
          <span className="text-[11px] text-emerald-500 font-semibold">99th Percentile</span>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Success Rate</span>
          <p className="text-3xl font-extrabold text-emerald-500 mt-1">100.0%</p>
          <span className="text-[11px] text-emerald-500 font-semibold">0 HTTP 5xx Errors</span>
        </div>
      </div>

      {/* COMPONENT TIMINGS BREAKDOWN */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Component Latency Breakdown
        </h2>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {componentTimings.map((c, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                <p className="text-slate-500 dark:text-slate-400">Target SLA: {c.target}</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{c.ms} ms</span>
                <span className="block text-[10px] text-emerald-500 font-semibold">{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REQUEST TRACES */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-sky-500" />
          Recent Request Traces (X-Request-ID)
        </h2>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-2">
          {recentTraces.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">{t.status} OK</span>
                <span className="text-slate-400">{t.reqId}</span>
                <span className="text-white font-semibold">{t.path}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-indigo-400">{t.duration}</span>
                <span className="text-slate-500 text-[10px]">{t.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
