"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  FileText,
  Cpu,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Loader2,
  Server,
  Database,
  HardDrive,
  Sparkles,
  Clock,
  ShieldCheck
} from "lucide-react";

/* ─── Animated SVG Radial Gauge ─── */
function RadialGauge({ value, label, color, size = 100 }: { value: number; label: string; color: string; size?: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  const getColor = (v: number) => {
    if (v >= 75) return "#22c55e";
    if (v >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(animatedValue)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-bold text-white">{Math.round(animatedValue)}%</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

/* ─── Animated Bar ─── */
function AnimatedBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? (value / max) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 300);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 truncate">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold text-slate-300 w-8 text-right">{value}</span>
    </div>
  );
}

interface EquipmentItem {
  id: number;
  assetName: string;
  assetTag: string;
  status: string;
  healthScore: number;
}

interface DocumentLog {
  id: number;
  documentName: string;
  fileExtension: string;
  fileSize: number;
  createdAt: string;
  processingStatus: string;
}

interface HealthStatus {
  status: string;
  database: string;
  database_latency_ms: number | null;
  ai_service: string;
  ai_provider: string;
  storage: string;
  storage_provider: string;
}

export default function DashboardPage() {
  const [docCount, setDocCount] = useState<number>(0);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocumentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [maintenanceTrends, setMaintenanceTrends] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);

        // Parallel fetch
        const [docsRes, eqRes, healthRes] = await Promise.all([
          api.get("/api/documents?limit=5").catch(() => ({ data: { total: 0, items: [] } })),
          api.get("/api/equipment").catch(() => ({ data: [] })),
          api.get("/api/health").catch(() => ({ data: null })),
        ]);

        setDocCount(docsRes.data.total || 0);
        setRecentDocs(docsRes.data.items || []);
        setEquipment(eqRes.data || []);
        setHealthData(healthRes.data || null);

        // Fetch analytics reports for maintenance trends
        try {
          const analyticsRes = await api.get("/api/analytics/reports");
          setMaintenanceTrends(analyticsRes.data?.maintenance_trends || []);
        } catch {
          // Fallback
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute live machinery stats
  const healthyCount = equipment.filter(e => e.status.toLowerCase() === "operational").length;
  const warningCount = equipment.filter(e => e.status.toLowerCase() === "maintenance").length;
  const criticalCount = equipment.filter(e => e.status.toLowerCase() === "degraded").length;
  const avgHealth = equipment.length > 0
    ? Math.round(equipment.reduce((sum, e) => sum + (e.healthScore || 0), 0) / equipment.length)
    : 0;

  const stats = [
    {
      title: "Total Documents",
      value: isLoading ? "..." : docCount.toString(),
      change: "Indexed files",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Healthy Assets",
      value: isLoading ? "..." : healthyCount.toString(),
      change: "Operational",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Warning Assets",
      value: isLoading ? "..." : warningCount.toString(),
      change: "In Maintenance",
      icon: Wrench,
      color: "text-amber-400",
      bg: "bg-amber-500/10"
    },
    {
      title: "Critical Assets",
      value: isLoading ? "..." : criticalCount.toString(),
      change: "Action Required",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10"
    },
    {
      title: "Fleet Health",
      value: isLoading ? "..." : `${avgHealth}%`,
      change: avgHealth >= 75 ? "Good" : avgHealth >= 50 ? "Fair" : "Critical",
      icon: Activity,
      color: avgHealth >= 75 ? "text-emerald-400" : avgHealth >= 50 ? "text-amber-400" : "text-red-400",
      bg: avgHealth >= 75 ? "bg-emerald-500/10" : avgHealth >= 50 ? "bg-amber-500/10" : "bg-red-500/10"
    }
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // System vitals data
  const systemVitals = [
    {
      label: "Backend API",
      status: healthData?.status === "healthy" ? "online" : "degraded",
      detail: healthData?.status === "healthy" ? "Healthy" : "Degraded",
      icon: Server
    },
    {
      label: "Database",
      status: healthData?.database === "connected" ? "online" : "offline",
      detail: healthData?.database_latency_ms ? `${healthData.database_latency_ms}ms` : "N/A",
      icon: Database
    },
    {
      label: "AI Pipeline",
      status: healthData?.ai_service === "online" ? "online" : "offline",
      detail: healthData?.ai_provider || "N/A",
      icon: Sparkles
    },
    {
      label: "Storage",
      status: healthData?.storage === "connected" ? "online" : "offline",
      detail: healthData?.storage_provider || "N/A",
      icon: HardDrive
    }
  ];

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white page-enter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Industrial Control Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time operations, knowledge aggregation, and asset intelligence telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/documents"
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            Upload Documents <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* SYSTEM VITALS BAR */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-center mr-2">System Vitals</span>
        {systemVitals.map((v, idx) => {
          const Icon = v.icon;
          return (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/40">
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${v.status === "online" ? "bg-emerald-400" : v.status === "degraded" ? "bg-amber-400" : "bg-red-400"}`} />
                {v.status === "online" && (
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
                )}
              </div>
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-300">{v.label}</span>
              <span className="text-[10px] text-slate-500">{v.detail}</span>
            </div>
          );
        })}
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-200"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {stat.title}
                </span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
                </span>
                <span className={`text-[11px] font-bold ${stat.color}`}>{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DASHBOARD MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* RECENT UPLOADS TABLE */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Aggregation Logs</h3>
              <p className="text-xs text-slate-400">Latest document uploads and AI processing states.</p>
            </div>
            <Link
              href="/dashboard/documents"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-350 flex items-center gap-0.5"
            >
              View Document Vault <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 pb-3 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                  <th className="pb-3">Asset File</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Date Indexed</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentDocs.length > 0 ? (
                  recentDocs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/20">
                      <td className="py-3.5 font-medium text-slate-200 truncate max-w-[200px]" title={log.documentName}>
                        {log.documentName}
                      </td>
                      <td className="py-3.5 text-xs text-slate-400 font-light">{formatBytes(log.fileSize)}</td>
                      <td className="py-3.5 text-xs text-slate-400 font-light">{new Date(log.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          log.processingStatus === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          log.processingStatus === "Failed" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {log.processingStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-xs font-semibold">
                      No documents ingested yet. Go to Document Vault to upload.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: GAUGES + HEALTH DISTRIBUTION */}
        <div className="space-y-6">
          {/* ASSET HEALTH GAUGES */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">Equipment Health Gauges</h3>
                <p className="text-[10px] text-slate-400">Live telemetry-derived health scores.</p>
              </div>
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>

            {!isLoading && equipment.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {equipment.slice(0, 3).map((eq) => (
                  <div key={eq.id} className="relative flex flex-col items-center">
                    <RadialGauge value={eq.healthScore} label="" size={80} color="" />
                    <span className="text-[9px] text-slate-400 font-bold mt-1 truncate max-w-[70px] text-center">{eq.assetTag}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            )}
          </div>

          {/* EQUIPMENT STATUS DISTRIBUTION */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">Asset Status Distribution</h3>
                <p className="text-[10px] text-slate-400">Fleet composition by operating state.</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>

            {!isLoading ? (
              <div className="space-y-3">
                <AnimatedBar value={healthyCount} max={equipment.length} color="#22c55e" label="Operational" />
                <AnimatedBar value={warningCount} max={equipment.length} color="#f59e0b" label="Maintenance" />
                <AnimatedBar value={criticalCount} max={equipment.length} color="#ef4444" label="Degraded" />
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            )}
          </div>

          {/* MAINTENANCE TRENDS MINI CHART */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">Maintenance Trends</h3>
                <p className="text-[10px] text-slate-400">Preventive vs Reactive (4 weeks).</p>
              </div>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>

            {maintenanceTrends.length > 0 ? (
              <div className="space-y-2">
                {maintenanceTrends.map((trend: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-bold w-8">{trend.week}</span>
                    <div className="flex-1 flex gap-1 items-center">
                      <div
                        className="h-4 rounded bg-indigo-500/80 transition-all duration-700"
                        style={{ width: `${(trend.preventive / 10) * 100}%` }}
                        title={`Preventive: ${trend.preventive}`}
                      />
                      <div
                        className="h-4 rounded bg-rose-500/60 transition-all duration-700"
                        style={{ width: `${(trend.reactive / 10) * 100}%` }}
                        title={`Reactive: ${trend.reactive}`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500">{trend.preventive}/{trend.reactive}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 mt-3 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500" /> Preventive</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500/60" /> Reactive</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                No trend data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
