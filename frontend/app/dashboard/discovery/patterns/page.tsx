"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Layers,
  RefreshCw,
  GitBranch,
  Activity,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Network,
  Loader2
} from "lucide-react";

interface PatternRelationship {
  id: number;
  uuid: string;
  title: string;
  patternType: string;
  description: string;
  equipmentId?: number;
  correlatedEquipmentIds?: string;
  failureCount: number;
  correlationCoefficient: number;
  createdAt: string;
}

export default function HiddenPatternsPage() {
  const pathname = usePathname();
  const [patterns, setPatterns] = useState<PatternRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Overview", path: "/dashboard/discovery" },
    { name: "Hidden Patterns", path: "/dashboard/discovery/patterns" },
    { name: "Knowledge Gaps", path: "/dashboard/discovery/gaps" },
    { name: "Risk Discovery", path: "/dashboard/discovery/risks" },
    { name: "Optimization Center", path: "/dashboard/discovery/optimization" },
    { name: "Discovery Analytics", path: "/dashboard/discovery/analytics" },
  ];

  useEffect(() => {
    async function fetchPatterns() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/discovery/patterns");
        setPatterns(res.data || []);
      } catch (err) {
        console.error("Failed to load pattern relationships", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPatterns();
  }, []);

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Hidden Failure Pattern Discovery
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                AI correlation engine flagging repeated failure loops, equipment manufacturer clusters, and seasonal parameter drifts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {subTabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* PATTERN NETWORK GRAPH VISUALIZER */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-400" />
            Failure Pattern Correlation Topology
          </h3>
          <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 font-medium">
            Dynamic Node Cluster
          </span>
        </div>

        {/* SVG Topology Viewbox */}
        <div className="relative w-full h-64 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 600 240">
            <defs>
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Connecting Edges */}
            <line x1="150" y1="120" x2="300" y2="70" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
            <line x1="150" y1="120" x2="300" y2="170" stroke="#a855f7" strokeWidth="2" />
            <line x1="300" y1="70" x2="450" y2="120" stroke="#6366f1" strokeWidth="2" />
            <line x1="300" y1="170" x2="450" y2="120" stroke="#6366f1" strokeWidth="2" />

            {/* Nodes */}
            {/* Center Pattern Node */}
            <g transform="translate(150, 120)">
              <circle r="30" fill="url(#purpleGrad)" stroke="#a855f7" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="10" fontWeight="bold">PUMP-P102</text>
            </g>

            <g transform="translate(300, 70)">
              <circle r="24" fill="#0f172a" stroke="#fb923c" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#fb923c" fontSize="9" fontWeight="bold">Shaft Seizure</text>
            </g>

            <g transform="translate(300, 170)">
              <circle r="24" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#ef4444" fontSize="9" fontWeight="bold">Overheating</text>
            </g>

            <g transform="translate(450, 120)">
              <circle r="28" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
              <text textAnchor="middle" dy="4" fill="#ffffff" fontSize="10" fontWeight="bold">TURBINE-T203</text>
            </g>
          </svg>
        </div>
      </div>

      {/* PATTERNS DATA LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mr-3" />
          <span>Analyzing Failure Correlations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patterns.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-purple-500/30 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {item.patternType}
                </span>
                <span className="text-xs text-slate-400">
                  Correlation: <strong className="text-emerald-400 font-bold">{(item.correlationCoefficient * 100).toFixed(0)}%</strong>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Failure Count: <strong className="text-white ml-1">{item.failureCount}</strong>
                </span>
                <span>Correlated Assets: <strong className="text-indigo-300">{item.correlatedEquipmentIds || "General"}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
