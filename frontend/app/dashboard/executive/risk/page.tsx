"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  Activity,
  DollarSign,
  Loader2
} from "lucide-react";

export default function RiskIntelligencePage() {
  const pathname = usePathname();
  const [riskData, setRiskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Executive Dashboard", path: "/dashboard/executive" },
    { name: "Plant Overview", path: "/dashboard/executive/plant" },
    { name: "Operational Intelligence", path: "/dashboard/executive/operational" },
    { name: "Risk Intelligence", path: "/dashboard/executive/risk" },
    { name: "Financial Impact", path: "/dashboard/executive/financial" },
    { name: "Executive Reports", path: "/dashboard/executive/reports" },
  ];

  useEffect(() => {
    async function fetchRisk() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/executive/risk");
        setRiskData(res.data || null);
      } catch (err) {
        console.error("Failed to load risk intelligence data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRisk();
  }, []);

  const getSeverityBadgeColor = (sev: string) => {
    switch (sev) {
      case "Critical": return "bg-red-500 text-white font-semibold";
      case "High": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Enterprise Risk Intelligence & Heatmap
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitors critical operational risks, emerging wear spikes, compliance exposures, and financial risk limits.
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
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* RISKS LIST */}
      {isLoading || !riskData ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mr-3" />
          <span>Aggregating Enterprise Risk Exposures...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {riskData.risks.map((item: any) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-rose-500/30 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {item.risk_category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs ${getSeverityBadgeColor(item.severity)}`}>
                    {item.severity} Severity
                  </span>
                </div>

                <span className="text-xs text-rose-400 font-bold">
                  Exposure: ${item.financial_exposure.toLocaleString()}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{item.impact_description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span>Affected Equipment: <strong className="text-white ml-1">{item.affected_assets}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
