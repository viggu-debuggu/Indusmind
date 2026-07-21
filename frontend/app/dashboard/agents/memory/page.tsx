"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AgentHeader } from "@/components/AgentHeader";
import {
  Brain,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react";

interface AgentMemory {
  uuid: string;
  agent_name: string;
  task_name: string;
  reasoning: string;
  evidence: string;
  confidence: number;
  status: string;
  created_at: string;
}

export default function AgentMemoryPage() {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const params = selectedAgent !== "all" ? { agent_name: selectedAgent } : {};
      const res = await api.get("/api/agents/memory", { params });
      setMemories(res.data || []);
    } catch (err) {
      console.error("Failed to load agent memory catalog logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [selectedAgent]);

  const agentsList = [
    "Maintenance Agent",
    "Compliance Agent",
    "Safety Agent",
    "Root Cause Analysis Agent",
    "Quality Agent",
    "Knowledge Graph Agent",
    "Document Intelligence Agent"
  ];

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <AgentHeader />

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2.5 p-4 rounded-xl border border-slate-805 bg-slate-900/40">
        <button
          onClick={() => setSelectedAgent("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            selectedAgent === "all"
              ? "bg-cyan-600 border-cyan-550 text-white"
              : "border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          All Memories
        </button>
        {agentsList.map((a) => (
          <button
            key={a}
            onClick={() => setSelectedAgent(a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedAgent === a
                ? "bg-cyan-600 border-cyan-550 text-white"
                : "border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* LIST GRID */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl min-h-[400px] flex flex-col justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-cyan-400 animate-pulse" /> Agent Learning Memory Catalog
        </h3>

        <div className="flex-1 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : memories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memories.map((m) => (
                <div key={m.uuid} className="p-5 rounded-xl border border-slate-850 bg-slate-950/30 flex flex-col justify-between space-y-3 hover:border-slate-800 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-xs text-slate-200 block">{m.task_name}</span>
                        <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">{m.agent_name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                        {m.confidence}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-450 leading-relaxed font-light">{m.reasoning}</p>
                  </div>

                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-850 flex justify-between items-center">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(m.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold text-slate-400">Grounding: {m.evidence}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              No learnings matching this agent's search filters found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
