"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AgentHeader } from "@/components/AgentHeader";
import {
  BarChart3,
  Loader2,
  Cpu,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  ShieldAlert
} from "lucide-react";

export default function AgentAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/agents/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <AgentHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* UTILIZATION RATIOS */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> Agent Task Utilization Rates
            </h3>

            <div className="space-y-4 pt-2">
              {Object.entries(stats.agents_utilization).map(([name, count]: any, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-350">{name}</span>
                    <span className="text-slate-450">{count} tasks</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/40">
                    <div
                      style={{ width: `${Math.min(count * 10, 100)}%` }}
                      className="h-full rounded-full bg-cyan-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACCURACY COMPARISONS */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" /> Accuracy & Grounding Precision
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              {Object.entries(stats.agents_accuracy).map(([name, score]: any, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="font-semibold text-slate-300">{name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">Failed to load analytics statistics.</div>
      )}
    </div>
  );
}
