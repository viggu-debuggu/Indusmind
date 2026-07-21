"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Brain,
  Plus,
  BookOpen,
  History,
  BarChart3,
  GitBranch,
  ShieldCheck,
  Clock,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Cpu,
  Loader2
} from "lucide-react";

import { MemoryHeader } from "@/components/MemoryHeader";


export default function MemoryDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, listRes] = await Promise.all([
        api.get("/api/expert-knowledge/stats").catch(() => ({ data: null })),
        api.get("/api/expert-knowledge").catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setRecentEntries((listRes.data || []).slice(0, 4));
    } catch (err) {
      console.error("Failed to load Memory Dashboard stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 page-enter">
      <MemoryHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* STATS PANEL */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Knowledge Cards", value: stats.total_entries, color: "text-indigo-400", icon: Brain, bg: "bg-indigo-500/10" },
                { label: "Verification Status", value: `${stats.verified_entries} Approved`, color: "text-emerald-400", icon: ShieldCheck, bg: "bg-emerald-500/10" },
                { label: "Gaps Tracked", value: stats.knowledge_gap_areas.length, color: "text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10" },
                { label: "Knowledge Reuse Rate", value: `${stats.reuse_rate_pct}%`, color: "text-sky-400", icon: TrendingUp, bg: "bg-sky-500/10" }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
                      <p className="text-xl font-bold text-white mt-1">{item.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TWO PANEL ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT PANEL: RECENT ENTRIES */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" /> Recent Experience Submissions
                </h3>
                <Link href="/dashboard/memory/library" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
                  Library View <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {recentEntries.length > 0 ? (
                  recentEntries.map((item) => (
                    <div key={item.uuid} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-2">
                          <span className="flex items-center gap-0.5"><UserCheck className="w-3 h-3" /> {item.author} ({item.author_role})</span>
                          <span>·</span>
                          <span>Asset: {item.equipment?.asset_tag || "General"}</span>
                          <span>·</span>
                          <span>Category: {item.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 self-stretch md:self-auto justify-between md:justify-center border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          item.verification_status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {item.verification_status}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          Conf: {item.confidence_score}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No tribal experiences logged yet. Be the first to add expert notes!
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL: GAP TRACKER & DESCRIPTION */}
            <div className="space-y-6">
              {/* PLATFORM VALUE PROPOSITION */}
              <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 shadow-2xl space-y-3">
                <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                  <Brain className="w-4 h-4" /> Why tribal knowledge?
                </h4>
                <p className="text-xs leading-relaxed text-slate-350 font-light">
                  Industrial operations rely heavily on undocumented expert heuristics—the unique whistling sounds, vibration tremors, and thermal thermal anomalies noticed by operators over 30 years. 
                </p>
                <p className="text-xs leading-relaxed text-slate-350 font-light">
                  This AI platform converts subjective field observations into semantic vectors linked to safety SOPs, physical assets, and graph nodes to ensure that the tribal memory is preserved forever.
                </p>
              </div>

              {/* GAP AREA ASSESSOR */}
              {stats && stats.knowledge_gap_areas && (
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" /> Knowledge Gap Areas
                  </h3>
                  
                  <div className="space-y-3 text-xs">
                    {stats.knowledge_gap_areas.length > 0 ? (
                      stats.knowledge_gap_areas.map((gap: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-300 block">{gap.topic.split("(")[0]}</span>
                            <span className="text-[10px] font-mono text-slate-500">{gap.topic.includes("(") ? "(" + gap.topic.split("(")[1] : ""}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            gap.gap_priority === "High"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {gap.gap_priority} Priority
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-600">
                        No active knowledge gaps detected. All assets are documented!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
