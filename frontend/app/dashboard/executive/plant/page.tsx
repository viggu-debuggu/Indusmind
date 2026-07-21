"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Briefcase,
  Layers,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Cpu
} from "lucide-react";

export default function PlantOverviewPage() {
  const pathname = usePathname();
  const [plantData, setPlantData] = useState<any>(null);
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
    async function fetchPlantOverview() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/executive/plant");
        setPlantData(res.data || null);
      } catch (err) {
        console.error("Failed to load plant overview data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlantOverview();
  }, []);

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Multi-Plant Operational Overview
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Site-level operational overview summarizing plant availability, health scores, and department throughput.
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

      {/* PLANT SITES GRID */}
      {isLoading || !plantData ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
          <span>Aggregating Site Level Operational Data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plantData.plants.map((p: any, idx: number) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === "Operational" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-sky-500/10 text-sky-400 border border-sky-500/20"}`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Health Score</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{p.health_score}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Critical Assets</span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">{p.critical_assets} Assets</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DEPARTMENT BREAKDOWN */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Department Operational Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              {plantData.heatmap.map((h: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-white block">{h.department}</span>
                    <span className="text-slate-400">{h.plant}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ color: h.color }} className="font-bold uppercase">{h.risk_level} Risk ({h.risk_score}%)</span>
                    <span className="px-3 py-1 rounded bg-slate-800 text-slate-200">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
