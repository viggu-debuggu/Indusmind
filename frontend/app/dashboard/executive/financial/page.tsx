"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function FinancialImpactPage() {
  const pathname = usePathname();
  const [financialData, setFinancialData] = useState<any>(null);
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
    async function fetchFinancial() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/executive/financial");
        setFinancialData(res.data || null);
      } catch (err) {
        console.error("Failed to load financial impact data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFinancial();
  }, []);

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
                Financial Impact & ROI Intelligence
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Quantifies cost savings from failure avoidance, downtime reduction, maintenance optimization, and knowledge reuse.
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

      {/* HERO CARD */}
      {isLoading || !financialData ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mr-3" />
          <span>Calculating Financial Impact & Cost Savings...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Total Annual Financial Impact Savings
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight">
                ${financialData.total_savings.toLocaleString()}{" "}
                <span className="text-sm font-normal text-slate-400">/ Year</span>
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                Delivered through AI decision intelligence, failure avoidance, and SOP standardization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Downtime Risk Exposure</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">${financialData.potential_downtime_cost.toLocaleString()}</span>
            </div>
          </div>

          {/* FINANCIAL ITEMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {financialData.items.map((item: any) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.category}
                    </span>
                    <span className="text-lg font-black text-white">${item.amount.toLocaleString()}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
