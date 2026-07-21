"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  FileText,
  Download,
  PlusCircle,
  Calendar,
  Sparkles,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface ExecutiveReport {
  id: number;
  uuid: string;
  reportName: string;
  reportType: string;
  summary: string;
  kpiData: string;
  financialSummary: string;
  riskSummary: string;
  recommendationsSummary: string;
  createdAt: string;
}

export default function ExecutiveReportsPage() {
  const pathname = usePathname();
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const subTabs = [
    { name: "Executive Dashboard", path: "/dashboard/executive" },
    { name: "Plant Overview", path: "/dashboard/executive/plant" },
    { name: "Operational Intelligence", path: "/dashboard/executive/operational" },
    { name: "Risk Intelligence", path: "/dashboard/executive/risk" },
    { name: "Financial Impact", path: "/dashboard/executive/financial" },
    { name: "Executive Reports", path: "/dashboard/executive/reports" },
  ];

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/executive/reports");
      setReports(res.data || []);
    } catch (err) {
      console.error("Failed to load executive reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (type: string) => {
    try {
      setIsGenerating(true);
      await api.post(`/api/executive/reports/generate?report_type=${type}`);
      await fetchReports();
    } catch (err) {
      console.error("Failed to generate report", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Downloadable Executive Operations Reports
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Generates weekly and monthly executive report summaries containing operational, financial, and compliance briefs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleGenerateReport("Weekly")}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" /> Generate Weekly Brief
          </button>
          <button
            onClick={() => handleGenerateReport("Monthly")}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Generate Monthly Executive Report
          </button>
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

      {/* REPORTS LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
          <span>Fetching Executive Reports Archive...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reports.length > 0 ? (
            reports.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-amber-500/30 transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.reportType} Brief
                    </span>
                    <h3 className="text-base font-bold text-white">{item.reportName}</h3>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {item.createdAt.slice(0, 10)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block">Executive Summary</span>
                  <p className="text-slate-300 leading-relaxed">{item.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Financial Brief</span>
                    <p className="text-slate-300">{item.financialSummary}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <span className="font-semibold text-rose-400 uppercase tracking-wider block mb-1">Risk Assessment</span>
                    <p className="text-slate-300">{item.riskSummary}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <span className="font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Action Recommendations</span>
                    <p className="text-slate-300">{item.recommendationsSummary}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center border border-slate-800/80 bg-slate-900 rounded-2xl text-slate-500 text-xs font-semibold">
              No executive reports generated yet. Click "Generate" above to create a report.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
