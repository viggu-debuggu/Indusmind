"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Cpu,
  Search,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Link as LinkIcon,
  FileText,
  Activity,
  ChevronRight,
  Plus,
  X,
  Loader2,
  AlertTriangle
} from "lucide-react";

interface EquipmentItem {
  id: number;
  assetName: string;
  assetTag: string;
  plant: string;
  department: string;
  manufacturer?: string;
  model?: string;
  installationDate: string;
  status: string;
  runningHours: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  remainingUsefulLife: number;
  healthScore: number;
  riskScore: number;
  latestReading?: {
    temperature: number;
    pressure: number;
    vibration: number;
    rpm: number;
    voltage: number;
    current: number;
    oilLevel: number;
    humidity: number;
    runtimeHours: number;
    timestamp: string;
  };
}

export default function EquipmentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Registration modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    assetName: "",
    assetTag: "",
    plant: "",
    department: "",
    manufacturer: "",
    model: "",
    installationDate: new Date().toISOString().split("T")[0],
    status: "Operational",
    runningHours: 0
  });

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/equipment");
      setEquipmentList(res.data);
    } catch (err) {
      console.error("Failed to load assets", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "runningHours" ? parseFloat(value) || 0 : value
    }));
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      const payload = {
        ...formData,
        installationDate: new Date(formData.installationDate).toISOString()
      };
      await api.post("/api/equipment", payload);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        assetName: "",
        assetTag: "",
        plant: "",
        department: "",
        manufacturer: "",
        model: "",
        installationDate: new Date().toISOString().split("T")[0],
        status: "Operational",
        runningHours: 0
      });
      // Refresh list
      await fetchAssets();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Registration failed. Verify asset tag is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "operational") {
      return {
        badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        indicator: "bg-emerald-500"
      };
    }
    if (s === "maintenance") {
      return {
        badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        indicator: "bg-amber-500"
      };
    }
    return {
      badge: "text-red-400 bg-red-500/10 border-red-500/20",
      indicator: "bg-red-500"
    };
  };

  const filteredAssets = equipmentList.filter((asset) => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.plant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && asset.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white page-enter">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Asset Inventory Registry
          </h1>
          <p className="text-sm text-slate-400">
            Register and monitor industrial machinery, real-time telemetry, and connected operations manuals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4.5 h-4.5" /> Add Industrial Asset
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-xl">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search assets by tag, name, or plant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["all", "operational", "maintenance", "degraded"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                statusFilter === status
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ASSET GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-450">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-semibold">Loading equipment registers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => {
              const styles = getStatusStyle(asset.status);
              const temp = asset.latestReading ? `${asset.latestReading.temperature}°C` : "N/A";
              const pressure = asset.latestReading ? `${asset.latestReading.pressure} bar` : "N/A";
              const vibration = asset.latestReading ? `${asset.latestReading.vibration} mm/s` : "N/A";
              
              return (
                <div
                  key={asset.assetTag}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col group hover:border-slate-700/80 transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-800/60 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">
                        {asset.assetTag}
                      </span>
                      <h3 className="font-bold text-white text-base mt-2.5 group-hover:text-indigo-400 transition-colors">
                        {asset.assetName}
                      </h3>
                      <p className="text-xs text-slate-400 font-light mt-1">
                        {asset.plant}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${styles.badge}`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Health Gauge & Telemetry */}
                  <div className="p-5 grid grid-cols-3 gap-4 border-b border-slate-800/40 bg-slate-950/20">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Health</p>
                      <p className={`font-bold text-sm mt-1.5 ${
                        asset.healthScore > 80 ? "text-emerald-400" : asset.healthScore > 60 ? "text-amber-400" : "text-red-400"
                      }`}>{asset.healthScore}%</p>
                    </div>
                    <div className="text-center border-x border-slate-800/50">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Temp</p>
                      <p className="font-bold text-sm text-slate-200 mt-1.5">{temp}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Vibration</p>
                      <p className="font-bold text-sm text-slate-200 mt-1.5">{vibration}</p>
                    </div>
                  </div>

                  {/* Footer details / Navigation */}
                  <div className="p-4 flex items-center justify-between mt-auto bg-slate-900">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span>RUL: <strong className="text-slate-200">{asset.remainingUsefulLife.toLocaleString()} hrs</strong></span>
                    </span>
                    
                    <Link
                      href={`/dashboard/equipment/details/${asset.id}`}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 group/btn"
                    >
                      View Intelligence <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 text-slate-500 text-sm font-semibold">
              No industrial assets found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" /> Register Industrial Asset
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Asset Name</label>
                  <input
                    required
                    type="text"
                    name="assetName"
                    value={formData.assetName}
                    onChange={handleInputChange}
                    placeholder="e.g. Compressor Boiler"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Asset Tag (Unique)</label>
                  <input
                    required
                    type="text"
                    name="assetTag"
                    value={formData.assetTag}
                    onChange={handleInputChange}
                    placeholder="e.g. COMP-C300"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Plant Location</label>
                  <input
                    required
                    type="text"
                    name="plant"
                    value={formData.plant}
                    onChange={handleInputChange}
                    placeholder="e.g. Plant Section A"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Department</label>
                  <input
                    required
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Operations"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g. Siemens"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Model Code</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. SGT-800"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Installation Date</label>
                  <input
                    required
                    type="date"
                    name="installationDate"
                    value={formData.installationDate}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Initial Running Hours</label>
                  <input
                    type="number"
                    name="runningHours"
                    value={formData.runningHours}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1.5 w-full px-3 py-2 border rounded-lg text-sm bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Register Asset"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
