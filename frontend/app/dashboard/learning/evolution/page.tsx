"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Sparkles,
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  Upload,
  BookOpen,
  Loader2
} from "lucide-react";

interface KnowledgeEvolution {
  id: number;
  uuid: string;
  documentId?: number;
  evolutionType: string;
  title: string;
  description: string;
  freshnessScore: number;
  recommendedUpdate: string;
  status: string;
  createdAt: string;
}

export default function KnowledgeEvolutionPage() {
  const pathname = usePathname();
  const [evolutions, setEvolutions] = useState<KnowledgeEvolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Feedback Center", path: "/dashboard/learning" },
    { name: "AI Improvement Dashboard", path: "/dashboard/learning/dashboard" },
    { name: "Learning Analytics", path: "/dashboard/learning/analytics" },
    { name: "Model Evaluation", path: "/dashboard/learning/evaluation" },
    { name: "Knowledge Evolution", path: "/dashboard/learning/evolution" },
  ];

  useEffect(() => {
    async function fetchEvolution() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/learning/evolution");
        setEvolutions(res.data || []);
      } catch (err) {
        console.error("Failed to load knowledge evolution records", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvolution();
  }, []);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Outdated SOP": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Outdated Manual": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Conflicting Knowledge": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Knowledge Evolution & Decay Tracking
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Detects outdated SOPs, aging engineering manuals, conflicting document thresholds, and knowledge decay across plant operations.
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

      {/* EVOLUTION LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
          <span>Auditing Document Vault Freshness & Knowledge Drift...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {evolutions.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-amber-500/30 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeColor(item.evolutionType)}`}>
                    {item.evolutionType}
                  </span>
                  <span className="text-xs text-slate-400">
                    Status: <strong className="text-white">{item.status}</strong>
                  </span>
                </div>

                <span className="text-xs text-slate-400">
                  Freshness Rating: <strong className="text-amber-400 font-bold">{item.freshnessScore}%</strong>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{item.description}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Recommended Evolution Protocol
                  </span>
                  <p className="text-sm text-slate-200">{item.recommendedUpdate}</p>
                </div>

                <Link
                  href="/dashboard/documents"
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Update Document Vault
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
