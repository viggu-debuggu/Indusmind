"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
  Compass,
  Loader2
} from "lucide-react";

interface ModelEvaluation {
  recommendationAccuracy: number;
  answerQuality: number;
  citationQuality: number;
  knowledgeGraphQuality: number;
  agentCollaborationQuality: number;
  discoveryQuality: number;
  decisionSuccessRate: number;
  evaluationDate: string;
}

export default function ModelEvaluationPage() {
  const pathname = usePathname();
  const [evalData, setEvalData] = useState<ModelEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Feedback Center", path: "/dashboard/learning" },
    { name: "AI Improvement Dashboard", path: "/dashboard/learning/dashboard" },
    { name: "Learning Analytics", path: "/dashboard/learning/analytics" },
    { name: "Model Evaluation", path: "/dashboard/learning/evaluation" },
    { name: "Knowledge Evolution", path: "/dashboard/learning/evolution" },
  ];

  useEffect(() => {
    async function fetchEvaluation() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/learning/evaluation");
        setEvalData(res.data || null);
      } catch (err) {
        console.error("Failed to load model evaluation data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvaluation();
  }, []);

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Multi-Module Model Quality Evaluation
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Evaluates recommendation accuracy, RAG citation precision, Knowledge Graph precision, and multi-agent collaboration success rates.
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
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* EVALUATION METRICS GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mr-3" />
          <span>Computing Quality Evaluation Benchmark...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Recommendation Accuracy</span>
              <span className="text-3xl font-black text-emerald-400 block">{evalData?.recommendationAccuracy}%</span>
              <p className="text-xs text-slate-400">Engineer validation approval rating</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">RAG Answer Quality</span>
              <span className="text-3xl font-black text-violet-400 block">{evalData?.answerQuality}%</span>
              <p className="text-xs text-slate-400">Grounding & relevance score</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Citation Precision</span>
              <span className="text-3xl font-black text-sky-400 block">{evalData?.citationQuality}%</span>
              <p className="text-xs text-slate-400">Document vault source citation accuracy</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Knowledge Graph Quality</span>
              <span className="text-3xl font-black text-indigo-400 block">{evalData?.knowledgeGraphQuality}%</span>
              <p className="text-xs text-slate-400">Topology edge precision</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Multi-Agent Collaboration</span>
              <span className="text-3xl font-black text-purple-400 block">{evalData?.agentCollaborationQuality}%</span>
              <p className="text-xs text-slate-400">Agent agreement & RCA synthesis score</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Discovery Engine Precision</span>
              <span className="text-3xl font-black text-amber-400 block">{evalData?.discoveryQuality}%</span>
              <p className="text-xs text-slate-400">Failure pattern & risk detection precision</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
