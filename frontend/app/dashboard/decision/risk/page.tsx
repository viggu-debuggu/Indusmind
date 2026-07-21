"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DecisionHeader } from "@/components/DecisionHeader";
import {
  AlertTriangle,
  Search,
  Cpu,
  ChevronRight,
  Loader2,
  TrendingDown,
  Activity,
  History
} from "lucide-react";

export default function EquipmentRiskCenterPage() {
  const [riskData, setRiskData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadRiskData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/decision-recommendations/stats");
      const data = res.data?.risk_heatmap_data || [];
      setRiskData(data);
    } catch (err) {
      console.error("Failed to load risk center details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const filtered = riskData.filter((item) =>
    item.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
    item.asset_name.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskBadge = (score: number) => {
    const isHigh = score > 70;
    const isMed = score > 40 && score <= 70;
    
    const classes = isHigh ? "bg-red-500/10 text-red-450 border-red-500/20" :
                    isMed ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-emerald-500/10 text-emerald-450 border-emerald-500/20";
                    
    const text = isHigh ? "CRITICAL RISK" : isMed ? "MODERATE RISK" : "NORMAL STABILITY";
    return <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${classes}`}>{text}</span>;
  };

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <DecisionHeader />

      {/* SEARCH CARD */}
      <div className="p-4 rounded-xl border border-slate-805 bg-slate-900/40 relative">
        <span className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Search by equipment asset tag or model names..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* DATA GRID */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl min-h-[400px] flex flex-col justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" /> Equipment Risk Asset Matrix
        </h3>

        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : filtered.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 pb-3 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Asset Tag</th>
                  <th className="pb-3">Asset Name</th>
                  <th className="pb-3">Health Score</th>
                  <th className="pb-3">Operational Status</th>
                  <th className="pb-3">Risk Assessment</th>
                  <th className="pb-3 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/20 transition-colors">
                    <td className="py-4 font-bold text-indigo-400 font-mono">{item.asset_tag}</td>
                    <td className="py-4 font-semibold text-slate-200">{item.asset_name}</td>
                    <td className="py-4 font-semibold text-slate-350">{item.health_score}%</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === "Operational" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        item.status === "Degraded" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4">{getRiskBadge(item.risk_score)}</td>
                    <td className="py-4 text-right font-mono font-bold text-white text-sm">{item.risk_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              No matching assets found in the risk index.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
