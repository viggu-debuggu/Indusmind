"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MemoryHeader } from "@/components/MemoryHeader";
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  FolderOpen,
  PieChart,
  UserCheck,
  Brain,
  ShieldCheck,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function KnowledgeAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/expert-knowledge/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load analytics statistics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <MemoryHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : stats ? (
        <>
          {/* TOP SUMMARY KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Captures", value: stats.total_entries, change: "+14.5% MoM", icon: Brain, color: "text-indigo-400" },
              { label: "Verification Ratio", value: `${Math.round((stats.verified_entries / (stats.total_entries || 1)) * 100)}%`, change: `${stats.verified_entries} Approved`, icon: ShieldCheck, color: "text-emerald-400" },
              { label: "Knowledge Reuse Rate", value: `${stats.reuse_rate_pct}%`, change: "RAG groundings", icon: CheckCircle, color: "text-sky-400" },
              { label: "Gap Priority Areas", value: stats.knowledge_gap_areas.length, change: "Need logs", icon: AlertTriangle, color: "text-amber-400" }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                    <p className="text-2xl font-black text-white mt-1">{kpi.value}</p>
                    <span className="text-[10px] text-slate-450 mt-1 block font-semibold">{kpi.change}</span>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* CATEGORIES SPLIT BAR CHART */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-indigo-400" /> Category Volume Distribution
              </h3>

              <div className="space-y-4 pt-2">
                {Object.entries(stats.categories_breakdown || {}).map(([category, count]: any) => {
                  const max = Math.max(...(Object.values(stats.categories_breakdown) as number[])) || 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-350">{category}</span>
                        <span className="text-slate-400">{count} entries</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/40">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            category === "Mechanical" ? "bg-indigo-500" :
                            category === "Electrical" ? "bg-sky-500" :
                            category === "Process" ? "bg-emerald-500" :
                            category === "Safety" ? "bg-red-500" : "bg-purple-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOP CONTRIBUTORS LEADERBOARD */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" /> Top Experts Contributor Board
              </h3>

              <div className="space-y-3 pt-2">
                {stats.top_contributors && stats.top_contributors.length > 0 ? (
                  stats.top_contributors.map((contrib: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-xs text-slate-300 block">{contrib.author}</span>
                          <span className="text-[10px] text-slate-500">Active tribal consultant</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {contrib.count} entries
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No expert authors logged.
                  </div>
                )}
              </div>
            </div>

            {/* MOST REFERENCED FAILURE MODES */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400 animate-pulse" /> Top Failure Symptoms & Topics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.top_failure_topics && stats.top_failure_topics.length > 0 ? (
                  stats.top_failure_topics.map((topic: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-300 block">{topic.topic}</span>
                        <span className="text-[10px] text-slate-500">Failure mode symptom</span>
                      </div>
                      <span className="text-slate-400 font-bold">{topic.count} references</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs col-span-2">
                    No failure topics recorded yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500 text-xs">
          Failed to load analytics panel.
        </div>
      )}
    </div>
  );
}
