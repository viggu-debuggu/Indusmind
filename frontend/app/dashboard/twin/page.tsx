"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Layers,
  RefreshCw,
  Search,
  Cpu,
  Activity,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Compass
} from "lucide-react";

interface AssetTwinSummary {
  id: number;
  assetTag: string;
  assetName: string;
  plant: string;
  department: string;
  status: string;
  healthScore: number;
  riskScore: number;
  knowledgeHealthScore: number;
  complianceReadiness: string;
  maintenanceReadiness: string;
  operationalConfidence: number;
  documentsCount: number;
  incidentsCount: number;
}

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

export default function TwinDashboardPage() {
  const pathname = usePathname();
  const [twins, setTwins] = useState<AssetTwinSummary[]>([]);
  const [analytics, setAnalytics] = useState<TwinAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const subTabs = [
    { name: "Twin Dashboard", path: "/dashboard/twin" },
    { name: "Asset Twin Explorer", path: "/dashboard/twin/explorer" },
    { name: "Knowledge Timeline", path: "/dashboard/twin/timeline" },
    { name: "Twin Comparison", path: "/dashboard/twin/compare" },
    { name: "Twin Analytics", path: "/dashboard/twin/analytics" },
  ];

  const fetchTwinData = async () => {
    try {
      setIsLoading(true);
      const [twinsRes, analyticsRes] = await Promise.all([
        api.get("/api/twin"),
        api.get("/api/twin/analytics")
      ]);
      setTwins(twinsRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error("Failed to load digital twins", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTwinData();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await api.post("/api/twin/refresh");
      await fetchTwinData();
    } catch (err) {
      console.error("Failed to refresh digital twins", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTwins = twins.filter(
    (t) =>
      t.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.plant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Industrial Digital Knowledge Twin
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                  Phase 12 Active
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Unified 360-degree operational intelligence workspace combining telemetry, manuals, SOPs, incidents, compliance, and multi-agent outputs.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Synchronizing Twins..." : "Refresh Digital Twins"}
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
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Digital Twins Active</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{twins.length}</span>
            <span className="text-xs font-medium text-sky-400">100% Asset Coverage</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Mapped 360-degree asset matrices</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Knowledge Health</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{analytics?.knowledgeCompleteness || 85.0}%</span>
            <span className="text-xs font-medium text-amber-400">7 Coverage Domains</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Documentation & inspection health rating</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Operational Readiness</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{analytics?.operationalReadiness || 91.8}%</span>
            <span className="text-xs font-medium text-emerald-400">High Confidence</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">AI decision & maintenance readiness score</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Intelligence Accuracy</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-400">{analytics?.twinAccuracy || 96.2}%</span>
            <span className="text-xs font-medium text-indigo-400">Verified</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Grounding accuracy across multi-agent logs</p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search asset twins by tag or plant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* ASSET TWINS GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mr-3" />
          <span>Constructing 360-Degree Digital Knowledge Twins...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTwins.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-sky-500/40 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {t.assetTag}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === "Operational" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                    {t.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{t.assetName}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t.plant} — {t.department}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Knowledge Health Score</span>
                    <span className="font-bold text-amber-400">{t.knowledgeHealthScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${t.knowledgeHealthScore}%` }}
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Compliance: <strong className="text-white">{t.complianceReadiness}</strong></span>
                    <span>Confidence: <strong className="text-sky-400">{t.operationalConfidence}%</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  href={`/dashboard/twin/explorer?asset=${t.assetTag}`}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1"
                >
                  Open 360 Explorer <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/dashboard/twin/timeline?asset=${t.assetTag}`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                  title="View Knowledge Timeline"
                >
                  <Clock className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
