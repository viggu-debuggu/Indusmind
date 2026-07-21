"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  BookOpen,
  Plus,
  History,
  BarChart3,
  GitBranch
} from "lucide-react";

export function MemoryHeader() {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", path: "/dashboard/memory", icon: Brain },
    { name: "Expert Library", path: "/dashboard/memory/library", icon: BookOpen },
    { name: "Add Experience", path: "/dashboard/memory/add", icon: Plus },
    { name: "Asset Timeline", path: "/dashboard/memory/timeline", icon: History },
    { name: "Analytics", path: "/dashboard/memory/analytics", icon: BarChart3 },
    { name: "Knowledge Graph", path: "/dashboard/memory/graph", icon: GitBranch }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Industrial Memory AI <Brain className="w-6 h-6 text-indigo-500 animate-pulse" />
        </h1>
        <p className="text-sm text-slate-400">
          Transform expert operator experiences into dynamic, searchable, and verified organizational tribal intelligence.
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
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
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
