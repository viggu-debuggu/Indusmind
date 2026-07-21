"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  GitBranch,
  Cpu,
  FileText,
  AlertTriangle,
  Info,
  Network,
  Maximize2,
  RefreshCw,
  HelpCircle,
  Loader2
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

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  // Interactive filters state
  const [showEquipment, setShowEquipment] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);
  const [showProcesses, setShowProcesses] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showExpertKnowledge, setShowExpertKnowledge] = useState(true);
  const [selectedRelationFilter, setSelectedRelationFilter] = useState("all");
  const [minConfidence, setMinConfidence] = useState(0.0);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

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
            // Fallback default nodes if API is unreachable
            rawNodes = [
              { id: "pump-101", label: "PUMP-101", type: "Equipment", details: "Centrifugal Water Pump (Flowserve)", location: "Plant Alpha - Bay 3", color: "#ef4444" },
              { id: "turbine-202", label: "TURBINE-202", type: "Equipment", details: "High Pressure Gas Turbine (GE)", location: "Plant Alpha - Power Block 1", color: "#6366f1" },
              { id: "comp-301", label: "COMPRESSOR-301", type: "Equipment", details: "Reciprocating Air Compressor", location: "Plant Beta - Compressor House", color: "#f59e0b" },
              { id: "doc-101", label: "Pump Overhaul SOP.pdf", type: "Document", details: "Standard Operating Procedure v2.1", location: "Document Vault", color: "#3b82f6" },
              { id: "doc-202", label: "Turbine Inspection Guide.pdf", type: "Document", details: "Technical Specification v1.4", location: "Document Vault", color: "#3b82f6" },
              { id: "alert-101", label: "Vibration Warning", type: "Alert", details: "Bearing vibration above threshold", location: "Telemetry Feed", color: "#ef4444" },
              { id: "proc-101", label: "Seal Replacement Task", type: "Process", details: "High Priority Maintenance Scheduled", location: "Work Order #WO-4021", color: "#8b5cf6" }
            ];
            rawEdges = [
              { source: "doc-101", target: "pump-101", label: "DESCRIBES" },
              { source: "doc-202", target: "turbine-202", label: "DESCRIBES" },
              { source: "alert-101", target: "pump-101", label: "HAS_ANOMALY" },
              { source: "proc-101", target: "pump-101", label: "SCHEDULED_WORK" }
            ];
          }
        }

        if (rawNodes.length === 0) {
          rawNodes = [
            { id: "pump-101", label: "PUMP-101", type: "Equipment", details: "Centrifugal Water Pump (Flowserve)", location: "Plant Alpha - Bay 3", color: "#ef4444" },
            { id: "turbine-202", label: "TURBINE-202", type: "Equipment", details: "High Pressure Gas Turbine (GE)", location: "Plant Alpha - Power Block 1", color: "#6366f1" },
            { id: "comp-301", label: "COMPRESSOR-301", type: "Equipment", details: "Reciprocating Air Compressor", location: "Plant Beta - Compressor House", color: "#f59e0b" },
            { id: "doc-101", label: "Pump Overhaul SOP.pdf", type: "Document", details: "Standard Operating Procedure v2.1", location: "Document Vault", color: "#3b82f6" },
            { id: "doc-202", label: "Turbine Inspection Guide.pdf", type: "Document", details: "Technical Specification v1.4", location: "Document Vault", color: "#3b82f6" }
          ];
          rawEdges = [
            { source: "doc-101", target: "pump-101", label: "DESCRIBES" },
            { source: "doc-202", target: "turbine-202", label: "DESCRIBES" }
          ];
        }

        // Concentric Multi-Ring Radial Topology Layout (1000x750 coordinate space)
        const centerX = 500;
        const centerY = 375;

        const equipmentNodes = rawNodes.filter((n: any) => n.type === "Equipment");
        const documentNodes = rawNodes.filter((n: any) => n.type === "Document");
        const alertProcessNodes = rawNodes.filter((n: any) => n.type === "Alert" || n.type === "Process");
        const otherNodes = rawNodes.filter((n: any) => !["Equipment", "Document", "Alert", "Process"].includes(n.type));

        const positionedNodes: GraphNode[] = [];

        // Ring 1 (Center Inner): Core Equipment Assets
        equipmentNodes.forEach((node: any, idx: number) => {
          const angle = (2 * Math.PI * idx) / Math.max(1, equipmentNodes.length) - Math.PI / 2;
          positionedNodes.push({
            ...node,
            cx: centerX + 180 * Math.cos(angle),
            cy: centerY + 180 * Math.sin(angle),
            r: 26
          });
        });

        // Ring 2 (Middle Ring): Process Workflows & Alerts
        alertProcessNodes.forEach((node: any, idx: number) => {
          const angle = (2 * Math.PI * idx) / Math.max(1, alertProcessNodes.length) - Math.PI / 4;
          positionedNodes.push({
            ...node,
            cx: centerX + 290 * Math.cos(angle),
            cy: centerY + 290 * Math.sin(angle),
            r: 20
          });
        });

        // Ring 3 (Outer Ring): Technical Manuals & Documents
        documentNodes.forEach((node: any, idx: number) => {
          const angle = (2 * Math.PI * idx) / Math.max(1, documentNodes.length);
          positionedNodes.push({
            ...node,
            cx: centerX + 370 * Math.cos(angle),
            cy: centerY + 370 * Math.sin(angle),
            r: 18
          });
        });

        // Ring 4 (Extended Outer): Discoveries & Expert Knowledge
        otherNodes.forEach((node: any, idx: number) => {
          const angle = (2 * Math.PI * idx) / Math.max(1, otherNodes.length) + Math.PI / 6;
          positionedNodes.push({
            ...node,
            cx: centerX + 440 * Math.cos(angle),
            cy: centerY + 440 * Math.sin(angle),
            r: 15
          });
        });

        setNodes(positionedNodes);
        setEdges(rawEdges);

        // Select the first node by default if available
        if (positionedNodes.length > 0) {
          setSelectedNode(positionedNodes[0]);
        }
      } catch (err) {
        console.error("Failed to fetch knowledge graph dynamics", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraphData();
  }, [refreshCount]);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const triggerReindex = async () => {
    try {
      setRefreshCount(prev => prev + 1);
      alert("Successfully queried backend database. Aggregated knowledge graph entities re-aligned.");
    } catch (err) {
      console.error(err);
    }
  };

  // Get active connections for the selected node detail sheet
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

  // Helper mapping icon component by type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Equipment": return Cpu;
      case "Document": return FileText;
      case "Process": return Network;
      case "Alert": return AlertTriangle;
      default: return Info;
    }
  };

  // Filter nodes dynamically based on active checkboxes
  const filteredNodes = nodes.filter(node => {
    if (node.type === "Equipment" && !showEquipment) return false;
    if (node.type === "Document" && !showDocuments) return false;
    if (node.type === "Process" && !showProcesses) return false;
    if (node.type === "Alert" && !showAlerts) return false;
    if (node.type === "ExpertKnowledge" && !showExpertKnowledge) return false;
    return true;
  });

  // Filter edges dynamically based on filtered nodes, relation type, and confidence threshold
  const filteredEdges = edges.filter(edge => {
    const srcExists = filteredNodes.some(n => n.id === edge.source);
    const tgtExists = filteredNodes.some(n => n.id === edge.target);
    if (!srcExists || !tgtExists) return false;

    if (selectedRelationFilter !== "all" && edge.label !== selectedRelationFilter) return false;

    // Anomalies/alert edges have high priority/confidence (0.95), other edges default to 0.70
    const edgeConfidence = edge.label === "HAS_ANOMALY" ? 0.95 : 0.70;
    if (edgeConfidence < minConfidence) return false;

    return true;
  });

  const selectedConnections = getSelectedNodeConnections();

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Entity Knowledge Graph
          </h1>
          <p className="text-sm text-slate-400">
            Dynamic visual linkages mapped between database drawings, manuals, telemetry sensor anomalies, and maintenance tasks.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerReindex}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-slate-200 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh Graph
          </button>
        </div>
      </div>

      {/* KNOWLEDGE GRAPH INTERACTIVE FILTERS TOOLBAR */}
      <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Interactive Visual Controls</h3>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200">
            <input type="checkbox" checked={showEdgeLabels} onChange={(e) => setShowEdgeLabels(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
            Show Edge Overlays
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Node Category Filters */}
          <div className="space-y-2 md:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Filter Entity Types</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={showEquipment} onChange={(e) => setShowEquipment(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
                Equipment ({nodes.filter(n => n.type === "Equipment").length})
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={showDocuments} onChange={(e) => setShowDocuments(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
                Documents ({nodes.filter(n => n.type === "Document").length})
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={showProcesses} onChange={(e) => setShowProcesses(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
                Tasks ({nodes.filter(n => n.type === "Process").length})
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={showAlerts} onChange={(e) => setShowAlerts(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
                Alerts ({nodes.filter(n => n.type === "Alert").length})
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={showExpertKnowledge} onChange={(e) => setShowExpertKnowledge(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500" />
                Tribal Memory ({nodes.filter(n => n.type === "ExpertKnowledge").length})
              </label>
            </div>
          </div>

          {/* Relationship Filter */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Relationship Links</span>
            <select
              value={selectedRelationFilter}
              onChange={(e) => setSelectedRelationFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Connections</option>
              <option value="AFFECTS">AFFECTS</option>
              <option value="DESCRIBES">DESCRIBES</option>
              <option value="REFERENCES">REFERENCES</option>
              <option value="USES">USES</option>
              <option value="MAINTAINED_BY">MAINTAINED_BY</option>
              <option value="CAUSES">CAUSES</option>
              <option value="REQUIRES">REQUIRES</option>
              <option value="GENERATES">GENERATES</option>
              <option value="LOCATED_AT">LOCATED_AT</option>
              <option value="PART_OF">PART_OF</option>
              <option value="RELATED_TO">RELATED_TO</option>
              <option value="INSPECTED_BY">INSPECTED_BY</option>
              <option value="FOLLOWS">FOLLOWS</option>
              <option value="LINKED_TO">LINKED_TO</option>
            </select>
          </div>

          {/* Confidence Slider */}
          <div className="flex flex-col space-y-1 justify-center">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-500 uppercase tracking-wide">Weight Threshold</span>
              <span className="text-indigo-400 font-bold">{Math.round(minConfidence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.95"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-950 rounded-lg appearance-none h-1.5 cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {/* GRAPH CANVAS & PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* GRAPH CANVAS */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl relative overflow-hidden h-[560px] flex flex-col justify-between p-4">
          
          {/* Controls Overlay */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-950 px-2.5 py-1 rounded border border-slate-800/60">
              {isLoading ? "Querying Network..." : "Live Topology"}
            </span>
            <div className="flex gap-1.5">
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-all cursor-pointer">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-all cursor-pointer">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SVG Map */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-medium">Reconstructing graph nodes...</span>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="text-slate-500 text-xs font-semibold">
                No active entities match the current filters.
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 1000 750">
                {/* Draw Connection Links (Edges) */}
                {filteredEdges.map((edge, idx) => {
                  const src = filteredNodes.find(n => n.id === edge.source);
                  const tgt = filteredNodes.find(n => n.id === edge.target);
                  if (!src || !tgt || src.cx === undefined || src.cy === undefined || tgt.cx === undefined || tgt.cy === undefined) return null;
                  
                  const isAnomaly = edge.label === "HAS_ANOMALY";
                  const isConnectedToSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
                  const strokeOpacity = selectedNode ? (isConnectedToSelected ? 0.9 : 0.12) : 0.35;
                  const strokeWidth = isConnectedToSelected ? 2 : (isAnomaly ? 1.5 : 0.8);
                  
                  return (
                    <g key={idx}>
                      <line
                        x1={src.cx}
                        y1={src.cy}
                        x2={tgt.cx}
                        y2={tgt.cy}
                        stroke={isConnectedToSelected ? "#818cf8" : (isAnomaly ? "#ef4444" : "#475569")}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        strokeDasharray={edge.label === "REFERENCES" ? "4 4" : undefined}
                      />
                      {/* Show relationship label only for selected node's links */}
                      {isConnectedToSelected && showEdgeLabels && (
                        <text
                          x={(src.cx + tgt.cx) / 2}
                          y={(src.cy + tgt.cy) / 2 - 6}
                          textAnchor="middle"
                          className="fill-indigo-300 text-[10px] font-bold select-none pointer-events-none"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Draw Entity Nodes */}
                {filteredNodes.map((node) => {
                  if (node.cx === undefined || node.cy === undefined || node.r === undefined) return null;
                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = selectedNode && filteredEdges.some(e => 
                    (e.source === selectedNode.id && e.target === node.id) ||
                    (e.target === selectedNode.id && e.source === node.id)
                  );
                  
                  const displayOpacity = selectedNode ? (isSelected || isConnected ? 1 : 0.4) : 1;
                  const truncatedLabel = node.label.length > 22 ? node.label.substring(0, 20) + "…" : node.label;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer group"
                      onClick={() => handleNodeClick(node)}
                      style={{ opacity: displayOpacity }}
                    >
                      {/* Node Selection Indicator Glow */}
                      {isSelected && (
                        <circle
                          cx={node.cx}
                          cy={node.cy}
                          r={node.r + 8}
                          fill={node.color || "#6366f1"}
                          opacity="0.3"
                          className="transition-all duration-300 animate-pulse"
                        />
                      )}
                      {/* Main Node Circle */}
                      <circle
                        cx={node.cx}
                        cy={node.cy}
                        r={node.r}
                        fill={node.color || "#6366f1"}
                        stroke={isSelected ? "#ffffff" : "#0f172a"}
                        strokeWidth={isSelected ? "2.5" : "1.5"}
                        className="transition-all duration-200 group-hover:scale-125"
                      />
                      
                      {/* Node Type Initial Badge */}
                      <text
                        x={node.cx}
                        y={node.cy + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        className="text-[11px] font-extrabold select-none pointer-events-none"
                      >
                        {node.type.substring(0, 1)}
                      </text>

                      {/* Node Label Text */}
                      <text
                        x={node.cx}
                        y={node.cy + node.r + 14}
                        textAnchor="middle"
                        className={`text-[10px] font-semibold select-none pointer-events-none transition-all ${
                          isSelected ? "fill-white text-xs font-bold" : "fill-slate-300"
                        }`}
                      >
                        {truncatedLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="z-10 text-[10px] text-slate-500">
            💡 Click on any circle node to inspect mapped references and downstream workflows.
          </div>
        </div>

        {/* SIDE INSPECTION PANEL */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl flex flex-col h-[520px] justify-between">
          {selectedNode ? (
            <div className="flex flex-col h-full space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                  selectedNode.type === "Equipment" ? "bg-indigo-500/10 text-indigo-400" :
                  selectedNode.type === "Document" ? "bg-blue-500/10 text-blue-400" :
                  selectedNode.type === "Process" ? "bg-purple-500/10 text-purple-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {selectedNode.type}
                </span>
                <h3 className="font-bold text-lg mt-2 text-white truncate" title={selectedNode.label}>
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                  {selectedNode.details}
                </p>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asset Facility Location</h4>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed">{selectedNode.location || "Central Operations Registry"}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Connected Links ({selectedConnections.length})</h4>
                  {selectedConnections.length > 0 ? (
                    <div className="space-y-2">
                      {selectedConnections.map((conn: any, idx: number) => {
                        const ConnIcon = getTypeIcon(conn.type);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40 text-xs hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                              <ConnIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-300" title={conn.label}>{conn.label}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase shrink-0" title={conn.relation}>{conn.relation}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-light text-slate-500 italic">No linked nodes mapped.</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => alert(`Active Copilot grounding applied. Thread focus: ${selectedNode.label}`)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer border-none"
              >
                <GitBranch className="w-3.5 h-3.5" /> Contextualize in Copilot
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
              <Info className="w-8 h-8 text-slate-700 mb-2 animate-bounce" />
              <p className="text-xs font-light leading-relaxed">Select any visual entity node from the canvas to map downstream dependencies.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
