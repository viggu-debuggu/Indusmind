"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Cpu,
  ArrowLeft,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  Clock,
  Plus,
  Loader2,
  TrendingUp,
  FileText,
  FileCode,
  AlertOctagon,
  QrCode,
  Hammer,
  RotateCcw,
  Sparkles,
  ExternalLink,
  BookOpen,
  ChevronRight
} from "lucide-react";

interface SensorReading {
  id: number;
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
}

interface MaintenancePrediction {
  id: number;
  predictedFailure: string;
  failureProbability: number;
  remainingUsefulLife: number;
  maintenancePriority: string;
  suggestedMaintenanceDate: string;
  confidenceScore: number;
  timestamp: string;
}

interface EquipmentDetail {
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
  latestReading?: SensorReading;
  predictionsHistory: MaintenancePrediction[];
}

interface RCACitation {
  source_document: string;
  page: number;
  section?: string;
}

interface RCAResponse {
  possible_cause: string;
  confidence: number;
  evidence: string;
  similar_failures: string;
  recommended_actions: string;
  citations: RCACitation[];
}

interface GapAnalysis {
  checklist: Record<string, boolean>;
  missing_documents: string[];
  recommendations: string[];
}

export default function EquipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asset, setAsset] = useState<EquipmentDetail | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // New States
  const [showQR, setShowQR] = useState(false);
  const [rcaResult, setRcaResult] = useState<RCAResponse | null>(null);
  const [isRunningRCA, setIsRunningRCA] = useState(false);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [decisionRec, setDecisionRec] = useState<any>(null);

  // Telemetry Input State
  const [telemetry, setTelemetry] = useState({
    temperature: 45.0,
    pressure: 3.0,
    vibration: 1.2,
    rpm: 1500.0,
    voltage: 415.0,
    current: 20.0,
    oilLevel: 80.0,
    humidity: 50.0,
    runtimeHours: 1200.0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [healthRes, historyRes, gapRes, recsRes] = await Promise.all([
        api.get(`/api/equipment/${id}/health`),
        api.get(`/api/equipment/${id}/history`),
        api.get(`/api/equipment/${id}/gap-analysis`).catch(() => ({ data: null })),
        api.get(`/api/decision-recommendations`, { params: { equipment_id: id, status: "Pending" } }).catch(() => ({ data: [] }))
      ]);
      setAsset(healthRes.data);
      setHistory(historyRes.data);
      if (gapRes) setGapAnalysis(gapRes.data);
      if (recsRes && recsRes.data.length > 0) {
        setDecisionRec(recsRes.data[0]);
      } else {
        setDecisionRec(null);
      }
      
      if (healthRes.data.latestReading) {
        const latest = healthRes.data.latestReading;
        setTelemetry({
          temperature: latest.temperature,
          pressure: latest.pressure,
          vibration: latest.vibration,
          rpm: latest.rpm,
          voltage: latest.voltage,
          current: latest.current,
          oilLevel: latest.oilLevel,
          humidity: latest.humidity,
          runtimeHours: latest.runtimeHours + 6.0
        });
      } else {
        setTelemetry((prev) => ({
          ...prev,
          runtimeHours: healthRes.data.runningHours + 6.0
        }));
      }
    } catch (err) {
      console.error("Failed to load machinery details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTelemetry((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmitTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      await api.post(`/api/equipment/${id}/sensor-data`, telemetry);
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to submit telemetry reading.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunRCA = async () => {
    setIsRunningRCA(true);
    setRcaResult(null);
    try {
      const res = await api.post(`/api/equipment/${id}/rca`);
      setRcaResult(res.data);
    } catch (err: any) {
      console.error("RCA agent run failed", err);
    } finally {
      setIsRunningRCA(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "critical") return "text-red-400 bg-red-500/10 border-red-500/20";
    if (p === "high") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (p === "medium") return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === "operational") return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    if (s === "maintenance") return <Wrench className="w-5 h-5 text-amber-400" />;
    return <AlertTriangle className="w-5 h-5 text-red-400" />;
  };

  const renderTrendsChart = () => {
    if (history.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-semibold">
          Insufficient telemetry data to map trend history.
        </div>
      );
    }

    const maxTemp = Math.max(...history.map(h => h.temperature)) * 1.1;
    const minTemp = Math.min(...history.map(h => h.temperature)) * 0.9;
    const maxVib = Math.max(...history.map(h => h.vibration)) * 1.2;
    const minVib = Math.min(...history.map(h => h.vibration)) * 0.8;

    const width = 500;
    const height = 150;
    const padding = 20;

    const getX = (index: number) => padding + (index / (history.length - 1)) * (width - 2 * padding);
    const getY = (val: number, min: number, max: number) => 
      height - padding - ((val - min) / (max - min)) * (height - 2 * padding);

    const tempPoints = history.map((h, i) => `${getX(i)},${getY(h.temperature, minTemp, maxTemp)}`).join(" ");
    const vibPoints = history.map((h, i) => `${getX(i)},${getY(h.vibration, minVib, maxVib)}`).join(" ");

    return (
      <div className="space-y-4">
        <div className="flex gap-4 text-xs font-bold justify-end">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 inline-block"></span> Temperature (°C)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 inline-block"></span> Vibration (mm/s)</span>
        </div>
        <div className="relative border border-slate-800/80 rounded-xl bg-slate-950 p-2 overflow-hidden shadow-2xl">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.5" />
            <polyline fill="none" stroke="#6366f1" strokeWidth="2" points={tempPoints} strokeLinecap="round" strokeLinejoin="round" />
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={vibPoints} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  };

  if (isLoading && !asset) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-3 text-slate-450 selection:bg-indigo-500 selection:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-bold">Querying asset diagnostic logs...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-24 text-slate-500 text-sm font-semibold selection:bg-indigo-500 selection:text-white">
        Machinery asset registry could not be found. <br />
        <Link href="/dashboard/equipment" className="text-indigo-400 hover:underline mt-4 inline-block flex items-center gap-1 justify-center"><ArrowLeft className="w-4 h-4" /> Back to registry</Link>
      </div>
    );
  }

  const latestPred = asset.predictionsHistory[0];

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white relative">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/equipment"
            className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white">{asset.assetName}</span>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {asset.assetTag}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {asset.plant} • {asset.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* QR Code Trigger */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 border border-slate-850 bg-slate-900 rounded-xl hover:bg-slate-800 text-indigo-450 hover:text-indigo-405 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <QrCode className="w-4 h-4" /> Asset QR
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 rounded-xl bg-slate-950/40">
            {getStatusIcon(asset.status)}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{asset.status}</span>
          </div>
        </div>
      </div>

      {/* QR Code Popover */}
      {showQR && (
        <div className="absolute top-20 right-4 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-2xl z-50 text-center space-y-3 w-64">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Scan QR Code</h4>
          <p className="text-[10px] text-slate-500">Field operator link to digital twin profile</p>
          <div className="bg-white p-2 rounded-xl inline-block">
            <img
              src={`${api.defaults.baseURL || ""}/api/equipment/${asset.id}/qr`}
              alt="Asset QR Link"
              width={160}
              height={160}
              className="mx-auto"
            />
          </div>
          <button
            onClick={() => setShowQR(false)}
            className="w-full text-center py-1 text-[11px] border border-slate-800 rounded hover:bg-slate-900 text-slate-400"
          >
            Close
          </button>
        </div>
      )}

      {/* DIGITAL TWIN KEY STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500">Health Score</span>
          <div className="text-3xl font-black text-indigo-400 mt-1">{asset.healthScore.toFixed(0)}%</div>
          <p className="text-[10px] text-slate-400 mt-1">AI Diagnostic Confidence</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500">Risk Score</span>
          <div className="text-3xl font-black text-red-400 mt-1">{asset.riskScore.toFixed(0)}%</div>
          <p className="text-[10px] text-slate-400 mt-1">Anomalous Deviation Rate</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500">Remaining Useful Life (RUL)</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">{asset.remainingUsefulLife.toLocaleString()} hrs</div>
          <p className="text-[10px] text-slate-400 mt-1">Expected Operation Life</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-850 bg-slate-900 shadow-xl text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Run Time</span>
          <div className="text-3xl font-black text-indigo-400 mt-1">{asset.runningHours.toLocaleString()} hrs</div>
          <p className="text-[10px] text-slate-400 mt-1">Odometer Hours</p>
        </div>
      </div>

      {/* EQUIPMENT TIMELINE */}
      <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 mb-6">
          Equipment Lifecycle Timeline
        </h3>
        <div className="flex flex-col md:flex-row justify-between items-center relative gap-6 md:gap-2">
          {/* Connection line */}
          <div className="absolute left-1/2 md:left-0 md:top-1/2 md:-translate-y-1/2 w-0.5 h-full md:w-full md:h-0.5 bg-slate-800/80 -z-10" />
          
          <div className="flex flex-col items-center bg-slate-900 p-2 rounded-xl text-center w-32 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <strong className="text-xs block mt-1.5">Installed</strong>
            <span className="text-[9px] text-slate-550 block mt-0.5">2 Years Ago</span>
          </div>
          <div className="flex flex-col items-center bg-slate-900 p-2 rounded-xl text-center w-32 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <strong className="text-xs block mt-1.5">Manual Uploaded</strong>
            <span className="text-[9px] text-slate-550 block mt-0.5">1 Year Ago</span>
          </div>
          <div className="flex flex-col items-center bg-slate-900 p-2 rounded-xl text-center w-32 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">3</span>
            <strong className="text-xs block mt-1.5">Inspection</strong>
            <span className="text-[9px] text-slate-550 block mt-0.5">3 Months Ago</span>
          </div>
          <div className="flex flex-col items-center bg-slate-900 p-2 rounded-xl text-center w-32 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">4</span>
            <strong className="text-xs block mt-1.5">Maintenance</strong>
            <span className="text-[9px] text-slate-550 block mt-0.5">45 Days Ago</span>
          </div>
          <div className="flex flex-col items-center bg-slate-900 p-2 rounded-xl text-center w-32 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">5</span>
            <strong className="text-xs block mt-1.5">Failure Scan</strong>
            <span className="text-[9px] text-slate-550 block mt-0.5">10 Days Ago</span>
          </div>
          <div className="flex flex-col items-center bg-slate-900 p-2 rounded-xl text-center w-32 border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
            <strong className="text-xs block mt-1.5">Calibration</strong>
            <span className="text-[9px] text-slate-550 block mt-0.5">Current Status</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MANUALS, COMPLIANCE CHECKLIST */}
        <div className="space-y-8">
          
          {/* Knowledge Gap & Checklist */}
          {gapAnalysis && (
            <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                Document Checklist (Gap Analysis)
              </h3>
              <div className="space-y-2.5">
                {Object.entries(gapAnalysis.checklist).map(([cat, present]) => (
                  <div key={cat} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">{cat}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      present ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {present ? "Complete" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
              {gapAnalysis.missing_documents.length > 0 && (
                <div className="pt-3 border-t border-slate-800 text-[11px] text-amber-405 space-y-1">
                  <strong>Recommendations:</strong>
                  {gapAnalysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Telemetry Simulator Form */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" /> Telemetry Simulator
            </h3>
            
            <form onSubmit={handleSubmitTelemetry} className="mt-4 space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
                  Telemetry logged! Diagnostics recalibrating.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400">Temperature (°C)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    name="temperature"
                    value={telemetry.temperature}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-2.5 py-1.5 border rounded-lg bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Pressure (bar)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    name="pressure"
                    value={telemetry.pressure}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-2.5 py-1.5 border rounded-lg bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Vibration (mm/s)</label>
                  <input
                    required
                    type="number"
                    step="any"
                    name="vibration"
                    value={telemetry.vibration}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-2.5 py-1.5 border rounded-lg bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400">RPM</label>
                  <input
                    required
                    type="number"
                    name="rpm"
                    value={telemetry.rpm}
                    onChange={handleInputChange}
                    className="mt-1 w-full px-2.5 py-1.5 border rounded-lg bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 border border-transparent rounded-lg shadow font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Stream Telemetry Data
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* MIDDLE COLUMN: TELEMETRY METRICS & ROOT CAUSE ANALYSIS AGENT */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Live Telemetry Sensors */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" /> Real-time Sensor Metrics
            </h3>

            {asset.latestReading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3 border border-slate-850 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Temperature</span>
                  <strong className="text-lg text-slate-100">{asset.latestReading.temperature}°C</strong>
                </div>
                <div className="p-3 border border-slate-850 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Pressure</span>
                  <strong className="text-lg text-slate-100">{asset.latestReading.pressure} bar</strong>
                </div>
                <div className="p-3 border border-slate-850 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Vibration</span>
                  <strong className="text-lg text-slate-100">{asset.latestReading.vibration} mm/s</strong>
                </div>
                <div className="p-3 border border-slate-850 bg-slate-950/40 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">RPM</span>
                  <strong className="text-lg text-slate-100">{asset.latestReading.rpm}</strong>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                No telemetry sensor data exists. Use the Simulator to post readings.
              </div>
            )}
          </div>

          {/* AI Decision Intelligence Recommendation Card */}
          {decisionRec && (
            <div className="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 shadow-2xl space-y-4">
              <div className="flex justify-between items-start gap-2 border-b border-purple-500/10 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-purple-400 block tracking-wider">AI Decision Intelligence Recommendation</span>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">{decisionRec.title}</h4>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-bold">
                  Prob: {decisionRec.failure_probability}%
                </span>
              </div>
              
              <div className="text-xs space-y-3">
                <p className="text-slate-350 font-light leading-relaxed">{decisionRec.description}</p>
                
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Action</span>
                    <p className="text-slate-200 mt-0.5 font-medium">{decisionRec.recommended_action}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Expected Benefit</span>
                    <p className="text-slate-350 mt-0.5 font-light leading-relaxed">{decisionRec.expected_benefit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Est. Cost Savings</span>
                    <span className="font-bold text-emerald-450 block mt-0.5">${decisionRec.estimated_cost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Est. Downtime Avoided</span>
                    <span className="font-bold text-sky-450 block mt-0.5">{decisionRec.estimated_downtime} Hrs</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-medium">Confidence Grounding: {decisionRec.confidence_score}%</span>
                  <a
                    href={`/dashboard/decision/explainable?uuid=${decisionRec.uuid}`}
                    className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                  >
                    View Explainability Tree <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* AI RCA ANALYSIS AGENT */}
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" /> AI Root Cause Analysis Agent
              </h3>
              <button
                onClick={handleRunRCA}
                disabled={isRunningRCA}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                {isRunningRCA ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Diagnosing...
                  </>
                ) : (
                  <>
                    <Hammer className="w-3.5 h-3.5" /> Initiate RCA
                  </>
                )}
              </button>
            </div>

            {rcaResult ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Possible Cause</span>
                    <p className="text-slate-200 font-semibold">{rcaResult.possible_cause}</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">AI Diagnosis Confidence</span>
                    <p className="text-indigo-400 font-extrabold text-sm">{(rcaResult.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-550 uppercase">Telemetry Evidence</span>
                  <p className="text-slate-300 leading-relaxed">{rcaResult.evidence}</p>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-550 uppercase">Similar Historical Incident</span>
                  <p className="text-slate-355 italic">{rcaResult.similar_failures}</p>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-550 uppercase">Recommended Actions</span>
                  <p className="text-emerald-450 leading-relaxed font-medium">{rcaResult.recommended_actions}</p>
                </div>

                {rcaResult.citations.length > 0 && (
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-550 uppercase flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Reference Citations
                    </span>
                    <div className="space-y-1 mt-1 text-[11px]">
                      {rcaResult.citations.map((cit, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-400 bg-slate-900 px-2 py-1 rounded">
                          <span>{cit.source_document}</span>
                          <span className="font-mono text-[10px] text-indigo-400">Page {cit.page} {cit.section ? `• ${cit.section}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs font-semibold">
                Click "Initiate RCA" to query historical incidents, inspection logs, and manual contexts for troubleshooting suggestions.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
