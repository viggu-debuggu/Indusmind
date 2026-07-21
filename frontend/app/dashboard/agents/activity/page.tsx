"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AgentHeader } from "@/components/AgentHeader";
import {
  History,
  Loader2,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react";

interface AgentExecution {
  uuid: string;
  agents_used: string;
  reasoning_steps: string[];
  evidence: string;
  confidence: number;
  duration: number;
  created_at: string;
}

export default function AgentActivityPage() {
  const [activities, setActivities] = useState<AgentExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/agents/activity");
      setActivities(res.data || []);
    } catch (err) {
      console.error("Failed to load agent activities timeline", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <AgentHeader />

      {/* TIMELINE VIEW */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl min-h-[400px] flex flex-col justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <History className="w-4 h-4 text-cyan-400" /> Collaborative Agent Execution Activity Logs
        </h3>

        <div className="flex-1 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((act) => (
                <div key={act.uuid} className="p-5 rounded-xl border border-slate-850 bg-slate-950/30 space-y-4 hover:border-slate-800 transition-colors">
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Agents Involved</span>
                      {act.agents_used.split(",").map((name, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {name.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> {act.duration.toFixed(2)}s</span>
                      <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-yellow-450" /> {act.confidence.toFixed(1)}% Conf</span>
                    </div>
                  </div>

                  {/* Sequential Steps list */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Reasoning Trace Steps</span>
                    <div className="border-l border-slate-850 ml-2.5 space-y-3">
                      {act.reasoning_steps.map((step, idx) => (
                        <div key={idx} className="relative pl-5 group">
                          {/* marker dot */}
                          <div className="absolute -left-1 top-1 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 border-cyan-500" />
                          <p className="text-xs text-slate-350 leading-relaxed font-light">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supporting evidence */}
                  {act.evidence && (
                    <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Compiled Grounding Evidence</span>
                      <p className="text-xs text-slate-400 font-light leading-relaxed">{act.evidence}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-550 text-xs">
              No executions found in the Agent Activity timeline index.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
