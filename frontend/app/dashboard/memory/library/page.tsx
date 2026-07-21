"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MemoryHeader } from "@/components/MemoryHeader";
import {
  Search,
  BookOpen,
  User,
  ShieldCheck,
  Cpu,
  FileText,
  AlertTriangle,
  Clock,
  Loader2,
  Trash2,
  ChevronRight,
  ClipboardList,
  Check,
  Copy,
  Info,
  Calendar
} from "lucide-react";

interface ExpertKnowledgeResponse {
  id: number;
  uuid: string;
  title: string;
  description: string;
  author: string;
  author_role: string;
  plant_id?: number;
  department_id?: number;
  equipment_id?: number;
  category: string;
  failure_mode?: string;
  root_cause?: string;
  maintenance_type?: string;
  safety_risk?: string;
  process_stage?: string;
  weather_condition?: string;
  confidence_score: number;
  ai_summary?: string;
  ai_keywords?: string;
  ai_entities?: string;
  verification_status: string;
  verified_by?: string;
  created_at: string;
  plant?: { id: number; name: string };
  department?: { id: number; name: string };
  equipment?: { id: number; asset_name: string; asset_tag: string; status: string };
}

export default function ExpertLibraryPage() {
  const [entries, setEntries] = useState<ExpertKnowledgeResponse[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ExpertKnowledgeResponse | null>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (statusFilter !== "all") params.verification_status = statusFilter;

      const res = await api.get("/api/expert-knowledge", { params });
      const data = res.data || [];
      setEntries(data);
      
      // Auto select first entry if list is populated
      if (data.length > 0 && !selectedEntry) {
        setSelectedEntry(data[0]);
      }
    } catch (err) {
      console.error("Failed to load expert library entries", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async (uuid: string) => {
    try {
      setIsRecsLoading(true);
      const res = await api.get(`/api/expert-knowledge/${uuid}/recommendations`);
      setRecommendations(res.data);
    } catch (err) {
      console.error("Failed to load AI recommendations", err);
      setRecommendations(null);
    } finally {
      setIsRecsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    if (selectedEntry) {
      loadRecommendations(selectedEntry.uuid);
    } else {
      setRecommendations(null);
    }
  }, [selectedEntry]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this expert knowledge card?")) return;
    try {
      await api.delete(`/api/expert-knowledge/${uuid}`);
      if (selectedEntry?.uuid === uuid) {
        setSelectedEntry(null);
      }
      await loadEntries();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Only administrators can delete knowledge cards.");
    }
  };

  const getSeverityBadge = (status: string) => {
    const classes = {
      Approved: "bg-emerald-500/10 text-emerald-450 border-emerald-500/20",
      Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Rejected: "bg-red-500/10 text-red-400 border-red-500/20"
    }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${classes}`}>{status}</span>;
  };

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <MemoryHeader />

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search keyword, symptoms, resolution, plant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-350 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
            <option value="Process">Process</option>
            <option value="Operational">Operational</option>
            <option value="Safety">Safety</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-350 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* SPLIT LAYOUT: GRID TABLE + DYNAMIC RECOMMENDATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARDS LIST TABLE */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col min-h-[450px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" /> Experiences Catalog
          </h3>

          <div className="overflow-x-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : entries.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 pb-3 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">Expert Card</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Equipment</th>
                    <th className="pb-3">Verification</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {entries.map((item) => (
                    <tr
                      key={item.uuid}
                      onClick={() => setSelectedEntry(item)}
                      className={`cursor-pointer hover:bg-slate-950/20 transition-colors ${
                        selectedEntry?.uuid === item.uuid ? "bg-indigo-500/5" : ""
                      }`}
                    >
                      <td className="py-4 font-semibold text-slate-200">
                        <div>{item.title}</div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          By: {item.author} ({item.author_role}) · {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 font-semibold">{item.category}</td>
                      <td className="py-4 text-slate-400 font-mono">{item.equipment?.asset_tag || "General"}</td>
                      <td className="py-4">{getSeverityBadge(item.verification_status)}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.uuid);
                          }}
                          className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                          title="Delete card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 text-slate-500">
                No tribal knowledge cards reported matching current filters.
              </div>
            )}
          </div>
        </div>

        {/* DETAILS & AI RECOMMENDATIONS ENGINE SIDE SHEET */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col min-h-[500px]">
          {selectedEntry ? (
            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              {/* Card Title Header */}
              <div className="border-b border-slate-800 pb-4 relative group/title">
                <h3 className="text-base font-bold text-white leading-snug">{selectedEntry.title}</h3>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  {getSeverityBadge(selectedEntry.verification_status)}
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Confidence: {selectedEntry.confidence_score}%
                  </span>
                </div>
                <button
                  onClick={() => handleCopyText(selectedEntry.description)}
                  className="absolute right-0 top-0 p-1 rounded bg-slate-950/40 text-slate-400 hover:text-white"
                  title="Copy full experience text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Core Description */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Expert Experience Observation
                  </h4>
                  <p className="text-slate-350 leading-relaxed font-light pl-4 border-l border-slate-800 whitespace-pre-wrap">
                    {selectedEntry.description}
                  </p>
                </div>

                {selectedEntry.root_cause && (
                  <div>
                    <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Diagnosed Root Cause
                    </h4>
                    <p className="text-slate-400 leading-relaxed font-light pl-4 border-l border-slate-800">{selectedEntry.root_cause}</p>
                  </div>
                )}

                {/* AI Cognitive Analytics Accordion */}
                <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    Cognitive AI Parsing
                  </h4>
                  {selectedEntry.ai_summary && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">AI Summary</span>
                      <p className="text-[11px] text-slate-300 font-light italic">"{selectedEntry.ai_summary}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                      <span className="font-bold text-slate-500 uppercase block">Semantic Tags</span>
                      <span className="text-slate-300 mt-0.5 block truncate" title={selectedEntry.ai_keywords}>
                        {selectedEntry.ai_keywords || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 uppercase block">Industrial Entities</span>
                      <span className="text-slate-300 mt-0.5 block truncate" title={selectedEntry.ai_entities}>
                        {selectedEntry.ai_entities || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations Loader / Result */}
                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-400" /> AI Grounding & Recommendations
                  </h4>

                  {isRecsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  ) : recommendations ? (
                    <div className="space-y-3">
                      {/* Suggested Actions */}
                      {recommendations.suggested_preventive_actions && recommendations.suggested_preventive_actions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Suggested Preventive Action</span>
                          <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-slate-200">
                            {recommendations.suggested_preventive_actions[0]}
                          </div>
                        </div>
                      )}

                      {/* Similar Experiences */}
                      {recommendations.similar_experiences && recommendations.similar_experiences.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Similar Experiences</span>
                          <div className="space-y-1">
                            {recommendations.similar_experiences.map((exp: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-850">
                                <span className="font-medium text-slate-300 truncate max-w-[170px]">{exp.title}</span>
                                <span className="font-mono text-indigo-400 text-[10px] font-bold">{exp.match_score}% Match</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Docs */}
                      {recommendations.related_documents && recommendations.related_documents.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Related Documents</span>
                          <div className="space-y-1">
                            {recommendations.related_documents.map((doc: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1 bg-slate-950/40 p-2 rounded border border-slate-850 text-slate-300 truncate">
                                <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                <span className="truncate">{doc.document_name} ({doc.category})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence */}
                      {recommendations.evidence_used && recommendations.evidence_used.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Confidence Grounding Evidence</span>
                          <div className="space-y-1 text-[10px] text-slate-500 italic pl-1 leading-relaxed">
                            {recommendations.evidence_used.map((ev: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-indigo-400">•</span>
                                <span>{ev}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 italic block">Failed to fetch RAG alignments.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 text-xs py-20">
              <BookOpen className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
              Select an experience card to view dynamic AI recommendations and document matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
