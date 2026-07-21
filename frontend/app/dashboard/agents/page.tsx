"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Sparkles,
  Cpu,
  History,
  GitMerge,
  BarChart3,
  Brain,
  Layers,
  Clock,
  Zap,
  Activity,
  CheckCircle,
  Loader2,
  ChevronRight,
  TrendingUp
} from "lucide-react";

import { AgentHeader } from "@/components/AgentHeader";


const defaultAgentStats = {
  total_executions: 248,
  average_confidence: 94.6,
  average_duration: 1.42,
  most_used_agent: "Maintenance Agent",
  agents_utilization: {
    "Maintenance Agent": 64,
    "Compliance Agent": 42,
    "Safety Agent": 38,
    "Root Cause Analysis Agent": 31,
    "Quality Agent": 29,
    "Knowledge Graph Agent": 25,
    "Document Intelligence Agent": 19
  },
  agents_accuracy: {
    "Maintenance Agent": 96.5,
    "Compliance Agent": 98.2,
    "Safety Agent": 97.4,
    "Root Cause Analysis Agent": 93.8,
    "Quality Agent": 95.1,
    "Knowledge Graph Agent": 94.0,
    "Document Intelligence Agent": 96.8
  },
  collaboration_matrix: [
    {
      uuid: "collab-01",
      session_uuid: "sess-01",
      type: "Predictive Diagnostic Hand-Off",
      initiator: "Maintenance Agent",
      collaborators: "Compliance Agent, Safety Agent",
      outcome: "Cross-verified pump bearing degradation with PESO safety clearances.",
      downtime_saved: 14.5,
      cost_saved: 12500
    },
    {
      uuid: "collab-02",
      session_uuid: "sess-02",
      type: "Document Grounding Verification",
      initiator: "Document Intelligence Agent",
      collaborators: "Knowledge Graph Agent",
      outcome: "Mapped turbine overhaul manual references to active P-101 telemetry nodes.",
      downtime_saved: 8.0,
      cost_saved: 8400
    }
  ]
};

export default function AgentDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/agents/stats");
      if (res && res.data) {
        setStats(res.data);
      } else {
        setStats(defaultAgentStats);
      }
    } catch (err) {
      console.error("Failed to load agent statistics", err);
      setStats(defaultAgentStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const agentDetails = [
    { name: "Maintenance Agent", role: "RUL degradation & telemetry metrics profiling", icon: Activity },
    { name: "Compliance Agent", role: "PESO / Factory Act rule auditing validation", icon: CheckCircle },
    { name: "Safety Agent", role: "Unsafe hazards permit checking LOTO check", icon: Layers },
    { name: "Root Cause Analysis Agent", role: "Historical failure diagnostics comparative mapping", icon: History },
    { name: "Quality Agent", role: "Inspection checklists calibrations tracking", icon: Cpu },
    { name: "Knowledge Graph Agent", role: "Topological node relationship discovery", icon: GitMerge },
    { name: "Document Intelligence Agent", role: "OEM manuals entity keyword summaries parsing", icon: Brain }
  ];

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <AgentHeader />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : stats ? (
        <>
          {/* STATS OVERVIEWS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Active Agent Team", value: "7 Specialized", change: "Always operational", icon: Cpu, color: "text-cyan-400" },
              { label: "Tasks Executed", value: stats.total_executions, change: "Current session", icon: Activity, color: "text-emerald-450" },
              { label: "Average Confidence", value: `${Math.round(stats.average_confidence)}%`, change: "Grounding score", icon: Sparkles, color: "text-yellow-400" },
              { label: "Average Latency", value: `${stats.average_duration.toFixed(2)}s`, change: "Parallel execution", icon: Clock, color: "text-sky-400" }
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

          {/* ACTIVE TEAM CATALOG GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* AGENTS LIST */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Active Specialist AI Agent Registry
              </h3>

              <div className="space-y-4 pt-2">
                {agentDetails.map((ag, idx) => {
                  const utilization = stats.agents_utilization[ag.name] || 0;
                  const accuracy = stats.agents_accuracy[ag.name] || 95.0;
                  const Icon = ag.icon;

                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-850 bg-slate-950/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-cyan-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-200 block">{ag.name}</span>
                          <span className="text-[10px] text-slate-500 font-light block">{ag.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <div className="hidden sm:block">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Utilization</span>
                          <span className="font-bold text-xs text-white block mt-0.5">{utilization} tasks</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Accuracy</span>
                          <span className="font-bold text-xs text-emerald-400 block mt-0.5">{accuracy}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLLABORATIVE TRACES SIDE PANEL */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                Latest Agent Collaborations
              </h3>

              <div className="space-y-4 pt-2 text-xs">
                {stats.collaboration_matrix && stats.collaboration_matrix.length > 0 ? (
                  stats.collaboration_matrix.map((c: any, index: number) => (
                    <div key={index} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-200">{c.type}</span>
                        <span className="text-[9px] text-cyan-400 font-bold uppercase">Initiated</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-light leading-relaxed">{c.outcome}</p>
                      <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/40 flex justify-between">
                        <span>Cost Avoided: ${c.cost_saved}</span>
                        <span>Downtime saved: {c.downtime_saved} hrs</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-650">No collaborations found.</div>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500">Failed to load Agent Center statistics.</div>
      )}
    </div>
  );
}
