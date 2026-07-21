"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DecisionHeader } from "@/components/DecisionHeader";
import {
  History,
  ShieldCheck,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  CheckCircle2,
  UserCheck
} from "lucide-react";

interface RecommendationHistoryItem {
  uuid: string;
  recommendation_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  estimated_cost: number;
  estimated_downtime: number;
  equipment?: { asset_tag: string; asset_name: string };
}

export default function RecommendationHistoryPage() {
  const [historyItems, setHistoryItems] = useState<RecommendationHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"Approved" | "Rejected">("Approved");
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const params = { status: activeTab };
      const res = await api.get("/api/decision-recommendations", { params });
      setHistoryItems(res.data || []);
    } catch (err) {
      console.error("Failed to load recommendation audits history", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeTab]);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <DecisionHeader />

      {/* Audit Sub-navigation */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        {[
          { key: "Approved", label: "Approved Actions", icon: ShieldCheck, color: "text-emerald-450" },
          { key: "Rejected", label: "Rejected/Dismissed", icon: XCircle, color: "text-red-400" }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? "bg-slate-900 border border-slate-800 text-white shadow-xl"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* History Items list */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl min-h-[400px] flex flex-col justify-between">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : historyItems.length > 0 ? (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <div key={item.uuid} className="p-5 rounded-xl border border-slate-850 bg-slate-950/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-bold text-xs text-slate-200">{item.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{item.equipment?.asset_tag || "General"}]</span>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-light leading-relaxed">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1.5">
                    <span className="flex items-center gap-0.5"><Calendar className="w-3.5 h-3.5" /> Logged: {new Date(item.created_at).toLocaleDateString()}</span>
                    {item.approved_by && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><UserCheck className="w-3.5 h-3.5" /> auditor: {item.approved_by}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-0">
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider flex items-center gap-1 ${
                    item.status === "Approved"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {item.status === "Approved" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {item.status}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Cost: ${item.estimated_cost.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-xs">
            <History className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
            No decision audit log records found matching current status filter.
          </div>
        )}
      </div>
    </div>
  );
}
