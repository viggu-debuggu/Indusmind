"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Cpu,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
  Sparkles,
  Search,
  BookOpen,
  PieChart
} from "lucide-react";

interface AnalyticsSummary {
  kpis: {
    organizations: number;
    plants: number;
    departments: number;
    assets: number;
    documents: number;
    active_work_orders: number;
    critical_assets: number;
    ai_alerts: number;
    compliance_score: number;
    maintenance_due: number;
    pending_approvals: number;
    ai_queries_today: number;
    storage_usage_mb: number;
  };
  most_searched_documents: Array<{ name: string; count: number }>;
  frequently_asked_questions: Array<{ question: string; count: number }>;
  highest_failure_equipment: Array<{ tag: string; failures: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/analytics");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics summary", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-3 text-slate-450 selection:bg-indigo-500 selection:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-bold">Aggregating operations database statistics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-3 text-slate-450 selection:bg-indigo-500 selection:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-bold">Aggregating operations database statistics...</span>
      </div>
    );
  }

  const activeStats = data;
  const graphGrowth = (activeStats as any).knowledge_graph_growth || [];
  const nodeCount = graphGrowth[graphGrowth.length - 1]?.nodes || 0;

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-550" /> Enterprise Analytics & KPIs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time operations tracking, document search popularity, and predictive failure statistics.
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Compliance Score</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">{activeStats.kpis.compliance_score}%</div>
          <p className="text-[10px] text-slate-450 mt-1">Target Framework Coverage</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Critical Assets</span>
          <div className="text-3xl font-black text-red-400 mt-1">{activeStats.kpis.critical_assets}</div>
          <p className="text-[10px] text-slate-450 mt-1">Requires Calibration</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">AI Queries Today</span>
          <div className="text-3xl font-black text-indigo-400 mt-1">{activeStats.kpis.ai_queries_today}</div>
          <p className="text-[10px] text-slate-450 mt-1">RAG Copilot Conversations</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Storage Size</span>
          <div className="text-3xl font-black text-slate-200 mt-1">{(activeStats.kpis.storage_usage_mb || 0.0).toFixed(1)} MB</div>
          <p className="text-[10px] text-slate-450 mt-1">Total Vector + Binary size</p>
        </div>
      </div>

      {/* HIGHER-LEVEL ENTITY COUNTS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
        <div className="p-3 border border-slate-850 bg-slate-900/60 rounded-xl">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Orgs</span>
          <strong className="text-lg text-slate-200">{activeStats.kpis.organizations}</strong>
        </div>
        <div className="p-3 border border-slate-850 bg-slate-900/60 rounded-xl">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Plants</span>
          <strong className="text-lg text-slate-200">{activeStats.kpis.plants}</strong>
        </div>
        <div className="p-3 border border-slate-850 bg-slate-900/60 rounded-xl">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Depts</span>
          <strong className="text-lg text-slate-200">{activeStats.kpis.departments}</strong>
        </div>
        <div className="p-3 border border-slate-850 bg-slate-900/60 rounded-xl">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Assets</span>
          <strong className="text-lg text-slate-200">{activeStats.kpis.assets}</strong>
        </div>
        <div className="p-3 border border-slate-850 bg-slate-900/60 rounded-xl">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Documents</span>
          <strong className="text-lg text-slate-200">{activeStats.kpis.documents}</strong>
        </div>
        <div className="p-3 border border-slate-850 bg-slate-900/60 rounded-xl">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Pending Review</span>
          <strong className="text-lg text-amber-400">{activeStats.kpis.pending_approvals}</strong>
        </div>
      </div>

      {/* LOWER SECTION: TOP CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Most Searched Documents */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" /> Most Searched SOPs & Manuals
          </h3>
          <div className="space-y-3">
            {activeStats.most_searched_documents && activeStats.most_searched_documents.length > 0 ? (
              activeStats.most_searched_documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 border-b border-slate-850 text-xs">
                  <span className="text-slate-300 font-medium truncate max-w-xs">{doc.name}</span>
                  <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">{doc.count || doc.searches || 0} Queries</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                No searched documents recorded in the operational logs.
              </div>
            )}
          </div>
        </div>

        {/* FAQ Queries */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Frequently Asked AI Questions
          </h3>
          <div className="space-y-3">
            {activeStats.frequently_asked_questions && activeStats.frequently_asked_questions.length > 0 ? (
              activeStats.frequently_asked_questions.map((faq, idx) => (
                <div key={idx} className="p-2.5 border border-slate-850 text-xs space-y-1">
                  <p className="text-slate-350 italic font-light">"{faq.question || (faq as any).query}"</p>
                  <span className="text-[10px] text-slate-500 block">Prompted {faq.count || (faq as any).frequency || 0} times this week</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                No AI queries recorded in the operational logs.
              </div>
            )}
          </div>
        </div>

        {/* Highest Failures */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Machinery with Highest Failures
          </h3>
          <div className="space-y-3">
            {activeStats.highest_failure_equipment && activeStats.highest_failure_equipment.length > 0 ? (
              activeStats.highest_failure_equipment.map((eq, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 border-b border-slate-850 text-xs">
                  <span className="text-slate-300 font-semibold">{eq.tag || (eq as any).asset_tag}</span>
                  <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">{eq.failures} Failures</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                No equipment failure incidents recorded.
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Graph Tracking info */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-400" /> Knowledge Graph Growth
            </h3>
            <div className="py-6 text-center space-y-2">
              <div className="text-4xl font-black text-teal-400">{nodeCount}</div>
              <p className="text-xs text-slate-400">Semantic Nodes & Interlinks Extracted</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              Our AI indexing service extracts nodes and operational links (Entity matching, failure modes, sensor dependencies) directly from raw uploads.
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-550 flex justify-between font-mono">
            <span>RAG Vector Indices: pgvector</span>
            <span>Refreshed: Hourly</span>
          </div>
        </div>

      </div>

    </div>
  );
}
