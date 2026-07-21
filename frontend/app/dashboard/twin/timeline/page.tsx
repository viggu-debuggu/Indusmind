"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Compass,
  Loader2,
  Calendar
} from "lucide-react";

interface TimelineEvent {
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  severity?: string;
}

function KnowledgeTimelineContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedTag, setSelectedTag] = useState(searchParams.get("asset") || "PUMP-P102");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const subTabs = [
    { name: "Twin Dashboard", path: "/dashboard/twin" },
    { name: "Asset Twin Explorer", path: "/dashboard/twin/explorer" },
    { name: "Knowledge Timeline", path: "/dashboard/twin/timeline" },
    { name: "Twin Comparison", path: "/dashboard/twin/compare" },
    { name: "Twin Analytics", path: "/dashboard/twin/analytics" },
  ];

  const availableAssets = [
    { tag: "PUMP-P102", name: "High-Pressure Centrifugal Pump" },
    { tag: "TURBINE-T203", name: "Superheated Gas Turbine Unit 4" },
    { tag: "BOILER-B401", name: "Industrial Heat Exchange Boiler" },
    { tag: "COMP-C300", name: "Reciprocating Air Compressor Unit" },
    { tag: "SUBSTATION-E1", name: "Primary Electric Control Substation" },
  ];

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/twin/${selectedTag}/timeline`);
        setEvents(res.data || []);
      } catch (err) {
        console.error("Failed to load twin timeline", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTimeline();
  }, [selectedTag]);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "Incident": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "AI Recommendation": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Discovery Finding": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Expert Memory": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                Interactive Knowledge Timeline
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Chronological sequence combining commissioning, maintenance logs, telemetry anomalies, incidents, compliance audits, and expert cards.
              </p>
            </div>
          </div>
        </div>

        {/* ASSET SELECTOR */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Asset Twin:</span>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-sky-500/50"
          >
            {availableAssets.map((a) => (
              <option key={a.tag} value={a.tag}>
                {a.tag} — {a.name}
              </option>
            ))}
          </select>
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
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* TIMELINE VIEW CONTAINER */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mr-3" />
          <span>Ordering Chronological Events for {selectedTag}...</span>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-8">
            {events.map((ev, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-slate-950 group-hover:scale-125 transition-all" />

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-sky-500/30 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getEventBadgeColor(ev.event_type)}`}>
                        {ev.event_type}
                      </span>
                      <h4 className="text-sm font-bold text-white">{ev.title}</h4>
                    </div>

                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      {ev.timestamp.slice(0, 10)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeTimelinePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    }>
      <KnowledgeTimelineContent />
    </Suspense>
  );
}
