"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  DollarSign,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  Layers,
  Loader2
} from "lucide-react";

interface OptimizationOpportunity {
  id: number;
  uuid: string;
  equipmentId?: number;
  opportunityType: string;
  title: string;
  description: string;
  estimatedSavings: number;
  priority: string;
  confidence: number;
  createdAt: string;
}

export default function OptimizationCenterPage() {
  const pathname = usePathname();
  const [opts, setOpts] = useState<OptimizationOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);

  const subTabs = [
    { name: "Overview", path: "/dashboard/discovery" },
    { name: "Hidden Patterns", path: "/dashboard/discovery/patterns" },
    { name: "Knowledge Gaps", path: "/dashboard/discovery/gaps" },
    { name: "Risk Discovery", path: "/dashboard/discovery/risks" },
    { name: "Optimization Center", path: "/dashboard/discovery/optimization" },
    { name: "Discovery Analytics", path: "/dashboard/discovery/analytics" },
  ];

  useEffect(() => {
    async function fetchOpts() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/discovery/optimizations");
        setOpts(res.data || []);
      } catch (err) {
        console.error("Failed to load optimization opportunities", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOpts();
  }, []);

  const handleApplyOptimization = (id: number) => {
    setAppliedIds((prev) => [...prev, id]);
  };

  const totalSavings = opts.reduce((acc, curr) => acc + curr.estimatedSavings, 0);

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Operational & Maintenance Optimization Center
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                AI optimization recommendations for schedule consolidation, inspection extensions, spare inventory stocking, and turnaround synchronization.
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

      {/* SAVINGS SUMMARY HERO CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Total Discovered Financial & Downtime Savings
          </span>
          <h2 className="text-4xl font-black text-white tracking-tight">
            ${totalSavings.toLocaleString()}{" "}
            <span className="text-sm font-normal text-slate-400">/ Year</span>
          </h2>
          <p className="text-xs text-slate-300 mt-2">
            Consolidating multi-equipment shutdown windows and extending healthy inspection intervals.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Identified Proposals</span>
            <span className="text-2xl font-bold text-white mt-1 block">{opts.length}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Avg AI Confidence</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">91.0%</span>
          </div>
        </div>
      </div>

      {/* OPTIMIZATION LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mr-3" />
          <span>Formulating Optimization Proposals...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {opts.map((item) => {
            const isApplied = appliedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.opportunityType} Optimization
                    </span>
                    <span className="text-xs text-slate-400">
                      Priority: <strong className="text-white font-bold">{item.priority}</strong>
                    </span>
                    <span className="text-xs text-slate-400">
                      Confidence: <strong className="text-emerald-400 font-bold">{item.confidence}%</strong>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-300">{item.description}</p>
                </div>

                <div className="flex-shrink-0 text-right space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Estimated Savings</span>
                    <span className="text-2xl font-black text-emerald-400">${item.estimatedSavings.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => handleApplyOptimization(item.id)}
                    disabled={isApplied}
                    className={`w-full px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      isApplied
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isApplied ? "Applied to Calendar" : "Apply Optimization"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
