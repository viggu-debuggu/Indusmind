"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  MessageSquareCode,
  Send,
  Cpu,
  FileText,
  User,
  Sparkles,
  RefreshCw,
  Plus,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  History,
  Trash2,
  Copy,
  Check
} from "lucide-react";

interface DocumentReference {
  id: number;
  uuid: string;
  document_name: string;
  original_filename: string;
  page?: number;
  category?: string;
}

interface CitationItem {
  source_document: string;
  page?: number;
  section?: string;
  snippet: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  confidence_score?: number;
  documents_used?: DocumentReference[];
  citations?: CitationItem[];
  related_equipment?: string[];
  participating_agents?: string[];
  reasoning_steps?: string[];
  timestamp?: string;
}

interface ChatSession {
  uuid: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export default function AICopilotPage() {
  const { currentUser } = useAuth();
  
  // Chat States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionUuid, setCurrentSessionUuid] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your Industrial AI Assistant. You can query any uploaded equipment manuals, P&ID layouts, compliance SOPs, or maintenance reports. What would you like to verify today?",
      confidence_score: 100,
      documents_used: [],
      citations: [],
      related_equipment: []
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("all");
  const [assets, setAssets] = useState<string[]>(["PUMP-P102", "TURBINE-T203", "BOILER-B401"]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWorkspace, setSelectedWorkspace] = useState("all");
  const [workspacesList, setWorkspacesList] = useState<any[]>([]);
  const [copiedTextIndex, setCopiedTextIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTextIndex(idx);
    setTimeout(() => setCopiedTextIndex(null), 2000);
  };

  // Suggested Prompts
  const suggestedPrompts = [
    { text: "What is the pressure limit for PUMP-P102?", asset: "PUMP-P102" },
    { text: "Draft a calibration checklist for BOILER-B401", asset: "BOILER-B401" },
    { text: "Check Turbine Unit-4 safety compliance specs", asset: "TURBINE-T203" }
  ];

  // Load Sessions History
  const fetchSessions = async () => {
    try {
      const res = await api.get("/api/ai/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load chat sessions", err);
    }
  };

  // Load Session Messages
  const fetchSessionDetails = async (uuid: string) => {
    setIsTyping(true);
    try {
      const res = await api.get(`/api/ai/sessions/${uuid}`);
      const data = res.data;
      setCurrentSessionUuid(uuid);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load session details", err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const fetchAssets = async () => {
      try {
        const res = await api.get("/api/ai/assets");
        if (res.data) setAssets(res.data);
      } catch (err) {
        console.error("Failed to load assets context tags", err);
      }
    };
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get("/api/workspaces");
        if (res.data) setWorkspacesList(res.data);
      } catch (err) {
        console.error("Failed to load workspaces for filter", err);
      }
    };
    fetchAssets();
    fetchWorkspaces();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleCreateNewChat = () => {
    setCurrentSessionUuid(null);
    setMessages([
      {
        role: "assistant",
        content: "Hello! I am your Industrial AI Assistant. You can query any uploaded equipment manuals, P&ID layouts, compliance SOPs, or maintenance reports. What would you like to verify today?",
        confidence_score: 100,
        documents_used: [],
        citations: [],
        related_equipment: []
      }
    ]);
  };

