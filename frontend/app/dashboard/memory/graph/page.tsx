"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { MemoryHeader } from "@/components/MemoryHeader";
import {
  GitBranch,
  Cpu,
  FileText,
  Brain,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Info,
  Network
} from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  details?: string;
  location?: string;
  color?: string;
  cx?: number;
  cy?: number;
  r?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export default function MemoryGraphIntegrationPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    async function fetchGraphData() {
      try {
        setIsLoading(true);
        let rawNodes: any[] = [];
        let rawEdges: any[] = [];

        try {
          const res = await api.get("/api/graph");
          rawNodes = res.data.nodes || [];
          rawEdges = res.data.edges || [];
        } catch {
          try {
            const resAi = await api.get("/api/ai/graph");
            rawNodes = resAi.data.nodes || [];
            rawEdges = resAi.data.edges || [];
          } catch {
            rawNodes = [
              { id: "pump-101", label: "PUMP-101", type: "Equipment", details: "Centrifugal Water Pump", location: "Plant Alpha - Bay 3", color: "#6366f1" },
              { id: "exp-101", label: "Overhaul Guide", type: "ExpertKnowledge", details: "Mechanical Overhaul Experience", location: "Category: Mechanical", color: "#10b981" },
              { id: "doc-101", label: "Pump Manual", type: "Document", details: "Technical Manual v1.0", location: "Vault", color: "#3b82f6" }
            ];
            rawEdges = [
              { source: "exp-101", target: "pump-101", label: "EXPERIENCE" },
              { source: "doc-101", target: "pump-101", label: "REFERENCES" }
            ];
          }
        }

        if (rawNodes.length === 0) {
          rawNodes = [
            { id: "pump-101", label: "PUMP-101", type: "Equipment", details: "Centrifugal Water Pump", location: "Plant Alpha - Bay 3", color: "#6366f1" },
            { id: "exp-101", label: "Overhaul Guide", type: "ExpertKnowledge", details: "Mechanical Overhaul Experience", location: "Category: Mechanical", color: "#10b981" }
          ];
          rawEdges = [
            { source: "exp-101", target: "pump-101", label: "EXPERIENCE" }
          ];
        }

        // Filter nodes based on type (Only show Equipment and ExpertKnowledge or linked Docs)
        let filteredNodes = rawNodes.filter((node: any) => 
          node.type === "Equipment" || node.type === "ExpertKnowledge" || node.type === "Document"
        );

        // Apply category filter if specified
        if (categoryFilter !== "all") {
          filteredNodes = filteredNodes.filter((node: any) => {
            if (node.type === "ExpertKnowledge") {
              // Location stores Category: Mechanical etc.
              return node.location?.includes(categoryFilter);
            }
            return true; // Keep equipment and docs
          });
        }

        // Re-align remaining edges
        const nodeIds = new Set(filteredNodes.map((n: any) => n.id));
        const filteredEdges = rawEdges.filter((edge: any) => 
          nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );

        // Apply positioned circular coordinates
        const centerX = 160;
        const centerY = 130;
        const radius = filteredNodes.length > 5 ? 90 : 70;

        const positionedNodes = filteredNodes.map((node: any, idx: number) => {
          const angle = (2 * Math.PI * idx) / filteredNodes.length;
          const nodeRadius = node.type === "Equipment" ? 20 : node.type === "ExpertKnowledge" ? 15 : 12;
          return {
            ...node,
            cx: centerX + radius * Math.cos(angle),
            cy: centerY + radius * Math.sin(angle),
            r: nodeRadius
          };
        });

        setNodes(positionedNodes);
        setEdges(filteredEdges);

        // Select the first node
        if (positionedNodes.length > 0) {
          setSelectedNode(positionedNodes[0]);
        } else {
          setSelectedNode(null);
        }
      } catch (err) {
        console.error("Failed to fetch memory graph", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraphData();
  }, [categoryFilter, refreshCount]);

  const getSelectedNodeConnections = () => {
    if (!selectedNode) return [];
    
    const connections: any[] = [];
    edges.forEach(edge => {
      if (edge.source === selectedNode.id) {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode) {
          connections.push({
            label: targetNode.label,
            type: targetNode.type,
            relation: edge.label
          });
        }
      } else if (edge.target === selectedNode.id) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode) {
          connections.push({
            label: sourceNode.label,
            type: sourceNode.type,
            relation: edge.label
          });
        }
      }
    });
    return connections;
  };

  const selectedConnections = getSelectedNodeConnections();

  return (
    <div className="space-y-8 page-enter text-slate-100">
      <MemoryHeader />

      {/* FILTERS HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-950 border-slate-800 text-slate-300 focus:outline-none"
          >
            <option value="all">Show All Knowledge Links</option>
            <option value="Mechanical">Mechanical Memory</option>
            <option value="Electrical">Electrical Memory</option>
            <option value="Process">Process Memory</option>
            <option value="Safety">Safety Memory</option>
          </select>
        </div>

        <button
          onClick={() => setRefreshCount(prev => prev + 1)}
          disabled={isLoading}
          className="px-3 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-slate-200 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-align Graph
        </button>
      </div>

      {/* CANVAS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SVG Graph View */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl relative overflow-hidden h-[500px] flex flex-col justify-between p-4">
          <div className="flex justify-between items-center z-10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-850">
              Tribal Memory Mapping
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs">Processing semantic nodes...</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-slate-500 text-xs">
                No active memory links mapped for selected category.
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 320 260">
                {/* Connection lines */}
                {edges.map((edge, idx) => {
                  const src = nodes.find(n => n.id === edge.source);
                  const tgt = nodes.find(n => n.id === edge.target);
                  if (!src || !tgt || src.cx === undefined || src.cy === undefined || tgt.cx === undefined || tgt.cy === undefined) return null;
                  
                  return (
                    <g key={idx}>
                      <line
                        x1={src.cx}
                        y1={src.cy}
                        x2={tgt.cx}
                        y2={tgt.cy}
                        stroke={edge.label === "EXPERIENCE" ? "#10b981" : "#475569"}
                        strokeWidth="0.8"
                        strokeDasharray={edge.label === "REFERENCES" ? "2 2" : undefined}
                      />
                      <text
                        x={(src.cx + tgt.cx) / 2}
                        y={(src.cy + tgt.cy) / 2 - 3}
                        textAnchor="middle"
                        className="fill-slate-500 text-[5px] font-semibold"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  if (node.cx === undefined || node.cy === undefined || node.r === undefined) return null;
                  const isSelected = selectedNode?.id === node.id;
                  
                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={node.r}
                        fill={node.color || "#6366f1"}
                        className={`transition-all duration-300 ${
                          isSelected ? "stroke-white stroke-[1.5px]" : "stroke-slate-950 stroke-[0.8px] group-hover:stroke-slate-400"
                        }`}
                      />
                      
                      <text
                        x={node.cx}
                        y={node.cy + 1}
                        textAnchor="middle"
                        className="fill-white text-[5px] font-bold select-none pointer-events-none"
                      >
                        {node.label.length > 8 ? node.label.substring(0, 7) + ".." : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Graph Legend */}
          <div className="flex gap-4 text-[9px] font-bold text-slate-500 uppercase z-10 p-2 rounded bg-slate-950/40 border border-slate-850 self-start">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" /> Equipment</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Tribal Experience</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" /> Documents</div>
          </div>
        </div>

        {/* Selected Details Sheet */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col min-h-[400px]">
          {selectedNode ? (
            <div className="space-y-5 text-xs flex-1">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">{selectedNode.type}</span>
                <h4 className="text-sm font-bold text-white mt-1 leading-snug">{selectedNode.label}</h4>
              </div>

              <div className="space-y-3">
                {selectedNode.details && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Details</span>
                    <p className="text-slate-300 mt-1 font-light">{selectedNode.details}</p>
                  </div>
                )}

                {selectedNode.location && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Mapping Coordinates</span>
                    <p className="text-slate-350 mt-1 font-light">{selectedNode.location}</p>
                  </div>
                )}

                {/* Node connections */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-2">Network Connections</span>
                  
                  <div className="space-y-2">
                    {selectedConnections.length > 0 ? (
                      selectedConnections.map((conn, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-850">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[11px] text-slate-300">{conn.label}</span>
                            <span className="text-[9px] text-slate-500">{conn.type}</span>
                          </div>
                          <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider">{conn.relation}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic block">No active semantic links for this node.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 text-xs py-20">
              <GitBranch className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
              Select a node in the graph topology to trace its dependencies and connections.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
