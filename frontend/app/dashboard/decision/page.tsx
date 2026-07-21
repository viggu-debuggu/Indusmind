"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Activity,
  Plus,
  Compass,
  AlertTriangle,
  History as HistoryIcon,
  BarChart3,
  HelpCircle,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Zap,
  Clock,
  Loader2,
  ChevronRight,
  TrendingDown,
  DollarSign
} from "lucide-react";

import { DecisionHeader } from "@/components/DecisionHeader";


export default function DecisionDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/decision-recommendations/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load Decision Intelligence stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <DecisionHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : stats ? (
        <>
          {/* STATS PANEL */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Recommendations", value: stats.total_recommendations, change: `${stats.recommendations_pending} Pending`, icon: Activity, color: "text-purple-400" },
              { label: "Critical Assets Tracked", value: stats.critical_assets_count, change: "Need inspection", icon: AlertTriangle, color: "text-red-400" },
              { label: "Savings Generated", value: `$${stats.savings_generated_usd.toLocaleString()}`, change: "Downtime avoided", icon: DollarSign, color: "text-emerald-400" },
              { label: "Downtime Avoided", value: `${stats.downtime_avoided_hrs} Hrs`, change: "Fleet average", icon: Clock, color: "text-sky-400" }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                    <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
                    <span className="text-[10px] text-slate-450 mt-1 block font-semibold">{kpi.change}</span>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC RISK HEATMAP & SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* HEATMAP COLUMN */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400 animate-pulse" /> Equipment Risk Heatmap
                </h3>
                <Link href="/dashboard/decision/risk" className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center">
                  Risk Center <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4 pt-2">
                {stats.risk_heatmap_data && stats.risk_heatmap_data.length > 0 ? (
                  stats.risk_heatmap_data.map((eq: any, index: number) => {
                    const isHigh = eq.risk_score > 70;
                    const isMed = eq.risk_score > 40 && eq.risk_score <= 70;
                    
                    return (
                      <div key={index} className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/30 flex justify-between items-center gap-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-slate-200 block">{eq.asset_tag}</span>
                          <span className="text-[10px] text-slate-500">{eq.asset_name}</span>
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-end max-w-xs">
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/40 hidden sm:block">
                            <div
                              style={{ width: `${eq.risk_score}%` }}
                              className={`h-full rounded-full ${
                                isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                          </div>

                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            isHigh ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            isMed ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                          }`}>
                            Risk: {eq.risk_score}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-650">No equipment logs found.</div>
                )}
              </div>
            </div>

            {/* PIPELINE OVERVIEW INFO */}
            <div className="space-y-6">
              {/* DESCRIPTION BOX */}
              <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 shadow-2xl space-y-3">
                <h4 className="text-sm font-bold text-purple-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Explainable Inference
                </h4>
                <p className="text-xs leading-relaxed text-slate-350 font-light">
                  INDUSMIND AI Decision Intelligence processes sensor streams in real-time. When parameters deviate, it executes semantic searches across the Document Vault, Incident Log databases, and Tribal Knowledge cards.
                </p>
                <p className="text-xs leading-relaxed text-slate-350 font-light">
                  It builds recommendations supported by logical Evidence nodes showing EXACTLY which document page, telemetry readings, or expert warning triggers the decision alert.
                </p>
              </div>

              {/* SAVINGS INFO BOX */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Decision Uptime Savings
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 rounded bg-slate-950/40 border border-slate-850">
                    <span className="text-slate-400">Acceptance Rate</span>
                    <span className="font-bold text-purple-400">{stats.acceptance_rate_pct}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded bg-slate-950/40 border border-slate-850">
                    <span className="text-slate-400">Avg AI Confidence</span>
                    <span className="font-bold text-emerald-400">{Math.round(stats.average_confidence_pct)}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500">Failed to load decision statistics.</div>
      )}
    </div>
  );
}
