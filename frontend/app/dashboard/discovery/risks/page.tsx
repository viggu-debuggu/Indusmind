"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  Loader2
} from "lucide-react";

interface RiskDiscovery {
  id: number;
  uuid: string;
  equipmentId?: number;
  riskType: string;
  title: string;
  description: string;
  confidenceScore: number;
  priority: string;
  businessImpact: string;
  evidence: string;
  createdAt: string;
}

export default function RiskDiscoveryPage() {
  const pathname = usePathname();
  const [risks, setRisks] = useState<RiskDiscovery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Overview", path: "/dashboard/discovery" },
    { name: "Hidden Patterns", path: "/dashboard/discovery/patterns" },
    { name: "Knowledge Gaps", path: "/dashboard/discovery/gaps" },
    { name: "Risk Discovery", path: "/dashboard/discovery/risks" },
    { name: "Optimization Center", path: "/dashboard/discovery/optimization" },
    { name: "Discovery Analytics", path: "/dashboard/discovery/analytics" },
  ];

  useEffect(() => {
    async function fetchRisks() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/discovery/risks");
        setRisks(res.data || []);
      } catch (err) {
        console.error("Failed to load risk discoveries", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRisks();
  }, []);

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
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
                Emerging Risk & Compliance Discovery
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitors telemetry wear trends, temperature anomalies, near miss patterns, and statutory compliance audit exposures.
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
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* RISK TIMELINE INDICATOR */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-rose-400" />
          Real-Time Emerging Risk Progression Timeline
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-red-500 ring-4 ring-slate-950" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">High Risk Alert • Active</span>
            <h4 className="text-sm font-bold text-white mt-0.5">Reciprocating Air Compressor COMP-C300 Temperature Spike</h4>
            <p className="text-xs text-slate-400 mt-1">Sensor logs indicate thermal reading of 88.0C exceeding baseline threshold limits.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-slate-950" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Compliance Audit Exposure</span>
            <h4 className="text-sm font-bold text-white mt-0.5">PESO Pressure Vessel Rule 18 Safety Valve Recalibration Due</h4>
            <p className="text-xs text-slate-400 mt-1">Annual hydraulic valve testing evidence package missing in Document Vault.</p>
          </div>
        </div>
      </div>

      {/* RISKS LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mr-3" />
          <span>Evaluating Telemetry Streams & Regulatory Audits...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {risks.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-rose-500/30 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {item.riskType}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs ${getPriorityBadgeColor(item.priority)}`}>
                    {item.priority} Priority
                  </span>
                </div>
                <span className="text-xs text-slate-400">Confidence: <strong className="text-white font-bold">{item.confidenceScore}%</strong></span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{item.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="font-semibold text-red-400 uppercase tracking-wider block mb-1">Business Impact</span>
                  <p className="text-slate-300">{item.businessImpact}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Supporting Evidence</span>
                  <p className="text-slate-300">{item.evidence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
