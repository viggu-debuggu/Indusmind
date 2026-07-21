"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  FileQuestion,
  AlertCircle,
  CheckCircle2,
  Cpu,
  FileText,
  Upload,
  BookOpen,
  PlusCircle,
  Loader2
} from "lucide-react";

interface KnowledgeGapRecord {
  id: number;
  uuid: string;
  equipmentId?: number;
  gapType: string;
  description: string;
  severity: string;
  completenessScore: number;
  recommendedAction: string;
  createdAt: string;
}

export default function KnowledgeGapsPage() {
  const pathname = usePathname();
  const [gaps, setGaps] = useState<KnowledgeGapRecord[]>([]);
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
    async function fetchGaps() {
      try {
        setIsLoading(true);
        const res = await api.get("/api/discovery/gaps");
        setGaps(res.data || []);
      } catch (err) {
        console.error("Failed to load knowledge gaps", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGaps();
  }, []);

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "High": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileQuestion className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Knowledge Gap Discovery
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Identifies equipment lacking SOPs, OEM engineering manuals, completed RCAs, or tribal knowledge memories.
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

      {/* KNOWLEDGE COMPLETENESS HEATMAP GRID */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Plant Documentation Health & Completeness Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Average Asset Coverage</span>
            <span className="text-3xl font-black text-amber-400 mt-2 block">78.4%</span>
            <span className="text-xs text-slate-500 mt-1 block">Target: 95.0%</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Equipment With No SOP</span>
            <span className="text-3xl font-black text-red-400 mt-2 block">2 Assets</span>
            <span className="text-xs text-slate-500 mt-1 block">Requires Action</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Missing RCA Documents</span>
            <span className="text-3xl font-black text-amber-400 mt-2 block">1 Incident</span>
            <span className="text-xs text-slate-500 mt-1 block">Pending RCA</span>
          </div>
        </div>
      </div>

      {/* GAPS LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
          <span>Auditing Document Vault & Asset Metadata...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {gaps.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-amber-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadgeColor(item.severity)}`}>
                    {item.severity} Severity
                  </span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                    {item.gapType}
                  </span>
                  <span className="text-xs text-slate-400">
                    Completeness: <strong className="text-amber-400 font-bold">{item.completenessScore}%</strong>
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-200">{item.description}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Action Plan: {item.recommendedAction}
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <Link
                  href="/dashboard/documents"
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Upload Document
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
