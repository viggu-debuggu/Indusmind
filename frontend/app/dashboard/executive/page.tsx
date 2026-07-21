"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Briefcase,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Activity,
  Award,
  Sparkles,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpRight,
  Loader2,
  PieChart
} from "lucide-react";

interface EnterpriseKPIs {
  plantHealthScore: number;
  aiConfidenceScore: number;
  knowledgeHealthScore: number;
  complianceReadinessScore: number;
  maintenanceReadinessScore: number;
  assetReliabilityScore: number;
  operationalReadinessScore: number;
  downtimeRiskScore: number;
  knowledgeGrowthScore: number;
  continuousLearningScore: number;
}

interface ExecutiveDashboardData {
  enterpriseKpis: EnterpriseKPIs;
  financialImpactTotal: number;
  potentialDowntimeCost: number;
  predictedCostSavings: number;
  avoidedFailuresCount: number;
  criticalAssetsCount: number;
  highRiskAssetsCount: number;
  pendingRecommendationsCount: number;
  riskHeatmap: any[];
  topRisks: any[];
  topOpportunities: any[];
}

export default function ExecutiveDashboardPage() {
  const pathname = usePathname();
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const subTabs = [
    { name: "Executive Dashboard", path: "/dashboard/executive" },
    { name: "Plant Overview", path: "/dashboard/executive/plant" },
    { name: "Operational Intelligence", path: "/dashboard/executive/operational" },
    { name: "Risk Intelligence", path: "/dashboard/executive/risk" },
    { name: "Financial Impact", path: "/dashboard/executive/financial" },
    { name: "Executive Reports", path: "/dashboard/executive/reports" },
  ];

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/executive/dashboard");
      setData(res.data || null);
    } catch (err) {
      console.error("Failed to load executive dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await api.post("/api/executive/refresh");
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to refresh executive center", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const kpis = data?.enterpriseKpis;

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Executive AI Command Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Phase 14 Active
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Strategic executive intelligence aggregating plant health, financial ROI, enterprise risks, and AI recommendations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Calculating Strategic Metrics..." : "Refresh Command Center"}
        </button>
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

      {isLoading || !data ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
          <span>Aggregating Enterprise Executive Intelligence...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* FINANCIAL ROI HERO BANNER */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-amber-950/30 border border-emerald-500/30 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Enterprise AI Financial ROI & Cost Savings
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight">
                ${data.financialImpactTotal.toLocaleString()}{" "}
                <span className="text-sm font-normal text-slate-400">/ Year</span>
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                Consolidated multi-asset shutdown windows, avoided failures ({data.avoidedFailuresCount} prevented), and statutory compliance reduction.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Downtime Risk Exposure</span>
                <span className="text-xl font-bold text-rose-400 mt-1 block">${data.potentialDowntimeCost.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Pending AI Proposals</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">{data.pendingRecommendationsCount} Actions</span>
              </div>
            </div>
          </div>

          {/* 10 ENTERPRISE KPIS GRID */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              10 Enterprise KPI Strategic Scorecard
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Plant Health</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">{kpis?.plantHealthScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">AI Confidence</span>
                <span className="text-2xl font-black text-indigo-400 mt-1 block">{kpis?.aiConfidenceScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Knowledge Health</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">{kpis?.knowledgeHealthScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Compliance Readiness</span>
                <span className="text-2xl font-black text-sky-400 mt-1 block">{kpis?.complianceReadinessScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Maintenance Readiness</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block">{kpis?.maintenanceReadinessScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Asset Reliability</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">{kpis?.assetReliabilityScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Operational Readiness</span>
                <span className="text-2xl font-black text-sky-400 mt-1 block">{kpis?.operationalReadinessScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Downtime Risk</span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">{kpis?.downtimeRiskScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Knowledge Growth</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">+{kpis?.knowledgeGrowthScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
                <span className="text-[11px] font-semibold text-slate-400 block">Continuous Learning</span>
                <span className="text-2xl font-black text-violet-400 mt-1 block">{kpis?.continuousLearningScore}%</span>
              </div>
            </div>
          </div>

          {/* PLANT RISK HEATMAP */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" />
              Enterprise Plant Risk Heatmap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.riskHeatmap.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{item.plant}</span>
                    <span style={{ color: item.color }} className="text-xs font-bold uppercase">{item.risk_level} Risk</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.department}</p>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${item.risk_score}%`, backgroundColor: item.color }} className="h-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RISKS & OPPORTUNITIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RISKS */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Top Business Risks
              </h3>

              <div className="space-y-3">
                {data.topRisks.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{r.title}</span>
                      <span className="text-rose-400">${r.financial_exposure.toLocaleString()} Exposure</span>
                    </div>
                    <p className="text-slate-400">{r.impact_description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* OPPORTUNITIES */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Top Strategic Opportunities
              </h3>

              <div className="space-y-3">
                {data.topOpportunities.map((o, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{o.title}</span>
                      <span className="text-emerald-400">${o.savings.toLocaleString()} Savings</span>
                    </div>
                    <p className="text-slate-400">Priority: {o.priority}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
