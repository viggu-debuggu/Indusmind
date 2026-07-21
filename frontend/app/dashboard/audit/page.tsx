"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  ClipboardList,
  Search,
  Filter,
  User,
  Clock,
  Loader2,
  Database,
  ShieldCheck,
  Globe,
  Settings,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AuditLogResponse {
  id: number;
  uuid: string;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (actionFilter !== "all") params.action = actionFilter;
      if (resourceFilter !== "all") params.resource_type = resourceFilter;

      const res = await api.get("/api/audit/logs", { params });
      
      // Filter list locally for search matching user email or full name
      let filtered = res.data || [];
      if (search) {
        const term = search.toLowerCase();
        filtered = filtered.filter((log: AuditLogResponse) => 
          log.action.toLowerCase().includes(term) ||
          log.user?.full_name.toLowerCase().includes(term) ||
          log.user?.email.toLowerCase().includes(term) ||
          log.resource_type?.toLowerCase().includes(term)
        );
      }
      setLogs(filtered);
    } catch (err) {
      console.error("Failed to load audit logs trail", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter, resourceFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("DELETE")) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (action.includes("CREATE") || action.includes("UPLOAD") || action.includes("RESTORE")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (action.includes("UPDATE") || action.includes("ARCHIVE") || action.includes("APPROVE")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    return "bg-sky-500/10 text-sky-400 border-sky-500/20";
  };

  return (
    <div className="space-y-8 text-slate-100 page-enter">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Immutable System Audit Trail
        </h1>
        <p className="text-sm text-slate-400">
          Chronological record of user activities, document revisions, telemetry overrides, and authorization changes.
        </p>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search log action, actor email, resource details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="UPLOAD_DOCUMENT">UPLOAD_DOCUMENT</option>
            <option value="DELETE_DOCUMENT">DELETE_DOCUMENT</option>
            <option value="APPROVE_DOCUMENT">APPROVE_DOCUMENT</option>
            <option value="AI_QUERY">AI_QUERY</option>
            <option value="CREATE_INCIDENT">CREATE_INCIDENT</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">All Resources</option>
            <option value="User">User</option>
            <option value="Document">Document</option>
            <option value="Equipment">Equipment</option>
            <option value="ChatSession">ChatSession</option>
            <option value="Incident">Incident</option>
          </select>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : logs.length > 0 ? (
          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="relative pl-6 group">
                  {/* Timeline marker */}
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-850 border-2 border-indigo-500 group-hover:scale-110 transition-transform" />
                  
                  <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 hover:bg-slate-950/40 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.resource_type && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ""}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-slate-300 font-medium">
                        {log.user ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {log.user.full_name} <span className="text-[10px] text-slate-500">({log.user.email})</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">System Process</span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                        {log.ip_address && (
                          <span className="ml-2 flex items-center gap-0.5">
                            <Globe className="w-3 h-3" /> {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {log.details && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-white border border-slate-800 rounded flex items-center gap-1 hover:bg-slate-800 transition-colors"
                        >
                          Details {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded details panel */}
                  {isExpanded && log.details && (
                    <div className="mt-2 p-3 rounded-lg border border-slate-850 bg-slate-950 font-mono text-[10px] text-indigo-400 overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-xs">
            <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
            No audit logs captured yet. Try logging in or uploading documents.
          </div>
        )}
      </div>
    </div>
  );
}
