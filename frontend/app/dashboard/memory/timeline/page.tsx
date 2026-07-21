"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MemoryHeader } from "@/components/MemoryHeader";
import {
  Calendar,
  History,
  Cpu,
  UserCheck,
  AlertTriangle,
  Settings,
  FileText,
  Clock,
  Loader2,
  ShieldCheck,
  Info
} from "lucide-react";

interface TimelineEvent {
  date: string;
  type: "Installation" | "Expert Note" | "Incident" | "Inspection" | "Maintenance" | "Prediction";
  title: string;
  description: string;
  badge_color: string;
  meta?: string;
}

export default function AssetTimelinePage() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [selectedEqId, setSelectedEqId] = useState<string>("");
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEquipment = async () => {
    try {
      const res = await api.get("/api/equipment");
      const list = res.data || [];
      setEquipmentList(list);
      if (list.length > 0) {
        setSelectedEqId(list[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to load assets", err);
    }
  };

  const loadTimeline = async (id: string) => {
    try {
      setIsLoading(true);
      const eqIdInt = parseInt(id);
      
      // Query specific details and linked resources
      const [eqRes, incidentsRes, expertRes] = await Promise.all([
        api.get(`/api/equipment/${id}`),
        api.get("/api/incidents", { params: { equipment_id: eqIdInt } }).catch(() => ({ data: [] })),
        api.get("/api/expert-knowledge", { params: { equipment_id: eqIdInt } }).catch(() => ({ data: [] }))
      ]);

      const eq = eqRes.data;
      const incidents = incidentsRes.data || [];
      const experts = expertRes.data || [];

      const events: TimelineEvent[] = [];

      // 1. Installation event
      if (eq.installationDate) {
        events.push({
          date: eq.installationDate,
          type: "Installation",
          title: "Asset Installed & Commissioned",
          description: `Machinery model ${eq.model || "N/A"} manufactured by ${eq.manufacturer || "N/A"} installed at ${eq.plant} - ${eq.department}. Initial runtime hours: ${eq.runningHours} hrs.`,
          badge_color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        });
      }

      // 2. Incident events
      incidents.forEach((inc: any) => {
        events.push({
          date: inc.incident_date,
          type: "Incident",
          title: `Failure Incident: ${inc.incident_name}`,
          description: `Severity: ${inc.severity} | Root Cause: ${inc.cause} | Resolution: ${inc.resolution}`,
          badge_color: "bg-red-500/10 text-red-400 border-red-500/20",
          meta: `Reported by: ${inc.reporter?.full_name || "System"}`
        });
      });

      // 3. Expert Knowledge notes
      experts.forEach((ek: any) => {
        events.push({
          date: ek.created_at,
          type: "Expert Note",
          title: `Tribal Experience: ${ek.title}`,
          description: ek.description,
          badge_color: "bg-emerald-500/10 text-emerald-450 border-emerald-500/20",
          meta: `Captured from: ${ek.author} (${ek.author_role}) · Verification: ${ek.verification_status}`
        });
      });

      // 4. Maintenance / Inspections simulated from database texts if present
      if (eq.inspectionReports) {
        events.push({
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          type: "Inspection",
          title: "Ultrasonic Diagnostic Inspection",
          description: eq.inspectionReports,
          badge_color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        });
      }

      if (eq.openWorkOrders) {
        events.push({
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          type: "Maintenance",
          title: "Scheduled Calibration Work Order",
          description: eq.openWorkOrders,
          badge_color: "bg-amber-500/10 text-amber-400 border-amber-500/20"
        });
      }

      // Sort chronological descending
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimelineEvents(events);
    } catch (err) {
      console.error("Failed to compile asset timeline", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    if (selectedEqId) {
      loadTimeline(selectedEqId);
    }
  }, [selectedEqId]);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <MemoryHeader />

      {/* Selector Area */}
      <div className="p-5 rounded-2xl border border-slate-805 bg-slate-900 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" /> Select Industrial Asset
          </h3>
          <span className="text-[10px] text-slate-500">Query combined timeline of historical operational data and expert logs.</span>
        </div>

        <select
          value={selectedEqId}
          onChange={(e) => setSelectedEqId(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
        >
          {equipmentList.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.assetTag} - {eq.assetName}</option>
          ))}
        </select>
      </div>

      {/* Timeline view */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : timelineEvents.length > 0 ? (
          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {timelineEvents.map((evt, index) => (
              <div key={index} className="relative pl-6 group">
                {/* marker dot */}
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-950 border-2 border-indigo-500 group-hover:scale-110 transition-all" />

                <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 hover:bg-slate-950/40 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${evt.badge_color}`}>
                        {evt.type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-200">{evt.title}</h4>
                    </div>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(evt.date).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-light leading-relaxed whitespace-pre-wrap">{evt.description}</p>
                  
                  {evt.meta && (
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide pt-1 border-t border-slate-900">
                      {evt.meta}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-xs">
            <History className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
            No timeline logs found for the selected machinery asset.
          </div>
        )}
      </div>
    </div>
  );
}
