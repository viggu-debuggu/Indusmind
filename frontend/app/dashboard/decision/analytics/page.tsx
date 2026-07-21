"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DecisionHeader } from "@/components/DecisionHeader";
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Loader2,
  DollarSign,
  Clock,
  Compass,
  CheckCircle2,
  TrendingDown,
  Activity
} from "lucide-react";

export default function DecisionAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/decision-recommendations/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load decision intelligence stats metrics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
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
          {/* STATS KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Uptime Savings", value: `$${stats.savings_generated_usd.toLocaleString()}`, color: "text-emerald-400", change: "Avoided repair cost" },
              { label: "Downtime Avoided", value: `${stats.downtime_avoided_hrs} Hrs`, color: "text-sky-400", change: "System total" },
              { label: "Acceptance Rate", value: `${stats.acceptance_rate_pct}%`, color: "text-purple-400", change: "Closed audits ratio" },
              { label: "Decision Accuracy", value: "96.4%", color: "text-indigo-400", change: "AI grounding precision" }
            ].map((kpi, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                  <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
                  <span className="text-[10px] text-slate-450 mt-1 block font-semibold">{kpi.change}</span>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center ${kpi.color}`}>
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* TWO COLUMN CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* DOWNTIME AVOIDED BY RECOMMENDATION TYPE */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" /> Potential Downtime Avoided by Type
              </h3>

              <div className="space-y-4 pt-2">
                {[
                  { name: "Immediate Shutdown Sequence", hours: 24.0, pct: 100, color: "bg-red-500" },
                  { name: "Sleeve Bearing Replacement", hours: 6.0, pct: 25, color: "bg-amber-500" },
                  { name: "Statutory Valve Recalibration", hours: 2.0, pct: 8, color: "bg-emerald-500" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-350">{item.name}</span>
                      <span className="text-slate-450">{item.hours} Hours</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/40">
                      <div style={{ width: `${item.pct}%` }} className={`h-full rounded-full ${item.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI DECISION STABILITY HEALTH MATRIX */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> Decision Grounding Performance
              </h3>

              <div className="space-y-3 pt-2 text-xs">
                {[
                  { metric: "Grounding manual correlation", score: "98.2%", desc: "Direct OEM references match" },
                  { metric: "Expert heuristics cross-referencing", score: "94.6%", desc: "Aligned with retired operator notes" },
                  { metric: "Incident correlation accuracy", score: "92.0%", desc: "Historical lessons matched" }
                ].map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                    <div>
                      <span className="font-semibold text-slate-300 block">{m.metric}</span>
                      <span className="text-[10px] text-slate-500">{m.desc}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">
                      {m.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500 text-xs">
          Failed to compile decision analytics.
        </div>
      )}
    </div>
  );
}
