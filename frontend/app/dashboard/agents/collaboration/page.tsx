"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AgentHeader } from "@/components/AgentHeader";
import {
  GitMerge,
  Loader2,
  Cpu,
  ArrowRight,
  Zap,
  Clock,
  DollarSign,
  Briefcase
} from "lucide-react";

interface AgentCollaboration {
  uuid: string;
  session_uuid: string;
  collaboration_type: string;
  initiator: string;
  collaborators: string;
  outcome: string;
  downtime_saved_estimate: number;
  cost_saved_estimate: number;
  created_at: string;
}

export default function CollaborationHubPage() {
  const [collabs, setCollabs] = useState<AgentCollaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCollabs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/agents/collaboration");
      setCollabs(res.data || []);
    } catch (err) {
      console.error("Failed to load agent collaborations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollabs();
  }, []);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <AgentHeader />

      {/* GRAPHICS GRID */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl min-h-[400px] flex flex-col justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <GitMerge className="w-4 h-4 text-cyan-400" /> Multi-Agent Collaboration Matrices
        </h3>

        <div className="flex-1 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : collabs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collabs.map((col) => (
                <div key={col.uuid} className="p-5 rounded-2xl border border-slate-850 bg-slate-950/20 hover:border-slate-800 transition-colors flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                        {col.collaboration_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {col.session_uuid.slice(0, 8)}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white">Initiator: <span className="text-cyan-400">{col.initiator}</span></h4>
                    
                    {/* Visual flow maps representation */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      {col.collaborators.split(",").map((name, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <ArrowRight className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-350">
                            {name.trim()}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Outcome Summary</span>
                      <p className="text-xs text-slate-400 leading-relaxed font-light mt-0.5">{col.outcome}</p>
                    </div>
                  </div>

                  {/* Savings block */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-emerald-450">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Cost Saved</span>
                        <span className="font-bold text-white">${col.cost_saved_estimate.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-sky-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Downtime Saved</span>
                        <span className="font-bold text-white">{col.downtime_saved_estimate} Hours</span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              No collaborations logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
