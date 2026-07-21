"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Award,
  Layers,
  Loader2,
  Cpu
} from "lucide-react";

interface TwinAnalytics {
  twinCoveragePct: number;
  knowledgeCompleteness: number;
  twinAccuracy: number;
  knowledgeGrowthPct: number;
  documentationQuality: number;
  operationalReadiness: number;
  aiConfidence: number;
  readinessTrend: number[];
}

export default function TwinAnalyticsPage() {
  const pathname = usePathname();
  const [analytics, setAnalytics] = useState<TwinAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Twin Dashboard", path: "/dashboard/twin" },
    { name: "Asset Twin Explorer", path: "/dashboard/twin/explorer" },
    { name: "Knowledge Timeline", path: "/dashboard/twin/timeline" },
    { name: "Twin Comparison", path: "/dashboard/twin/compare" },
    { name: "Twin Analytics", path: "/dashboard/twin/analytics" },
  ];

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/twin/analytics");
        setAnalytics(res.data || null);
      } catch (err) {
        console.error("Failed to load twin analytics", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Digital Knowledge Twin Analytics
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Multi-dimensional platform analytics measuring twin coverage, documentation quality, and operational readiness.
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
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* ANALYTICS CARDS */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mr-3" />
          <span>Aggregating Platform Twin Readiness Metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Asset Twin Coverage</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-sky-400">{analytics?.twinCoveragePct}%</span>
                <Cpu className="w-6 h-6 text-sky-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Percentage of registered plant equipment</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Knowledge Completeness</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-amber-400">{analytics?.knowledgeCompleteness}%</span>
                <Sparkles className="w-6 h-6 text-amber-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Average across 7 intelligence domains</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Operational Readiness</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-400">{analytics?.operationalReadiness}%</span>
                <ShieldCheck className="w-6 h-6 text-emerald-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">AI decision readiness index</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase text-slate-400">Twin Model Accuracy</span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-indigo-400">{analytics?.twinAccuracy}%</span>
                <Award className="w-6 h-6 text-indigo-400 opacity-60" />
              </div>
              <p className="text-xs text-slate-400 mt-2">Grounding validation rating</p>
            </div>
          </div>

          {/* READINESS TRAJECTORY VISUALIZER */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              AI Operational Readiness Trajectory
            </h3>

            <div className="h-48 flex items-end justify-between gap-4 pt-8 px-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {(analytics?.readinessTrend || [86.0, 87.5, 89.0, 91.2, 93.0, 94.0]).map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-sky-300">{val}%</span>
                  <div
                    style={{ height: `${(val / 100) * 120}px` }}
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400 shadow-lg shadow-sky-500/20"
                  />
                  <span className="text-[10px] text-slate-500 font-medium uppercase">Phase {idx + 7}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
