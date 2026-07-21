"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Compass,
  AlertTriangle,
  History as HistoryIcon,
  BarChart3,
  HelpCircle
} from "lucide-react";

export function DecisionHeader() {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", path: "/dashboard/decision", icon: Activity },
    { name: "Recommendations", path: "/dashboard/decision/recommendations", icon: Compass },
    { name: "Risk Center", path: "/dashboard/decision/risk", icon: AlertTriangle },
    { name: "History", path: "/dashboard/decision/history", icon: HistoryIcon },
    { name: "Analytics", path: "/dashboard/decision/analytics", icon: BarChart3 },
    { name: "Explainable AI", path: "/dashboard/decision/explainable", icon: HelpCircle }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          AI Decision Intelligence Engine <Activity className="w-6 h-6 text-purple-500 animate-pulse" />
        </h1>
        <p className="text-sm text-slate-400">
          Transform unstructured manual inputs, sensor streams, and historical incidents into explainable, proactive recommendations.
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
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
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
