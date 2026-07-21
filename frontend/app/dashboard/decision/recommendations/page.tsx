"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DecisionHeader } from "@/components/DecisionHeader";
import {
  Compass,
  Search,
  ShieldCheck,
  AlertTriangle,
  Play,
  TrendingUp,
  Cpu,
  Clock,
  DollarSign,
  Loader2,
  ChevronRight,
  Info,
  Calendar,
  Layers
} from "lucide-react";

interface DecisionRecommendationResponse {
  id: number;
  uuid: string;
  recommendation_type: string;
  severity: string;
  risk_score: number;
  priority: string;
  title: string;
  description: string;
  recommended_action: string;
  expected_benefit: string;
  estimated_cost: number;
  estimated_downtime: number;
  failure_probability: number;
  confidence_score: number;
  status: string;
  created_at: string;
  equipment?: { id: number; asset_name: string; asset_tag: string; status: string };
}

export default function AIRecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<DecisionRecommendationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("Pending");

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        severity: severityFilter !== "all" ? severityFilter : undefined
      };
      
      const res = await api.get("/api/decision-recommendations", { params });
      setRecommendations(res.data || []);
    } catch (err) {
      console.error("Failed to load recommendations", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true);
      const res = await api.post("/api/decision-recommendations/evaluate");
      alert(res.data.message || "Pipeline evaluation completed successfully.");
      await loadRecommendations();
    } catch (err) {
      console.error(err);
      alert("Failed to run pipeline evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAction = async (uuid: string, status: "Approved" | "Rejected") => {
    try {
      await api.post(`/api/decision-recommendations/${uuid}/approve`, { status });
      alert(`Recommendation successfully marked as ${status}.`);
      await loadRecommendations();
    } catch (err) {
      console.error(err);
      alert("Failed to modify recommendation status.");
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [severityFilter, statusFilter]);

  const getSeverityStyle = (sev: string) => {
    return {
      Critical: "bg-red-500/10 text-red-400 border-red-500/20",
      High: "bg-amber-500/10 text-amber-450 border-amber-500/20",
      Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Low: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }[sev] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <DecisionHeader />

      {/* FILTER & CONTROL PANEL */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 items-center justify-between">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-350 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-350 focus:outline-none"
          >
            <option value="Pending">Pending Evaluation</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Implemented">Implemented</option>
            <option value="all">All Recommendations</option>
          </select>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="w-full md:w-auto px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-all shadow-md shadow-purple-600/10"
        >
          {isEvaluating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          Run Decision Engine Pipeline
        </button>
      </div>

      {/* RECOMMENDATIONS CARDS */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <div key={rec.uuid} className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col justify-between space-y-4 hover:border-purple-550 transition-colors">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getSeverityStyle(rec.severity)}`}>
                      {rec.severity}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">
                      {rec.recommendation_type}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-bold">
                    Prob: {rec.failure_probability}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{rec.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Asset: <span className="text-indigo-400 font-bold">{rec.equipment?.asset_tag || "General"}</span> ({rec.equipment?.asset_name || "Facility Asset"})
                  </p>
                </div>

                <p className="text-xs text-slate-350 leading-relaxed font-light line-clamp-3">
                  {rec.description}
                </p>

                {/* Recommended Action & Benefit */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Action</span>
                    <p className="text-slate-200 mt-0.5 font-medium">{rec.recommended_action}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Expected Benefit</span>
                    <p className="text-slate-350 mt-0.5 leading-relaxed font-light">{rec.expected_benefit}</p>
                  </div>
                </div>

                {/* Estimations block */}
                <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Est. Cost</span>
                      <span className="font-bold text-white">${rec.estimated_cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-sky-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Est. Downtime</span>
                      <span className="font-bold text-white">{rec.estimated_downtime} Hrs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => router.push(`/dashboard/decision/explainable?uuid=${rec.uuid}`)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1"
                >
                  Inspect Evidence <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {rec.status === "Pending" && (
                  <>
                    <button
                      onClick={() => handleAction(rec.uuid, "Rejected")}
                      className="px-3 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-[11px] font-bold text-red-400"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(rec.uuid, "Approved")}
                      className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-[11px] font-bold text-white shadow-md shadow-purple-600/10"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500 text-xs">
          <Compass className="w-10 h-10 text-slate-750 mx-auto mb-3 animate-pulse" />
          No recommendations matching current filters found. Trigger a manual pipeline evaluation above!
        </div>
      )}
    </div>
  );
}
