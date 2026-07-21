"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  FileText,
  Cpu,
  MapPin,
  Calendar,
  ArrowUpRight,
  Loader2,
  FolderOpen,
  Download,
  AlertCircle
} from "lucide-react";

interface DocumentReference {
  id: number;
  uuid: string;
  document_name: string;
  original_filename: string;
  page?: number;
  category?: string;
}

interface SearchResultChunk {
  chunk_id: string;
  text: string;
  page?: number;
  score: number;
  document: DocumentReference;
  section?: string;
  equipment_mentioned: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [assetFilter, setAssetFilter] = useState("all");
  const [assets, setAssets] = useState<string[]>(["PUMP-P102", "TURBINE-T203", "BOILER-B401"]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.get("/api/ai/assets");
        if (res.data) setAssets(res.data);
      } catch (err) {
        console.error("Failed to load assets context tags", err);
      }
    };
    fetchAssets();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Build payload matching SemanticSearchRequest
      const payload = {
        query: query,
        asset: assetFilter !== "all" ? assetFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        plant_location: locationFilter.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 10
      };

      const res = await api.post("/api/ai/search", payload);
      setResults(res.data.results || []);
    } catch (err: any) {
      console.error("Semantic search failed", err);
      setErrorMsg(err.response?.data?.error?.message || "Search failed. Check vector database configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (docId: number, originalFilename: string) => {
    try {
      // Trigger file download stream
      const response = await api.get(`/api/documents/download/${docId}`, {
        responseType: 'blob'
      });
      const contentType = response.headers['content-type'] ? String(response.headers['content-type']) : undefined;
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert("Failed to stream download document payload from storage provider.");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Semantic Search Engine
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search document indexes conceptually using deep learning model embeddings.
        </p>
      </div>

      {/* SEARCH BOX & FORM */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Enter a concept, warning, specification, or checklist question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showFilters
                ? "bg-slate-950 border-slate-950 text-white dark:bg-white dark:border-white dark:text-slate-950"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow shadow-indigo-600/10 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/60 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asset Tag</label>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
              >
                <option value="all">All Assets</option>
                {assets.map((ast) => (
                  <option key={ast} value={ast}>{ast}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Doc Class</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="Manual">Manual</option>
                <option value="SOP">SOP</option>
                <option value="Drawing">Drawing</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Plant Location</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Bldg 2"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-8 p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Index Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ERROR MESSAGE CONTAINER */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* RESULTS LISTINGS */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Performing semantic comparison across vector matrix indexes...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Matched Indexes ({results.length})</h3>
            
            {results.map((res, index) => (
              <div
                key={index}
                className="p-5 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4"
              >
                {/* Result header */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {res.document.category || "General"}
                    </span>
                    <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 mt-2">
                      {res.document.document_name}
                    </h4>
                  </div>
                  
                  {/* Score badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">Score:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      res.score > 75
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : res.score > 50
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {res.score}%
                    </span>
                  </div>
                </div>

                {/* Match snippet text */}
                <p className="text-sm text-slate-650 dark:text-slate-400 font-light leading-relaxed whitespace-pre-line italic">
                  "... {res.text} ..."
                </p>

                {/* Tags and operations */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase">
                    <span>Page: <span className="text-slate-700 dark:text-slate-300 font-bold">{res.page || "N/A"}</span></span>
                    {res.section && (
                      <span>Section: <span className="text-slate-700 dark:text-slate-300 font-bold">{res.section}</span></span>
                    )}
                    {res.equipment_mentioned.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        Mentions: {res.equipment_mentioned.map((eq) => (
                          <span key={eq} className="text-indigo-500 bg-indigo-500/10 px-1 py-0.5 rounded ml-1 font-bold">{eq}</span>
                        ))}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(res.document.id, res.document.original_filename)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-950 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-all uppercase tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" /> Open Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="text-center py-20 text-slate-400 text-xs font-light">
            No matching semantic elements indexed under those queries.
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 text-xs font-light flex flex-col items-center justify-center">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-800 mb-3" />
            <p>Ready for vector grounding query comparisons.</p>
          </div>
        )}
      </div>
    </div>
  );
}
