"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Activity,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Sparkles,
  Loader2
} from "lucide-react";

interface OperationalIntelligence {
  equipmentAvailabilityPct: number;
  maintenancePerformancePct: number;
  inspectionCompletionPct: number;
  incidentTrend: number[];
  discoveryTrend: number[];
  agentCollaborationVelocity: number;
}

export default function OperationalIntelligencePage() {
  const pathname = usePathname();
  const [data, setData] = useState<OperationalIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Executive Dashboard", path: "/dashboard/executive" },
    { name: "Plant Overview", path: "/dashboard/executive/plant" },
    { name: "Operational Intelligence", path: "/dashboard/executive/operational" },
    { name: "Risk Intelligence", path: "/dashboard/executive/risk" },
    { name: "Financial Impact", path: "/dashboard/executive/financial" },
    { name: "Executive Reports", path: "/dashboard/executive/reports" },
  ];

  useEffect(() => {
    async function fetchOperational() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/executive/operational");
        setData(res.data || null);
      } catch (err) {
        console.error("Failed to load operational intelligence data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOperational();
  }, []);

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Enterprise Operational Intelligence
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time tracking of equipment availability, maintenance efficiency, inspection completion, and multi-agent velocity.
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
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* METRIC CARDS */}
      {isLoading || !data ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
          <span>Aggregating Operational Performance Metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Equipment Availability</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-400">{data.equipmentAvailabilityPct}%</span>
                <Cpu className="w-6 h-6 text-emerald-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Active plant uptime index</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Maintenance Performance</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-sky-400">{data.maintenancePerformancePct}%</span>
                <ShieldCheck className="w-6 h-6 text-sky-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">SOP execution speed</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Inspection Completion</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-amber-400">{data.inspectionCompletionPct}%</span>
                <CheckCircle2 className="w-6 h-6 text-amber-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Statutory audit completion rating</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Multi-Agent Velocity</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-indigo-400">{data.agentCollaborationVelocity}%</span>
                <Sparkles className="w-6 h-6 text-indigo-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Autonomous RCA resolution speed</p>
            </div>
          </div>

          {/* DISCOVERY FINDINGS TRAJECTORY */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              AI Discovery Findings & Pattern Uncovering Trend
            </h3>

            <div className="h-48 flex items-end justify-between gap-4 pt-8 px-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {(data.discoveryTrend || [12, 15, 18, 20, 22, 24]).map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-amber-300">{val}</span>
                  <div
                    style={{ height: `${(val / 30) * 120}px` }}
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20"
                  />
                  <span className="text-[10px] text-slate-500 font-medium uppercase">Month {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
