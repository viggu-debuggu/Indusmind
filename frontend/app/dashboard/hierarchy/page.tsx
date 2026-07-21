"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Network,
  Building2,
  Factory,
  Boxes,
  Cpu,
  FolderKanban,
  FileText,
  Loader2,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus
} from "lucide-react";

interface HierarchyNode {
  id: number;
  name: string;
  type: string;
  healthScore?: number;
  criticalAlertsCount?: number;
  children?: HierarchyNode[];
}

export default function HierarchyPage() {
  const [data, setData] = useState<HierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    async function loadHierarchy() {
      try {
        setIsLoading(true);
        // Request actual backend hierarchy
        const res = await api.get("/api/hierarchy/tree");
        setData(res.data);
        if (res.data.length > 0) {
          setSelectedOrg(res.data[0].name);
        }
      } catch (err) {
        console.error("Failed to load industrial hierarchy", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHierarchy();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-3 text-slate-450 selection:bg-indigo-500 selection:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-bold">Mapping enterprise hierarchy tree...</span>
      </div>
    );
  }

  // Fallback mocks if database is completely empty
  const hierarchyData = data.length > 0 ? data : [
    {
      id: 1,
      name: "ABC Chemicals",
      type: "Organization",
      children: [
        {
          id: 2,
          name: "Visakhapatnam Plant",
          type: "Plant",
          healthScore: 89,
          criticalAlertsCount: 1,
          children: [
            {
              id: 3,
              name: "Utilities Department",
              type: "Department",
              children: [
                {
                  id: 4,
                  name: "Shutdown 2026",
                  type: "Workspace",
                  children: [
                    { id: 5, name: "Pump P-101", type: "Equipment", healthScore: 95 },
                    { id: 6, name: "Boiler B-202", type: "Equipment", healthScore: 54 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  const currentOrgNode = hierarchyData.find((org) => org.name === selectedOrg) || hierarchyData[0];
  const plants = currentOrgNode?.children || [];
  const activePlantNode = plants.find((p) => p.name === selectedPlant) || plants[0];
  const departments = activePlantNode?.children || [];
  const activeDeptNode = departments.find((d) => d.name === selectedDept) || departments[0];
  const workspaces = activeDeptNode?.children || [];

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Network className="w-7 h-7 text-indigo-550" /> Enterprise Organization Tree
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse and coordinate assets, workspaces, and compliance across your corporate hierarchy.
          </p>
        </div>
      </div>

      {/* TOP GRID SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Organization Column */}
        <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900 shadow-2xl space-y-4">
          <label className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Organization (Industry)
          </label>
          <div className="space-y-2">
            {hierarchyData.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setSelectedOrg(org.name);
                  setSelectedPlant(null);
                  setSelectedDept(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold flex justify-between items-center ${
                  selectedOrg === org.name
                    ? "bg-indigo-650/10 border-indigo-500 text-indigo-400"
                    : "bg-slate-950/40 border-slate-850 text-slate-350 hover:bg-slate-900"
                }`}
              >
                <span>{org.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Plants Column */}
        <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900 shadow-2xl space-y-4">
          <label className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Factory className="w-4 h-4 text-teal-400" /> Plant Sites
          </label>
          <div className="space-y-2">
            {plants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => {
                  setSelectedPlant(plant.name);
                  setSelectedDept(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold flex justify-between items-center ${
                  (selectedPlant || plants[0]?.name) === plant.name
                    ? "bg-teal-650/10 border-teal-500 text-teal-400"
                    : "bg-slate-950/40 border-slate-850 text-slate-350 hover:bg-slate-900"
                }`}
              >
                <div>
                  <span className="block">{plant.name}</span>
                  {plant.healthScore !== undefined && (
                    <span className="text-[10px] text-slate-500 mt-1 block">Health Score: {plant.healthScore}%</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {plant.criticalAlertsCount ? (
                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold">
                      {plant.criticalAlertsCount} Alert
                    </span>
                  ) : null}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
            {plants.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-8">No plant locations registered.</p>
            )}
          </div>
        </div>

        {/* Departments Column */}
        <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900 shadow-2xl space-y-4">
          <label className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Boxes className="w-4 h-4 text-purple-400" /> Departments
          </label>
          <div className="space-y-2">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.name)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-semibold flex justify-between items-center ${
                  (selectedDept || departments[0]?.name) === dept.name
                    ? "bg-purple-650/10 border-purple-500 text-purple-400"
                    : "bg-slate-950/40 border-slate-850 text-slate-350 hover:bg-slate-900"
                }`}
              >
                <span>{dept.name}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
            {departments.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-8">No departments found.</p>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: WORKSPACES & INTERLINKED EQUIPMENT/DOCS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Workspaces Card */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" /> Active Projects / Workspaces
          </h3>
          <div className="space-y-4">
            {workspaces.map((ws) => (
              <div key={ws.id} className="p-4 border border-slate-850 bg-slate-950/40 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">{ws.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 block">Shutdown Workspace</span>
                  </div>
                  <Link
                    href={`/dashboard/workspaces`}
                    className="p-1 border border-slate-800 rounded hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-0.5"
                  >
                    Open Workspace
                  </Link>
                </div>

                <div className="border-t border-slate-900 pt-3 text-xs space-y-2">
                  <span className="text-slate-500 font-bold block">Assigned Equipment Twin Nodes:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ws.children?.map((eq) => (
                      <div key={eq.id} className="p-2 border border-slate-900 bg-slate-900/60 rounded-lg flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-200">{eq.name}</span>
                        {eq.healthScore !== undefined && (
                          <span className={`px-1.5 rounded font-black text-[9px] ${
                            eq.healthScore >= 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {eq.healthScore}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {workspaces.length === 0 && (
              <p className="text-slate-500 text-xs italic text-center py-12">No workspaces mapped for this node.</p>
            )}
          </div>
        </div>

        {/* Enterprise Operations Center summary */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" /> Operational Center Diagnostics
            </h3>
            <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-slate-850 bg-slate-950/40 rounded-xl space-y-1">
                <span className="text-slate-500 block">Critical Assets Risk Rate</span>
                <strong className="text-lg text-slate-200">14%</strong>
              </div>
              <div className="p-4 border border-slate-850 bg-slate-950/40 rounded-xl space-y-1">
                <span className="text-slate-550 block">Operational Efficiency</span>
                <strong className="text-lg text-emerald-400">92.4%</strong>
              </div>
            </div>
            <div className="p-4 border border-slate-800 bg-slate-950/60 rounded-xl mt-4 text-xs text-slate-400 leading-relaxed">
              Industrial assets are linked and tracked downstream through regional locations, utilities departments, and projects. Use the filters to align document coverage metrics.
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex justify-between text-xs text-slate-500">
            <span>Enterprise Hierarchy: 5 Mapped Nodes</span>
            <span>Refreshed: Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
