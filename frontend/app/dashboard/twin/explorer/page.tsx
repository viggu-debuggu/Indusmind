"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Layers,
  Cpu,
  Activity,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  DollarSign,
  Package,
  BookOpen,
  Compass,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Flame,
  Info
} from "lucide-react";

function AssetTwinExplorerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedTag, setSelectedTag] = useState(searchParams.get("asset") || "PUMP-P102");
  const [twinData, setTwinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModuleTab, setActiveModuleTab] = useState("overview");

  const subTabs = [
    { name: "Twin Dashboard", path: "/dashboard/twin" },
    { name: "Asset Twin Explorer", path: "/dashboard/twin/explorer" },
    { name: "Knowledge Timeline", path: "/dashboard/twin/timeline" },
    { name: "Twin Comparison", path: "/dashboard/twin/compare" },
    { name: "Twin Analytics", path: "/dashboard/twin/analytics" },
  ];

  const availableAssets = [
    { tag: "PUMP-P102", name: "High-Pressure Centrifugal Pump" },
    { tag: "TURBINE-T203", name: "Superheated Gas Turbine Unit 4" },
    { tag: "BOILER-B401", name: "Industrial Heat Exchange Boiler" },
    { tag: "COMP-C300", name: "Reciprocating Air Compressor Unit" },
    { tag: "SUBSTATION-E1", name: "Primary Electric Control Substation" },
  ];

  const fetchTwinDetail = async (tag: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/twin/${tag}`);
      setTwinData(res.data || null);
    } catch (err) {
      console.error("Failed to fetch twin detail", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTwinDetail(selectedTag);
  }, [selectedTag]);

  const eq = twinData?.equipment;
  const twin = twinData?.twin;
  const health = twinData?.health;
  const telemetry = twinData?.telemetrySummary;

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER & ASSET SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                360-Degree Asset Twin Explorer
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Select an industrial machinery asset to view its complete Digital Knowledge Twin matrix.
              </p>
            </div>
          </div>
        </div>

        {/* ASSET SELECTOR */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Select Asset Twin:</span>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-sky-500/50"
          >
            {availableAssets.map((a) => (
              <option key={a.tag} value={a.tag}>
                {a.tag} — {a.name}
              </option>
            ))}
          </select>
        </div>
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

      {isLoading || !twinData ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mr-3" />
          <span>Assembling 360-Degree Digital Knowledge Twin for {selectedTag}...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ASSET OVERVIEW & HEALTH SCORE CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ASSET METADATA CARD */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {eq.assetTag}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${eq.status === "Operational" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                  {eq.status}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">{eq.assetName}</h2>
                <p className="text-xs text-slate-400 mt-1">{eq.plant} — {eq.department}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Manufacturer:</span><span className="text-white font-medium">{eq.manufacturer || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Model:</span><span className="text-white font-medium">{eq.model || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Running Hours:</span><span className="text-white font-medium">{eq.runningHours} hrs</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Remaining Useful Life (RUL):</span><span className="text-emerald-400 font-bold">{eq.remainingUsefulLife} hrs</span></div>
              </div>
            </div>

            {/* KNOWLEDGE HEALTH SCORE BREAKDOWN */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Overall Knowledge Health Score: <strong className="text-2xl text-amber-400 font-black">{health.overallHealthScore}%</strong>
                </h3>
                <span className="text-xs text-slate-400">Weighted 7-Domain Coverage</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Documentation</span>
                  <span className="text-lg font-bold text-sky-400 mt-1 block">{health.documentationCoverage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Inspections</span>
                  <span className="text-lg font-bold text-emerald-400 mt-1 block">{health.inspectionCoverage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Compliance</span>
                  <span className="text-lg font-bold text-indigo-400 mt-1 block">{health.complianceCoverage}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Expert Knowledge</span>
                  <span className="text-lg font-bold text-amber-400 mt-1 block">{health.expertKnowledgeCoverage}%</span>
                </div>
              </div>

              {/* READINESS BADGES */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div><span>Compliance Readiness: </span><strong className="text-emerald-400">{twin.complianceReadiness}</strong></div>
                <div><span>Maintenance Readiness: </span><strong className="text-sky-400">{twin.maintenanceReadiness}</strong></div>
                <div><span>AI Confidence: </span><strong className="text-indigo-400">{twin.operationalConfidence}%</strong></div>
              </div>
            </div>
          </div>

          {/* AI OPERATIONAL INSIGHTS SUMMARY BLOCK */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 backdrop-blur-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              AI 360-Degree Operational Insight Summary
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-semibold text-sky-400 uppercase tracking-wider block">Current Operational Summary</span>
                <p className="text-slate-300 leading-relaxed">{twin.operationalSummary}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider block">Recommended Action Protocol</span>
                <p className="text-slate-300 leading-relaxed">{twin.recommendedActions}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-semibold text-rose-400 uppercase tracking-wider block">Top Risks</span>
                <p className="text-slate-300 leading-relaxed">{twin.topRisks}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-semibold text-amber-400 uppercase tracking-wider block">Missing Documentation</span>
                <p className="text-slate-300 leading-relaxed">{twin.missingKnowledge}</p>
              </div>
            </div>
          </div>

          {/* MODULE TABS NAV */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
            {[
              { id: "overview", label: "Telemetry Feed" },
              { id: "docs", label: `Documents (${twinData.documents.length})` },
              { id: "incidents", label: `Incidents (${twinData.incidents.length})` },
              { id: "compliance", label: `Compliance (${twinData.compliance.length})` },
              { id: "expert", label: `Expert Cards (${twinData.expertKnowledge.length})` },
              { id: "recs", label: `Recommendations (${twinData.recommendations.length})` },
              { id: "spares", label: "Spare Parts" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModuleTab(m.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeModuleTab === m.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* MODULE CONTENT CONTAINER */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
            {activeModuleTab === "overview" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Telemetry Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Temperature</span>
                    <span className="text-lg font-bold text-white mt-1 block">{telemetry.temperature}°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Vibration</span>
                    <span className="text-lg font-bold text-white mt-1 block">{telemetry.vibration} mm/s</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Pressure</span>
                    <span className="text-lg font-bold text-white mt-1 block">{telemetry.pressure} Bar</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">RPM</span>
                    <span className="text-lg font-bold text-white mt-1 block">{telemetry.rpm}</span>
                  </div>
                </div>
              </div>
            )}

            {activeModuleTab === "docs" && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Associated Vault Documents</h4>
                {twinData.documents.map((d: any) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{d.document_name}</span>
                      <span className="text-slate-400">Category: {d.category} | Version: v{d.version}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{d.approval_status}</span>
                  </div>
                ))}
              </div>
            )}

            {activeModuleTab === "incidents" && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Historical Incidents & RCA</h4>
                {twinData.incidents.map((i: any) => (
                  <div key={i.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{i.incident_name}</span>
                      <span className="text-amber-400">{i.severity} Severity</span>
                    </div>
                    <p className="text-slate-400">Cause: {i.cause}</p>
                    <p className="text-emerald-400">Resolution: {i.resolution}</p>
                  </div>
                ))}
              </div>
            )}

            {activeModuleTab === "spares" && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Recommended Spare Parts Inventory</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {twinData.spare_parts.map((sp: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="font-bold text-white block">{sp.part_name}</span>
                      <span className="text-slate-400 block mt-1">Part #: {sp.part_number}</span>
                      <span className="text-emerald-400 block mt-1">Stock: {sp.stock_qty} units (Lead time: {sp.lead_time_days} days)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssetTwinExplorerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    }>
      <AssetTwinExplorerContent />
    </Suspense>
  );
}
