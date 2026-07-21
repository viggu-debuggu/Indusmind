"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  ShieldCheck,
  Activity,
  Loader2
} from "lucide-react";

export default function TwinComparisonPage() {
  const pathname = usePathname();

  const [asset1, setAsset1] = useState("PUMP-P102");
  const [asset2, setAsset2] = useState("TURBINE-T203");
  const [comparison, setComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const executeComparison = async (a1: string, a2: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/twin/compare?asset1=${a1}&asset2=${a2}`);
      setComparison(res.data || null);
    } catch (err) {
      console.error("Failed to load twin comparison", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeComparison(asset1, asset2);
  }, [asset1, asset2]);

  const a1 = comparison?.asset1;
  const a2 = comparison?.asset2;

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ArrowRightLeft className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Side-by-Side Digital Knowledge Twin Comparison
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Compare health, risk, documentation completeness, incidents, and AI operational readiness between two machinery assets.
              </p>
            </div>
          </div>
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

      {/* ASSETS SELECTOR ROW */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-around gap-6">
        <div className="w-full md:w-72">
          <label className="text-xs font-semibold text-sky-400 uppercase tracking-wider block mb-2">Asset Twin A</label>
          <select
            value={asset1}
            onChange={(e) => setAsset1(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50"
          >
            {availableAssets.map((a) => (
              <option key={a.tag} value={a.tag}>{a.tag} — {a.name}</option>
            ))}
          </select>
        </div>

        <div className="p-3 rounded-full bg-slate-800 text-slate-400">
          <ArrowRightLeft className="w-5 h-5" />
        </div>

        <div className="w-full md:w-72">
          <label className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-2">Asset Twin B</label>
          <select
            value={asset2}
            onChange={(e) => setAsset2(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50"
          >
            {availableAssets.map((a) => (
              <option key={a.tag} value={a.tag}>{a.tag} — {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* COMPARISON MATRIX TABLE */}
      {isLoading || !comparison ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
          <span>Executing Side-by-Side Twin Diagnostics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Metric / Property</th>
                  <th className="py-3 px-4 text-sky-400">{asset1} ({a1.name})</th>
                  <th className="py-3 px-4 text-purple-400">{asset2} ({a2.name})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Operational Status</td>
                  <td className="py-3.5 px-4"><span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{a1.status}</span></td>
                  <td className="py-3.5 px-4"><span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">{a2.status}</span></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Equipment Health Score</td>
                  <td className="py-3.5 px-4 font-bold text-white">{a1.health_score}%</td>
                  <td className="py-3.5 px-4 font-bold text-white">{a2.health_score}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Risk Score</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{a1.risk_score}%</td>
                  <td className="py-3.5 px-4 text-rose-400 font-bold">{a2.risk_score}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Knowledge Health Score</td>
                  <td className="py-3.5 px-4 font-black text-amber-400 text-base">{a1.knowledge_health_score}%</td>
                  <td className="py-3.5 px-4 font-black text-amber-400 text-base">{a2.knowledge_health_score}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Documentation Coverage</td>
                  <td className="py-3.5 px-4 text-sky-400 font-bold">{a1.documentation_coverage}%</td>
                  <td className="py-3.5 px-4 text-purple-400 font-bold">{a2.documentation_coverage}%</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Compliance Readiness</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{a1.compliance_status}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{a2.compliance_status}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">Incidents Logged</td>
                  <td className="py-3.5 px-4 font-bold">{a1.incidents_count}</td>
                  <td className="py-3.5 px-4 font-bold">{a2.incidents_count}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">AI Operational Confidence</td>
                  <td className="py-3.5 px-4 text-indigo-400 font-bold">{a1.ai_confidence}%</td>
                  <td className="py-3.5 px-4 text-indigo-400 font-bold">{a2.ai_confidence}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI SUMMARY WINNER CARD */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <p className="text-xs text-slate-300">
              <strong className="text-white">AI Evaluation Result:</strong> Asset twin <strong className="text-amber-400">{comparison.winner_knowledge}</strong> maintains higher overall Knowledge Completeness and Documentation Coverage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
