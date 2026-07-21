"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  Archive,
  RotateCcw,
  Edit2,
  X,
  FileCode,
  FileImage,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Save,
  Plus
} from "lucide-react";

interface DocumentItem {
  id: number;
  uuid: string;
  documentName: string;
  originalFilename: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  category?: string;
  department?: string;
  plantLocation?: string;
  description?: string;
  tags?: string;
  status: string;
  processingStatus: string;
  version: number;
  createdAt: string;

  updatedAt: string;
  uploadedBy?: number;
  uploader?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
}

export default function DocumentsPage() {
  const { currentUser } = useAuth();
  
  // Catalog listing states
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters, search, and sort
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [plant, setPlant] = useState("");
  const [fileType, setFileType] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // UI Panel controls
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Upload States
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Metadata fields for uploads
  const [metaDocName, setMetaDocName] = useState("");
  const [metaCategory, setMetaCategory] = useState("");
  const [metaDepartment, setMetaDepartment] = useState("");
  const [metaPlant, setMetaPlant] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaTags, setMetaTags] = useState("");

  // Editing values
  const [editDocName, setEditDocName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editPlant, setEditPlant] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // History tracking state
  const [docHistory, setDocHistory] = useState<DocumentItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch catalog
  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/documents", {
        params: {
          search: search || undefined,
          category: category || undefined,
          department: department || undefined,
          plantLocation: plant || undefined,
          fileType: fileType || undefined,
          status: status || undefined,
          sortBy: sortBy,
          page: page,
          limit: 10, // Default pagination limit 10 for compact grid view
        }
      });
      setDocuments(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err: any) {
      console.error("Failed to load document catalog records:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, category, department, plant, fileType, status, sortBy, page]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // 2. Fetch version history
  const fetchVersionHistory = async (docId: number) => {
    try {
      const res = await api.get(`/api/documents/${docId}/history`);
      setDocHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch version history logs:", err);
    }
  };

  // 3. Select details sheet
  const handleSelectDetails = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setDocHistory([]);
    setIsEditing(false);
    
    // Seed edit parameters
    setEditDocName(doc.documentName);
    setEditCategory(doc.category || "");
    setEditDepartment(doc.department || "");
    setEditPlant(doc.plantLocation || "");
    setEditDescription(doc.description || "");
    setEditTags(doc.tags || "");
    setEditStatus(doc.status);

    fetchVersionHistory(doc.id);
  };

  // 4. Update metadata
  const handleSaveMetadata = async () => {
    if (!selectedDoc) return;
    try {
      const res = await api.put(`/api/documents/${selectedDoc.id}`, {
        documentName: editDocName,
        category: editCategory || null,
        department: editDepartment || null,
        plantLocation: editPlant || null,
        description: editDescription || null,
        tags: editTags || null,
        status: editStatus
      });
      setSelectedDoc(res.data);
      setIsEditing(false);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update metadata.");
    }
  };

  // 5. Deletion, Archiving and Restoring
  const handleDelete = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document record? (Soft-deletion)")) return;
    try {
      await api.delete(`/api/documents/${docId}`);
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Delete operation failed.");
    }
  };

  const handleArchive = async (docId: number) => {
    try {
      await api.post("/api/documents/archive", { id: docId });
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Archive operation failed.");
    }
  };

  const handleRestore = async (docId: number) => {
    try {
      await api.post("/api/documents/restore", { id: docId });
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Restore operation failed.");
    }
  };

  // 6. Secure Document Preview
  const handleOpenPreview = async (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setIsPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewTextContent(null);

    try {
      // Retrieve binary data securely using token headers
      const res = await api.get(`/api/documents/download/${doc.id}`, {
        responseType: "blob"
      });
      
      const blob = new Blob([res.data], { type: doc.mimeType });
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);

      // Read raw text preview if txt/csv file
      if (doc.fileExtension.toLowerCase() === ".txt" || doc.fileExtension.toLowerCase() === ".csv") {
        const text = await blob.text();
        setPreviewTextContent(text.slice(0, 5000)); // Limit to first 5000 characters
      }
    } catch (err) {
      console.error("Failed to load document preview streams:", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewDoc(null);
    setPreviewUrl(null);
    setPreviewTextContent(null);
  };

  // 7. Secure download
  const handleDownload = async (doc: DocumentItem) => {
    try {
      const res = await api.get(`/api/documents/download/${doc.id}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.originalFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download document.");
    }
  };

  // 8. Upload files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      
      // Seed first filename as default document logical name
      if (selected.length === 1 && !metaDocName) {
        const base = selected[0].name.split(".")[0];
        setMetaDocName(base.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
      }
      setUploadFiles(selected);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      if (uploadFiles.length === 1) {
        // Single upload endpoint
        const formData = new FormData();
        formData.append("file", uploadFiles[0]);
        formData.append("document_name", metaDocName || uploadFiles[0].name.split(".")[0]);
        if (metaCategory) formData.append("category", metaCategory);
        if (metaDepartment) formData.append("department", metaDepartment);
        if (metaPlant) formData.append("plant_location", metaPlant);
        if (metaDescription) formData.append("description", metaDescription);
        if (metaTags) formData.append("tags", metaTags);

        await api.post("/api/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        // Multiple upload endpoint
        const formData = new FormData();
        uploadFiles.forEach((file) => {
          formData.append("files", file);
        });
        if (metaCategory) formData.append("category", metaCategory);
        if (metaDepartment) formData.append("department", metaDepartment);
        if (metaPlant) formData.append("plant_location", metaPlant);
        if (metaDescription) formData.append("description", metaDescription);
        if (metaTags) formData.append("tags", metaTags);

        await api.post("/api/documents/upload-multiple", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadFiles([]);
        setMetaDocName("");
        setMetaCategory("");
        setMetaDepartment("");
        setMetaPlant("");
        setMetaDescription("");
        setMetaTags("");
        setUploadProgress(0);
        setIsUploading(false);
        fetchCatalog();
      }, 500);

    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || err.response?.data?.detail || "Upload process failed.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === ".pdf") return <FileText className="w-5 h-5 text-red-500" />;
    if ([".png", ".jpg", ".jpeg", ".bmp", ".tiff"].includes(e)) return <FileImage className="w-5 h-5 text-emerald-500" />;
    if ([".csv", ".txt"].includes(e)) return <FileCode className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-indigo-500" />;
  };

  // RBAC checks
  const isAuthorizedToUpload = currentUser?.role !== "Viewer";
  const isAuthorizedToEdit = (doc: DocumentItem) => {
    const role = currentUser?.role;
    if (role && ["Super Admin", "Admin"].includes(role)) return true;
    if (role === "Engineer" && doc.uploadedBy === currentUser?.id) return true;
    return false;
  };
  const isAuthorizedToDelete = currentUser?.role ? ["Super Admin", "Admin"].includes(currentUser.role) : false;

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Industrial Document Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Securely index, version, search, and review industrial blueprints, CAD manuals, operations logs, and compliance logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCatalog}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAuthorizedToUpload && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors"
            >
              <Plus className="w-4 h-4" /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BLOCK */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search logical names, tags, files..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-xs font-medium bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="newest">Newest Uploads</option>
              <option value="oldest">Oldest Uploads</option>
              <option value="file_size">File Size</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="SOP">SOPs</option>
              <option value="Manual">Manuals</option>
              <option value="Drawing">Drawings</option>
              <option value="Compliance">Compliance</option>
              <option value="Report">Reports</option>
            </select>
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Safety">Safety</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>

          <div>
            <select
              value={plant}
              onChange={(e) => { setPlant(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="">All Plants</option>
              <option value="Plant A">Plant A</option>
              <option value="Plant B">Plant B</option>
              <option value="Turbine Hall">Turbine Hall</option>
              <option value="Substation 3">Substation 3</option>
            </select>
          </div>

          <div>
            <select
              value={fileType}
              onChange={(e) => { setFileType(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="">All File Types</option>
              <option value=".pdf">PDF Document</option>
              <option value=".png">PNG Image</option>
              <option value=".xlsx">Excel Sheet</option>
              <option value=".csv">CSV Spreadsheet</option>
              <option value=".txt">Text File</option>
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="">Active (No Deleted)</option>
              <option value="Uploaded">Uploaded</option>
              <option value="Archived">Archived</option>
              <option value="Deleted">Deleted (Suspended)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CATALOG DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 pb-3 text-slate-450 text-xs font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                <th className="p-4">Document Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Department / Plant</th>
                <th className="p-4">Uploader</th>
                <th className="p-4">Status</th>
                <th className="p-4">Version</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Reading document registers...</p>
                  </td>
                </tr>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => handleSelectDetails(doc)}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors cursor-pointer"
                  >
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-850">
                          {getFileIcon(doc.fileExtension)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{doc.documentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 select-all truncate">{doc.originalFilename}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-2 py-0.5 rounded-full">
                        {doc.category || "General"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-semibold">{doc.department || "All Ops"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-light">{doc.plantLocation || "Corporate"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-semibold">{doc.uploader?.fullName || "System"}</div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-400 font-mono mt-0.5">{doc.uploader?.role}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        doc.status === "Archived"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : doc.status === "Deleted"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono font-semibold">
                      v{doc.version}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(doc)}
                          title="Preview document"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-950"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download binary"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-950"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isAuthorizedToDelete && doc.status !== "Deleted" && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            title="Soft delete"
                            className="p-1.5 rounded-lg border border-red-500/10 text-slate-400 hover:text-red-500 hover:bg-red-500/5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-400 text-xs font-light">
                    No indexed documents found matching target filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-500">
          <span>Showing page {page} of {pages} ({total} total assets)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => (documents.length > 0 && page < pages ? p + 1 : p))}
              disabled={page >= pages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MULTIPLE UPLOAD MODAL (DRAG & DROP) */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-lg text-white">Index Corporate Asset</h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 flex-1">
              
              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              {/* Drag Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 p-6 rounded-xl text-center cursor-pointer hover:bg-slate-950 transition-all space-y-2"
              >
                <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                <div className="text-xs font-bold text-white">Click or drag files here to index</div>
                <div className="text-[10px] text-slate-400">PDF, Word, Excel, Images, Text, ZIP (Max 200MB)</div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Selection Summary */}
              {uploadFiles.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-xs space-y-1 max-h-32 overflow-y-auto">
                  <div className="font-semibold text-indigo-400 mb-1">Files Selected ({uploadFiles.length}):</div>
                  {uploadFiles.map((f, idx) => (
                    <div key={idx} className="flex justify-between text-slate-400">
                      <span className="truncate max-w-[300px]">{f.name}</span>
                      <span>{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata Fields (Apply to batch upload) */}
              <div className="space-y-3">
                {uploadFiles.length === 1 && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Document Logical Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Pump Calibration Manual"
                      value={metaDocName}
                      onChange={(e) => setMetaDocName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={metaCategory}
                      onChange={(e) => setMetaCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="SOP">SOPs</option>
                      <option value="Manual">Manuals</option>
                      <option value="Drawing">Drawings</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Report">Reports</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select
                      value={metaDepartment}
                      onChange={(e) => setMetaDepartment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none"
                    >
                      <option value="">Select Department</option>
                      <option value="Operations">Operations</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Safety">Safety</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Plant Location</label>
                    <select
                      value={metaPlant}
                      onChange={(e) => setMetaPlant(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none"
                    >
                      <option value="">Select Plant</option>
                      <option value="Plant A">Plant A</option>
                      <option value="Plant B">Plant B</option>
                      <option value="Turbine Hall">Turbine Hall</option>
                      <option value="Substation 3">Substation 3</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Enter document context description..."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="tag1, tag2, calibration"
                    value={metaTags}
                    onChange={(e) => setMetaTags(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Uploading metadata...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Upload Controls */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 border border-slate-850 rounded-lg text-xs font-semibold hover:bg-slate-850 text-slate-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload and Index"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILS SLIDE-OUT PANEL */}
      {selectedDoc && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-40 shadow-2xl flex flex-col animate-slide-in">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
            <h3 className="font-extrabold text-base">Document Specifications</h3>
            <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* Action Buttons Header */}
            <div className="flex gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleOpenPreview(selectedDoc)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              {isAuthorizedToEdit(selectedDoc) && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-400 hover:text-indigo-500"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Editing Panel vs View Details */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Document Logical Name</label>
                  <input
                    type="text"
                    value={editDocName}
                    onChange={(e) => setEditDocName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="SOP">SOPs</option>
                      <option value="Manual">Manuals</option>
                      <option value="Drawing">Drawings</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Report">Reports</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white focus:outline-none"
                    >
                      <option value="Uploaded">Uploaded</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Plant Location</label>
                    <input
                      type="text"
                      value={editPlant}
                      onChange={(e) => setEditPlant(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-950"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMetadata}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                
                {/* Meta details list */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Description</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed font-light">
                      {selectedDoc.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Uploader</span>
                      <div className="mt-1 font-semibold">{selectedDoc.uploader?.fullName || "System"}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">{selectedDoc.uploader?.email}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Upload Date</span>
                      <div className="mt-1 font-light text-slate-350">{new Date(selectedDoc.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Original Filename</span>
                      <div className="mt-1 font-mono break-all text-slate-350">{selectedDoc.originalFilename}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">File Size</span>
                      <div className="mt-1 font-light text-slate-350">{formatBytes(selectedDoc.fileSize)}</div>
                    </div>
                  </div>

                  {selectedDoc.tags && (
                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Tags</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedDoc.tags.split(",").map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-[10px] text-slate-500 font-semibold">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Administrative options */}
                {currentUser?.role && ["Super Admin", "Admin"].includes(currentUser.role) && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Administrative Controls</span>
                    <div className="flex gap-2">
                      {selectedDoc.status !== "Archived" && (
                        <button
                          onClick={() => handleArchive(selectedDoc.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500 hover:text-white text-amber-500 rounded text-[11px] font-semibold transition-all"
                        >
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </button>
                      )}
                      {(selectedDoc.status === "Archived" || selectedDoc.status === "Deleted") && (
                        <button
                          onClick={() => handleRestore(selectedDoc.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white text-emerald-500 rounded text-[11px] font-semibold transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* VERSION HISTORY */}
                <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Version History</span>
                  {docHistory.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {docHistory.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            // If user clicks a version in history, we load its detail view
                            setSelectedDoc(v);
                            setIsEditing(false);
                          }}
                          className={`p-2 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 flex justify-between items-center transition-all ${
                            v.id === selectedDoc.id
                              ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
                              : "border-slate-200 dark:border-slate-850"
                          }`}
                        >
                          <div>
                            <div className="font-bold">Version {v.version} {v.id === selectedDoc.id && "(Active)"}</div>
                            <div className="text-[9px] text-slate-450 dark:text-slate-400 font-mono mt-0.5 select-all">{v.originalFilename}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(v);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-850"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-450 font-light italic">Loading version history logs...</div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col animate-fade-in">
          
          {/* Header controls */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
            <div>
              <h3 className="font-extrabold text-base">{previewDoc.documentName}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{previewDoc.originalFilename} ({formatBytes(previewDoc.fileSize)})</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleClosePreview} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sandbox Preview Container */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
            
            {isPreviewLoading && (
              <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Streaming file from secure storage node...</p>
                </div>
              </div>
            )}

            {previewUrl && (
              <>
                {/* PDF PREVIEWER */}
                {previewDoc.fileExtension.toLowerCase() === ".pdf" && (
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    className="w-full h-full max-w-5xl bg-white border border-slate-800 rounded-lg shadow-2xl"
                    title="PDF Secure Sandbox"
                  />
                )}

                {/* IMAGE PREVIEWER */}
                {[".png", ".jpg", ".jpeg", ".bmp", ".tiff"].includes(previewDoc.fileExtension.toLowerCase()) && (
                  <img
                    src={previewUrl}
                    alt={previewDoc.documentName}
                    className="max-w-full max-h-full rounded-lg border border-slate-800 object-contain shadow-2xl"
                  />
                )}

                {/* TEXT / CSV PREVIEWER */}
                {[".txt", ".csv"].includes(previewDoc.fileExtension.toLowerCase()) && (
                  <div className="w-full h-full max-w-4xl bg-slate-900 border border-slate-800 rounded-lg p-6 overflow-auto text-xs font-mono text-slate-300 shadow-2xl">
                    <pre className="whitespace-pre-wrap">{previewTextContent || "Empty file content."}</pre>
                  </div>
                )}

                {/* OTHER FILE PLACEHOLDER */}
                {!["pdf", "png", "jpg", "jpeg", "bmp", "tiff", "txt", "csv"].includes(previewDoc.fileExtension.toLowerCase().replace(".", "")) && (
                  <div className="text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm shadow-2xl">
                    <FileText className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                    <h4 className="font-extrabold text-base mb-1 text-white">{previewDoc.fileExtension.toUpperCase()} File Indexed</h4>
                    <p className="text-xs text-slate-400 mb-4 font-light leading-relaxed">
                      Detailed telemetry preview is only active for PDFs, Images, and text-encoded logs. Download the binary payload to run native offline viewers.
                    </p>
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download Binary Payload
                    </button>
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
