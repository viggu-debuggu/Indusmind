"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Filter,
  User,
  Cpu,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

interface IncidentResponse {
  id: number;
  uuid: string;
  equipment_id: number;
  reported_by?: number;
  incident_name: string;
  severity: string;
  status: string;
  category: string;
  incident_date: string;
  cause: string;
  resolution: string;
  prevention: string;
  recommendations: string;
  created_at: string;
  equipment?: {
    id: number;
    asset_name: string;
    asset_tag: string;
  };
  reporter?: {
    id: number;
    full_name: string;
    email: string;
  };
}

interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentResponse | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Report Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    equipment_id: "",
    incident_name: "",
    severity: "Medium",
    status: "Open",
    category: "Mechanical",
    incident_date: new Date().toISOString().split("T")[0],
    cause: "",
    resolution: "",
    prevention: "",
    recommendations: ""
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (severityFilter !== "all") params.severity = severityFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;

      const [listRes, statsRes, eqRes] = await Promise.all([
        api.get("/api/incidents", { params }).catch(() => ({ data: [] })),
        api.get("/api/incidents/stats").catch(() => ({ data: null })),
        api.get("/api/equipment").catch(() => ({ data: [] }))
      ]);

      setIncidents(listRes.data || []);
      setStats(statsRes.data || null);
      setEquipmentList(eqRes.data || []);

      // Autoselect first incident if none selected
      if ((listRes.data || []).length > 0 && !selectedIncident) {
        setSelectedIncident(listRes.data[0]);
      }
    } catch (err) {
      console.error("Failed to load incident tracking data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, severityFilter, statusFilter, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipment_id || !formData.incident_name || !formData.cause || !formData.resolution || !formData.prevention || !formData.recommendations) {
      setFormError("All required fields must be completed.");
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await api.post("/api/incidents", {
        ...formData,
        equipment_id: parseInt(formData.equipment_id)
      });
      setIsModalOpen(false);
      // Reset form
      setFormData({
        equipment_id: "",
        incident_name: "",
        severity: "Medium",
        status: "Open",
        category: "Mechanical",
        incident_date: new Date().toISOString().split("T")[0],
        cause: "",
        resolution: "",
        prevention: "",
        recommendations: ""
      });
      setSelectedIncident(res.data);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || "Failed to submit incident report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this incident record permanently?")) return;
    try {
      await api.delete(`/api/incidents/${uuid}`);
      if (selectedIncident?.uuid === uuid) {
        setSelectedIncident(null);
      }
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to delete incident record.");
    }
  };

  const getSeverityBadge = (sev: string) => {
    const classes = {
      Critical: "bg-red-500/10 text-red-400 border-red-500/20",
      High: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Low: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }[sev] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>{sev}</span>;
  };

  const getStatusBadge = (stat: string) => {
    const classes = {
      Open: "bg-red-500/10 text-red-500 border-red-500/10",
      Investigating: "bg-amber-500/10 text-amber-500 border-amber-500/10",
      Resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/10",
      Closed: "bg-slate-500/10 text-slate-400 border-slate-500/10"
    }[stat] || "bg-slate-500/10 text-slate-400 border-slate-500/10";
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${classes}`}>{stat}</span>;
  };

  return (
    <div className="space-y-8 text-slate-100 page-enter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Incident Tracker & Lessons Learned
          </h1>
          <p className="text-sm text-slate-400">
            Audit logs of past failures, root cause analysis, prevention designs, and safety compliance records.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Report Failure Incident
        </button>
      </div>

      {/* STATS PANEL */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Incidents", value: stats.total, color: "text-blue-400", icon: FileText, bg: "bg-blue-500/10" },
            { label: "Critical Severity", value: stats.critical, color: "text-red-400", icon: ShieldAlert, bg: "bg-red-500/10" },
            { label: "Open Investigations", value: stats.open + stats.investigating, color: "text-amber-400", icon: Clock, bg: "bg-amber-500/10" },
            { label: "Resolved Lessons", value: stats.resolved + stats.closed, color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/10" }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
                  <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search incident name, root cause, resolution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Safety">Safety</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
            <option value="Process">Process</option>
            <option value="Environmental">Environmental</option>
          </select>
        </div>
      </div>

      {/* SPLIT LAYOUT: LIST + DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INCIDENTS TABLE LIST */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl flex flex-col min-h-[400px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Lessons Registry</h3>
          
          <div className="overflow-x-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : incidents.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 pb-3 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3">Incident Record</th>
                    <th className="pb-3">Asset Tag</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {incidents.map((inc) => (
                    <tr
                      key={inc.uuid}
                      onClick={() => setSelectedIncident(inc)}
                      className={`cursor-pointer hover:bg-slate-950/20 transition-colors ${selectedIncident?.uuid === inc.uuid ? "bg-indigo-500/5" : ""}`}
                    >
                      <td className="py-4 font-semibold text-slate-200">
                        <div>{inc.incident_name}</div>
                        <span className="text-[10px] text-slate-500 font-normal">{new Date(inc.incident_date).toLocaleDateString()} · {inc.category}</span>
                      </td>
                      <td className="py-4 text-slate-400 font-mono">{inc.equipment?.asset_tag || "N/A"}</td>
                      <td className="py-4">{getSeverityBadge(inc.severity)}</td>
                      <td className="py-4">{getStatusBadge(inc.status)}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(inc.uuid);
                          }}
                          className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                          title="Delete incident log"
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
                No incidents reported matching active filters.
              </div>
            )}
          </div>
        </div>

        {/* INCIDENT DETAILS SIDE SHEET */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl flex flex-col">
          {selectedIncident ? (
            <div className="space-y-6 flex-1 overflow-y-auto">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white leading-tight">{selectedIncident.incident_name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  {getSeverityBadge(selectedIncident.severity)}
                  {getStatusBadge(selectedIncident.status)}
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-slate-950/40 border border-slate-850">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Equipment Asset</span>
                    <span className="font-semibold text-slate-300 mt-0.5 block">{selectedIncident.equipment?.asset_name || "N/A"}</span>
                    <span className="text-[10px] font-mono text-slate-500">{selectedIncident.equipment?.asset_tag || ""}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Reported By</span>
                    <span className="font-semibold text-slate-300 mt-0.5 block flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {selectedIncident.reporter?.full_name || "System"}
                    </span>
                  </div>
                </div>

                {/* Report Data */}
                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Root Cause Analysis</h4>
                  <p className="text-slate-400 leading-relaxed font-light pl-5 border-l border-slate-800">{selectedIncident.cause}</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolution Action</h4>
                  <p className="text-slate-400 leading-relaxed font-light pl-5 border-l border-slate-800">{selectedIncident.resolution}</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-indigo-500" /> Prevention Strategy</h4>
                  <p className="text-slate-400 leading-relaxed font-light pl-5 border-l border-slate-800">{selectedIncident.prevention}</p>
                </div>

                <div>
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-sky-500" /> Recommendations</h4>
                  <p className="text-slate-400 leading-relaxed font-light pl-5 border-l border-slate-800">{selectedIncident.recommendations}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-20">
              <Activity className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
              Select an incident record to review lessons learned.
            </div>
          )}
        </div>
      </div>

      {/* REPORT FAILURE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-indigo-500" /> Report Failure Incident</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Equipment Asset <span className="text-red-500">*</span></label>
                  <select
                    value={formData.equipment_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    required
                  >
                    <option value="">Select Asset Tag</option>
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.assetTag} - {eq.assetName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Incident Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Incident Record Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Compressor valve wear out failure"
                    value={formData.incident_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, incident_name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none"
                    >
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Safety">Safety</option>
                      <option value="Process">Process</option>
                      <option value="Environmental">Environmental</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Root Cause Analysis <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Describe exactly what triggered the failure based on log reports..."
                    value={formData.cause}
                    onChange={(e) => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                    className="w-full px-3 py-2 h-20 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Resolution Action Taken <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Details of physical repairs, parts replacement, and calibration completed..."
                    value={formData.resolution}
                    onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full px-3 py-2 h-20 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Future Prevention Strategy <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Design updates, additional instrumentation, and software protection bounds..."
                    value={formData.prevention}
                    onChange={(e) => setFormData(prev => ({ ...prev, prevention: e.target.value }))}
                    className="w-full px-3 py-2 h-20 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Actionable Recommendations <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Inspection intervals, training updates, or check sheets adjustments..."
                    value={formData.recommendations}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full px-3 py-2 h-20 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white focus:outline-none resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