  const handleDeleteSession = async (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation thread?")) return;
    try {
      await api.delete(`/api/ai/sessions/${uuid}`);
      if (currentSessionUuid === uuid) {
        handleCreateNewChat();
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message immediately
    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Formulate payload matching RAGRequest schema
      const payload = {
        question: textToSend,
        session_uuid: currentSessionUuid || undefined,
        asset: selectedAsset !== "all" ? selectedAsset : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        workspace_uuid: selectedWorkspace !== "all" ? selectedWorkspace : undefined
      };

      const res = await api.post("/api/ai/ask", payload);
      const data = res.data;

      // Update session tracker
      if (!currentSessionUuid) {
        setCurrentSessionUuid(data.session_uuid);
        fetchSessions();
      }

      // Add assistant response
      const assistantMsg: Message = {
        role: "assistant",
        content: data.answer,
        confidence_score: data.confidence_score,
        documents_used: data.documents_used,
        citations: data.citations,
        related_equipment: data.related_equipment,
        participating_agents: data.participating_agents || [],
        reasoning_steps: data.reasoning_steps || []
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("RAG pipeline query failed", err);
      const errMsg = err.response?.data?.error?.message || "Failed to retrieve grounded AI answer. Please verify backend configurations.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${errMsg}`,
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const parseMarkdown = (text: string) => {
    // Standard inline replacements helper
    const inlineParse = (str: string) => {
      let formatted = str
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code class='bg-slate-950 text-indigo-400 px-1.5 py-0.5 rounded text-xs border border-slate-850 font-mono'>$1</code>");
      return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    // Split text by code blocks first
    const parts = text.split("```");
    const parsedElements: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      // Odd indices are code blocks
      if (index % 2 === 1) {
        // First line contains language specifier optionally
        const lines = part.split("\n");
        const headerLine = lines[0].trim();
        const codeContent = lines.slice(1).join("\n").trim();
        
        parsedElements.push(
          <div key={`code-${index}`} className="my-4 rounded-xl border border-slate-250 dark:border-slate-850 bg-slate-950 overflow-hidden shadow-sm">
            {headerLine && (
              <div className="bg-slate-900 px-4 py-1.5 text-[9px] font-bold text-slate-400 border-b border-slate-850 uppercase flex justify-between items-center">
                <span>{headerLine}</span>
              </div>
            )}
            <pre className="p-4 text-xs text-indigo-400 font-mono overflow-x-auto leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      } else {
        // Even indices are standard markdown text (may include headers, lists, blockquotes, tables)
        const lines = part.split("\n");
        let listItems: React.ReactNode[] = [];
        let insideList = false;
        let insideTable = false;
        let tableRows: string[][] = [];

        const flushList = () => {
          if (listItems.length > 0) {
            parsedElements.push(
              <ul key={`list-${parsedElements.length}`} className="list-disc list-inside space-y-1 mb-4 pl-4 text-xs font-light text-slate-350">
                {listItems}
              </ul>
            );
            listItems = [];
            insideList = false;
          }
        };

        const flushTable = () => {
          if (tableRows.length > 0) {
            const cleanRows = tableRows.filter(row => !row.every(cell => /^[:\s-]*$/.test(cell)));
            if (cleanRows.length > 0) {
              const headerRow = cleanRows[0];
              const dataRows = cleanRows.slice(1);
              parsedElements.push(
                <div key={`table-${parsedElements.length}`} className="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs bg-white dark:bg-slate-950">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold uppercase text-slate-450 tracking-wider">
                      <tr>
                        {headerRow.map((cell, idx) => (
                          <th key={idx} className="px-4 py-3 font-semibold border-r border-slate-100 dark:last:border-r-0 dark:border-slate-800">
                            {inlineParse(cell)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                      {dataRows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-3 border-r border-slate-100 dark:last:border-r-0 dark:border-slate-800 font-light max-w-xs break-words">
                              {inlineParse(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            tableRows = [];
            insideTable = false;
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i];
          const line = rawLine.trim();

          // Handle table row
          const isTableRow = line.includes("|") && (line.startsWith("|") || line.split("|").length >= 3);
          if (isTableRow) {
            flushList();
            insideTable = true;
            let cols = line.split("|").map(c => c.trim());
            if (line.startsWith("|")) cols = cols.slice(1);
            if (line.endsWith("|")) cols = cols.slice(0, -1);
            tableRows.push(cols);
            continue;
          } else if (insideTable) {
            flushTable();
          }

          // Handle Header
          if (line.startsWith("# ")) {
            flushList();
            parsedElements.push(
              <h1 key={`h1-${i}`} className="text-base font-bold text-white mt-4 mb-2">
                {inlineParse(line.slice(2))}
              </h1>
            );
          } else if (line.startsWith("## ")) {
            flushList();
            parsedElements.push(
              <h2 key={`h2-${i}`} className="text-sm font-bold text-white mt-3.5 mb-1.5">
                {inlineParse(line.slice(3))}
              </h2>
            );
          } else if (line.startsWith("### ")) {
            flushList();
            parsedElements.push(
              <h3 key={`h3-${i}`} className="text-xs font-bold text-white mt-3 mb-1">
                {inlineParse(line.slice(4))}
              </h3>
            );
          }
          // Handle blockquote
          else if (line.startsWith(">")) {
            flushList();
            const quoteContent = line.slice(1).trim();
            parsedElements.push(
              <blockquote key={`quote-${i}`} className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 bg-indigo-500/5 text-slate-350 italic rounded-r-lg">
                {inlineParse(quoteContent)}
              </blockquote>
            );
          }
          // Handle list items
          else if (line.startsWith("* ") || line.startsWith("- ")) {
            insideList = true;
            listItems.push(
              <li key={`li-${i}`} className="list-disc pl-1 leading-relaxed text-xs text-slate-300">
                {inlineParse(line.slice(2))}
              </li>
            );
          }
          // Handle empty lines
          else if (line === "") {
            flushList();
          }
          // Regular line
          else {
            flushList();
            parsedElements.push(
              <p key={`p-${i}`} className="mb-2 text-xs leading-relaxed text-slate-300 font-light">
                {inlineParse(rawLine)}
              </p>
            );
          }
        }
        flushList();
        flushTable();
      }
    });

    return <div className="space-y-1">{parsedElements}</div>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-140px)]">
      
      {/* SIDEBAR HISTORY DRAWER */}
      <div className="hidden lg:flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-4 space-y-4 overflow-hidden h-full">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-indigo-500" /> Threads History
          </span>
          <button
            onClick={handleCreateNewChat}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 text-indigo-500 hover:text-indigo-400 transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            title="Start new thread"
          >
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {sessions.length > 0 ? (
            sessions.map((s) => {
              const isSelected = currentSessionUuid === s.uuid;
              return (
                <div
                  key={s.uuid}
                  onClick={() => fetchSessionDetails(s.uuid)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 group flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400"
                      : "bg-slate-50/40 border-slate-100 hover:border-slate-200 dark:bg-slate-950/20 dark:border-slate-900/60 dark:hover:border-slate-800"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{s.title}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      {new Date(s.updated_at).toLocaleDateString()} • {s.message_count} messages
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.uuid, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-slate-400"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-light">
              No historic threads indexed.
            </div>
          )}
        </div>
      </div>

      {/* MAIN CHAT WORKSPACE */}
      <div className="lg:col-span-3 flex flex-col h-full space-y-6">
        
        {/* HEADER CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              AI Copilot Workspace <Sparkles className="w-5 h-5 text-indigo-500" />
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Query manuals, SOPs, and historical failure patterns via natural language processing.
            </p>
          </div>

          {/* Context Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Workspace:</span>
              <select
                value={selectedWorkspace}
                onChange={(e) => setSelectedWorkspace(e.target.value)}
                className="px-2 py-1.5 border rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 focus:outline-none"
              >
                <option value="all">Global Catalog</option>
                {workspacesList.map((ws) => (
                  <option key={ws.uuid} value={ws.uuid}>{ws.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Asset:</span>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="px-2 py-1.5 border rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 focus:outline-none"
              >
                <option value="all">All Assets</option>
                {assets.map((ast) => (
                  <option key={ast} value={ast}>{ast}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1.5 border rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="Manual">Manuals</option>
                <option value="SOP">SOPs</option>
                <option value="Drawing">Drawings</option>
              </select>
            </div>
          </div>
        </div>

        {/* CHAT BOX */}
        <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm flex flex-col overflow-hidden relative">
          
          {/* Chat Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={index} className={`flex gap-4 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow flex-shrink-0 ${
                    isUser ? "bg-slate-900 text-white dark:bg-slate-850" : "bg-indigo-600 text-white"
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div className="space-y-3">
                    {/* Message Bubble */}
                    <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                      isUser
                        ? "bg-slate-50 border-slate-150 dark:bg-slate-900 dark:border-slate-800"
                        : "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40 text-slate-850 dark:text-slate-200"
                    }`}>
                      <div className="font-light relative group/msg">
                        {parseMarkdown(msg.content)}
                        
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            className="absolute right-0 bottom-0 p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-700 transition-colors opacity-0 group-hover/msg:opacity-100"
                            title="Copy answer"
                          >
                            {copiedTextIndex === index ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Confidence Score Tag */}
                      {!isUser && msg.confidence_score !== undefined && (
                        <div className="flex items-center gap-1.5 mt-3 border-t border-slate-100 dark:border-slate-800/60 pt-2 text-[10px] text-slate-400 font-bold uppercase">
                          <span>Grounding Confidence:</span>
                          <span className={`px-2 py-0.5 rounded-full ${
                            msg.confidence_score > 75
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : msg.confidence_score > 50
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}>
                            {msg.confidence_score}%
                          </span>
                        </div>
                      )}

                      {/* Participating Agents & Reasoning Steps */}
                      {!isUser && msg.participating_agents && msg.participating_agents.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[11px] space-y-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Participating Agents:</span>
                            {msg.participating_agents.map((agent, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                                {agent}
                              </span>
                            ))}
                          </div>
                          {msg.reasoning_steps && msg.reasoning_steps.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Reasoning Steps:</span>
                              <div className="border-l border-slate-200 dark:border-slate-800 ml-1.5 space-y-1.5 pl-3">
                                {msg.reasoning_steps.map((step, idx) => (
                                  <p key={idx} className="text-[10px] text-slate-450 leading-relaxed font-light font-mono">• {step}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* RAG Context / Citations Cards Accordion */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block ml-1">
                          Source Citations ({msg.citations.length})
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {msg.citations.map((cite, idx) => (
                            <div
                              key={idx}
                              className="p-3 border rounded-xl bg-slate-900 border-slate-800 text-xs flex flex-col space-y-1.5 shadow-sm hover:border-slate-750 transition-all"
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="font-bold text-slate-300 truncate max-w-[150px] flex items-center gap-1" title={cite.source_document}>
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  {cite.source_document}
                                </span>
                                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                  Page {cite.page || "N/A"}
                                </span>
                              </div>
                              {cite.section && (
                                <span className="text-[10px] font-semibold text-slate-500 italic">
                                  Section: {cite.section}
                                </span>
                              )}
                              <p className="text-[11px] text-slate-400 font-light line-clamp-3 leading-normal">
                                "{cite.snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 max-w-md">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow flex-shrink-0">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl border bg-indigo-50/30 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/20 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED PROMPTS GRID */}
          {messages.length === 1 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/10">
              <p className="text-xs text-slate-400 font-semibold mb-2">Suggested queries:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt.text)}
                    className="p-3 text-left border rounded-xl bg-white dark:bg-slate-900 hover:border-indigo-500 text-xs font-light transition-all shadow-sm"
                  >
                    <span className="font-bold text-[9px] text-indigo-500 uppercase block mb-1">{prompt.asset}</span>
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-4 border-t border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask a question about engineering blueprints, sensor bounds, or calibration steps..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/10 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
