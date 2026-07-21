"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Cpu,
  History,
  GitMerge,
  BarChart3,
  Brain
} from "lucide-react";

export function AgentHeader() {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", path: "/dashboard/agents", icon: Cpu },
    { name: "Agent Activity", path: "/dashboard/agents/activity", icon: History },
    { name: "Collaboration Hub", path: "/dashboard/agents/collaboration", icon: GitMerge },
    { name: "Agent Analytics", path: "/dashboard/agents/analytics", icon: BarChart3 },
    { name: "Agent Memory", path: "/dashboard/agents/memory", icon: Brain }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          AI Agent Center <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
        </h1>
        <p className="text-sm text-slate-400">
          Orchestrate teams of specialized AI agents working collaboratively to analyze telemetry, safety permits, PESO regulations, and tribal heuristics.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/60 max-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
