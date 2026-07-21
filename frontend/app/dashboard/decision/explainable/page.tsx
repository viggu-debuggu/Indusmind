"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { DecisionHeader } from "@/components/DecisionHeader";
import {
  HelpCircle,
  Cpu,
  ShieldAlert,
  Search,
  Loader2,
  FileText,
  Activity,
  History,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

interface EvidenceItem {
  id: number;
  source_type: string;
  source_title: string;
  relevance_score: number;
  summary: string;
  url?: string;
}

interface RecommendationDetail {
  id: number;
  recommendation_uuid: string;
  title: string;
  action_summary: string;
  urgency: string;
  confidence_score: number;
  estimated_cost: number;
  estimated_downtime: number;
  equipment?: { asset_tag: string; asset_name: string; status: string; health_score: number };
  evidence: EvidenceItem[];
}

const getEvidenceIcon = (type?: string) => {
  switch (type) {
    case "Telemetry": return Cpu;
    case "Document": return FileText;
    case "Expert Knowledge": return UserCheck;
    case "Incident": return AlertTriangle;
    default: return HelpCircle;
  }
};

function ExplainableAIContent() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get("uuid");

  const [recommendationsList, setRecommendationsList] = useState<any[]>([]);
  const [selectedUuid, setSelectedUuid] = useState<string>("");
  const [detail, setDetail] = useState<RecommendationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadList = async () => {
    try {
      const res = await api.get("/api/decision-recommendations");
      const list = res.data || [];
      setRecommendationsList(list);
      if (list.length > 0) {
        const initialUuid = uuid || list[0].recommendation_uuid;
        setSelectedUuid(initialUuid);
      }
    } catch (err) {
      console.error("Failed to fetch recommendation list", err);
    }
  };

  const loadDetail = async (targetUuid: string) => {
    if (!targetUuid) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/api/decision-recommendations/${targetUuid}`);
      setDetail(res.data);
    } catch (err) {
      console.error("Failed to load recommendation detail", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [uuid]);

  useEffect(() => {
    if (selectedUuid) {
      loadDetail(selectedUuid);
    }
  }, [selectedUuid]);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <DecisionHeader />

      {/* SELECTOR */}
      <div className="p-5 rounded-2xl border border-slate-805 bg-slate-900 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-500 animate-pulse" /> Explainable Inference Selector
          </h3>
          <span className="text-[10px] text-slate-500 font-light">Inspect explainability details and physical/tribal evidence mapping trees.</span>
        </div>

        <select
          value={selectedUuid}
          onChange={(e) => setSelectedUuid(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-350 focus:outline-none"
        >
          {recommendationsList.map((rec) => (
            <option key={rec.uuid} value={rec.uuid}>
              {rec.equipment?.asset_tag || "General"} - {rec.recommendation_type}
            </option>
          ))}
        </select>
      </div>

      {/* SPLIT SCREEN */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : detail ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: CORE DECISION SUMMARY */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Recommendation</span>
                <h4 className="text-sm font-bold text-white mt-1 leading-snug">{detail.title}</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Symptom Summary</span>
                  <p className="text-slate-350 mt-1 leading-relaxed font-light">{detail.action_summary}</p>
                </div>

                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                  <span className="text-[9px] font-bold text-purple-400 uppercase block">AI Inference Confidence</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xl font-mono font-bold text-white">{detail.confidence_score}%</span>
                    <span className="text-[10px] text-slate-400">Low variance</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Est. Downtime</span>
                    <span className="font-bold text-white mt-0.5 block">{detail.estimated_downtime} Hours</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Est. Repair Cost</span>
                    <span className="font-bold text-white mt-0.5 block">${detail.estimated_cost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: EVIDENCE TREE */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400 animate-pulse" /> Explainability Evidence Tree
            </h3>

            <div className="relative border-l border-slate-850 ml-4 space-y-6 pt-2">
              {detail.evidence && detail.evidence.length > 0 ? (
                detail.evidence.map((ev, index) => {
                  const Icon = getEvidenceIcon(ev.source_type);
                  return (
                    <div key={index} className="relative pl-6 group">
                      {/* marker dot */}
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-950 border-2 border-purple-500 group-hover:scale-110 transition-all" />

                      <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 hover:bg-slate-950/40 transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-[11px] text-slate-200">{ev.source_title}</span>
                          </div>

                          <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-bold">
                            Grounding: {(ev.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 font-light leading-relaxed">{ev.summary}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-600 text-xs">
                  No grounding evidence matches found for this recommendation card.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-xs">
          Select a recommendation to inspect explainability evidence.
        </div>
      )}
    </div>
  );
}

export default function ExplainableAIPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    }>
      <ExplainableAIContent />
    </Suspense>
  );
}
