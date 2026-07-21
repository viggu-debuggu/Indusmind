"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Compass,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  FileQuestion,
  ShieldAlert,
  Zap,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Cpu,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  ArrowUpRight,
  Loader2
} from "lucide-react";

interface DiscoveryFinding {
  id: number;
  uuid: string;
  title: string;
  summary: string;
  businessImpact: string;
  confidenceScore: number;
  affectedAssets: string;
  evidence: string;
  priority: string;
  recommendedActions: string;
  expectedSavings: number;
  findingType: string;
  createdAt: string;
}

interface DiscoveryAnalytics {
  discoveryAccuracy: number;
  patternsIdentified: number;
  knowledgeGrowthPct: number;
  riskReductionPct: number;
  optimizationSavings: number;
  complianceImprovements: number;
  aiDiscoveryConfidence: number;
  confidenceTrend: number[];
}

export default function DiscoveryDashboardPage() {
  const pathname = usePathname();
  const [findings, setFindings] = useState<DiscoveryFinding[]>([]);
  const [analytics, setAnalytics] = useState<DiscoveryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");

  const subTabs = [
    { name: "Overview", path: "/dashboard/discovery" },
    { name: "Hidden Patterns", path: "/dashboard/discovery/patterns" },
    { name: "Knowledge Gaps", path: "/dashboard/discovery/gaps" },
    { name: "Risk Discovery", path: "/dashboard/discovery/risks" },
    { name: "Optimization Center", path: "/dashboard/discovery/optimization" },
    { name: "Discovery Analytics", path: "/dashboard/discovery/analytics" },
  ];

  const fetchDiscoveryData = async () => {
    try {
      setIsLoading(true);
      const [findingsRes, analyticsRes] = await Promise.all([
        api.get("/api/discovery/findings"),
        api.get("/api/discovery/analytics")
      ]);
      setFindings(findingsRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error("Failed to load discovery data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await api.post("/api/discovery/refresh");
      await fetchDiscoveryData();
    } catch (err) {
      console.error("Failed to refresh discovery engine", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered findings
  const filteredFindings = findings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.affectedAssets.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === "all" || item.findingType === selectedType;
    const matchesPriority = selectedPriority === "all" || item.priority === selectedPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Hidden Pattern": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Knowledge Gap": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Compliance Risk": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Optimization": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Emerging Risk": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-500 text-white font-semibold";
      case "High": return "bg-amber-500 text-slate-950 font-semibold";
      case "Medium": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      default: return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Industrial Intelligence Discovery
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Phase 11 Active
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Continuous automated discovery of failure loops, missing documentation, compliance vulnerabilities, and downtime optimizations.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Scanning Plant Engine..." : "Run On-Demand Discovery"}
        </button>
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

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hidden Patterns */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hidden Patterns</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              {analytics?.patternsIdentified || 0}
            </span>
            <span className="text-xs font-medium text-purple-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Multi-Incident Loops
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Correlated equipment clusters & seasonal failures</p>
        </div>

        {/* Card 2: Knowledge Completeness */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Knowledge Coverage</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              {analytics?.knowledgeGrowthPct || 0}%
            </span>
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
              Doc Health Index
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Missing manual & SOP completeness rating</p>
        </div>

        {/* Card 3: Compliance & Emerging Risks */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Risk Exposures</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              {analytics?.complianceImprovements || 0}
            </span>
            <span className="text-xs font-medium text-rose-400 flex items-center gap-1">
              {analytics?.riskReductionPct || 0}% Risk Reduction
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Telemetry wear spikes & regulatory clause audits</p>
        </div>

        {/* Card 4: Projected Savings */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Optimization Savings</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">
              ${(analytics?.optimizationSavings || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              Uptime Value
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Consolidated shutdowns & spares optimization</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search findings by asset or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Types</option>
              <option value="Hidden Pattern">Hidden Pattern</option>
              <option value="Knowledge Gap">Knowledge Gap</option>
              <option value="Compliance Risk">Compliance Risk</option>
              <option value="Optimization">Optimization</option>
              <option value="Emerging Risk">Emerging Risk</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* FINDINGS LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-3" />
          <span>Executing Industrial Discovery Scans...</span>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-white">No Discovered Insights Match Your Filters</h3>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your search queries or trigger an on-demand discovery scan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredFindings.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-indigo-500/30 transition-all space-y-4"
            >
              {/* CARD TOP ROW */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(item.findingType)}`}>
                    {item.findingType}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs ${getPriorityBadgeColor(item.priority)}`}>
                    {item.priority} Priority
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Confidence: <strong className="text-slate-200">{item.confidenceScore}%</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Assets: <strong className="text-white">{item.affectedAssets}</strong></span>
                </div>
              </div>

              {/* TITLE & SUMMARY */}
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{item.summary}</p>
              </div>

              {/* GRID DETAILS: IMPACT & EVIDENCE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="font-semibold text-red-400 uppercase tracking-wider block mb-1">Business Impact</span>
                  <p className="text-slate-300">{item.businessImpact}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Supporting Evidence</span>
                  <p className="text-slate-300">{item.evidence}</p>
                </div>
              </div>

              {/* RECOMMENDATION & EXPECTED SAVINGS */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Recommended Action Protocol
                  </span>
                  <p className="text-sm text-slate-200">{item.recommendedActions}</p>
                </div>

                {item.expectedSavings > 0 && (
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-slate-400 block">Expected Savings</span>
                    <span className="text-lg font-black text-emerald-400">${item.expectedSavings.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
