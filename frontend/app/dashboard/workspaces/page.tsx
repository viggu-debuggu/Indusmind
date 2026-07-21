"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Briefcase,
  Search,
  Plus,
  Trash2,
  FileText,
  Link2,
  Unlink,
  Loader2,
  X,
  PlusCircle,
  FolderOpen,
  Check,
  AlertTriangle
} from "lucide-react";

interface DocumentItem {
  id: number;
  documentName: string;
  originalFilename: string;
  fileExtension: string;
  category?: string;
  fileSize: number;
}

interface WorkspaceItem {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  documentCount: number;
  createdAt: string;
  documents?: DocumentItem[];
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection states
  const [selectedWs, setSelectedWs] = useState<WorkspaceItem | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch workspaces list
  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/workspaces");
      setWorkspaces(res.data);
      
      // If a workspace is currently selected, refresh its details
      if (selectedWs) {
        const detailsRes = await api.get(`/api/workspaces/${selectedWs.uuid}`);
        setSelectedWs(detailsRes.data);
      }
    } catch (err) {
      console.error("Failed to load workspaces", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all documents (for linking)
  const fetchDocuments = async () => {
    try {
      const res = await api.get("/api/documents?limit=100");
      setAllDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Failed to fetch documents catalog", err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchDocuments();
  }, []);

  const handleSelectWorkspace = async (ws: WorkspaceItem) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/workspaces/${ws.uuid}`);
      setSelectedWs(res.data);
    } catch (err) {
      console.error("Failed to fetch workspace details", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post("/api/workspaces", {
        name: newWsName,
        description: newWsDesc
      });
      setIsCreateModalOpen(false);
      setNewWsName("");
      setNewWsDesc("");
      await fetchWorkspaces();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || "Failed to create workspace. Verify the name is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async (uuid: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the workspace "${name}"? Existing documents will NOT be deleted, only unlinked.`)) {
      return;
    }

    try {
      await api.delete(`/api/workspaces/${uuid}`);
      if (selectedWs?.uuid === uuid) {
        setSelectedWs(null);
      }
      await fetchWorkspaces();
    } catch (err) {
      console.error("Failed to delete workspace", err);
    }
  };

  const handleLinkDocuments = async () => {
    if (!selectedWs || selectedDocIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/api/workspaces/${selectedWs.uuid}/documents`, {
        documentIds: selectedDocIds
      });
      setSelectedWs(res.data);
      setIsLinkModalOpen(false);
      setSelectedDocIds([]);
      await fetchWorkspaces();
    } catch (err) {
      console.error("Failed to link documents", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkDocument = async (docId: number, docName: string) => {
    if (!selectedWs) return;
    if (!confirm(`Unlink "${docName}" from workspace "${selectedWs.name}"?`)) return;

    try {
      const res = await api.delete(`/api/workspaces/${selectedWs.uuid}/documents/${docId}`);
      setSelectedWs(res.data);
      await fetchWorkspaces();
    } catch (err) {
      console.error("Failed to unlink document", err);
    }
  };

  const toggleDocSelection = (id: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Filter workspaces based on search query
  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter out documents already linked to selected workspace
  const linkableDocs = allDocuments.filter(
    (doc) => !selectedWs?.documents?.some((wsDoc) => wsDoc.id === doc.id)
  );

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Isolated Workspaces
          </h1>
          <p className="text-sm text-slate-400">
            Partition your documents and scope AI Copilot conversations to increase answer speed and relevance.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" /> Create Workspace
        </button>
      </div>

      {/* SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: WORKSPACES LIST & SEARCH */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-slate-900 border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[500px]">
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((ws) => {
                const isSelected = selectedWs?.uuid === ws.uuid;
                return (
                  <div
                    key={ws.uuid}
                    onClick={() => handleSelectWorkspace(ws)}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 group relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-950/20 border-indigo-900/60 text-indigo-400"
                        : "bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Briefcase className={`w-5 h-5 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-450 transition-colors">
                          {ws.name}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkspace(ws.uuid, ws.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-slate-500"
                        title="Delete workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 font-light line-clamp-2">
                      {ws.description || "No description provided."}
                    </p>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/40 text-[10px] text-slate-500 uppercase font-bold">
                      <span>Created: {new Date(ws.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/45">
                        <FileText className="w-3 h-3 text-indigo-500" /> {ws.documentCount} Files
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm font-semibold">
                No workspaces found.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WORKSPACE DOCUMENTS INSPECTION */}
        <div className="lg:col-span-2">
          {selectedWs ? (
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl flex flex-col h-[565px] justify-between">
              <div>
                <div className="border-b border-slate-800/60 pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-bold bg-indigo-500/10 text-indigo-450 px-2.5 py-1 rounded">
                      Workspace Detail Board
                    </span>
                    <h2 className="font-extrabold text-xl mt-2.5 text-white">
                      {selectedWs.name}
                    </h2>
                    <p className="text-xs text-slate-450 mt-1 font-light leading-relaxed">
                      {selectedWs.description || "No description specified for this workspace partition."}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-950 hover:bg-slate-850 text-indigo-400 border border-indigo-900/40 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" /> Link Documents
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Linked Documents ({selectedWs.documents?.length || 0})</h4>
                  
                  <div className="overflow-y-auto max-h-[330px] pr-1 space-y-2.5">
                    {selectedWs.documents && selectedWs.documents.length > 0 ? (
                      selectedWs.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/20 text-xs hover:border-slate-700 transition-all group"
                        >
                          <div className="flex items-center gap-3 truncate max-w-[75%]">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{doc.fileExtension}</span>
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-slate-200 truncate block" title={doc.documentName}>
                                {doc.documentName}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate" title={doc.originalFilename}>
                                {doc.originalFilename} • {formatBytes(doc.fileSize)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnlinkDocument(doc.id, doc.documentName)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                            title="Unlink from workspace"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 text-slate-500 text-xs font-semibold flex flex-col items-center gap-2 border border-dashed border-slate-800 rounded-xl">
                        <FolderOpen className="w-8 h-8 text-slate-700" />
                        <span>No files linked to this workspace. Click "Link Documents" to add files.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Workspace ID: <strong className="font-mono">{selectedWs.uuid}</strong></span>
                <span>UUID Scope Locked</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 border border-slate-800/60 rounded-2xl bg-slate-900/50 h-[565px]">
              <FolderOpen className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
              <p className="text-xs font-light leading-relaxed max-w-xs">
                Select an isolated workspace partition from the inventory log to view detail records, link manuals, and audit file nodes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE WORKSPACE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Create Workspace
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Workspace Name</label>
                <input
                  required
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Boiler-B401 Maintenance Shutdown"
                  className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Describe the scope of this project partition..."
                  rows={3}
                  className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Workspace"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK DOCUMENTS MODAL */}
      {isLinkModalOpen && selectedWs && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-500" /> Link Documents
              </h2>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 font-light">Select documents from the general catalog to lock them into the "{selectedWs.name}" workspace.</p>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-850 bg-slate-950/40 rounded-xl p-3">
                {linkableDocs.length > 0 ? (
                  linkableDocs.map((doc) => {
                    const isChecked = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => toggleDocSelection(doc.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-indigo-950/20 border-indigo-900/50 text-indigo-400"
                            : "bg-slate-900 border-slate-800 hover:bg-slate-850"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate max-w-[85%]">
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="truncate font-semibold text-slate-200" title={doc.documentName}>{doc.documentName}</span>
                          {doc.category && (
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 py-0.5 rounded uppercase border border-slate-800">{doc.category}</span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-700 bg-slate-950"
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-550 text-xs italic font-light">
                    No documents available to link. Go to Document Vault to upload more.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-850 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkDocuments}
                  disabled={isSubmitting || selectedDocIds.length === 0}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" /> Link {selectedDocIds.length} Files
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
