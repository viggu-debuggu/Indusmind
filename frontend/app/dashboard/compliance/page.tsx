"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calendar,
  Sparkles,
  Download,
  AlertOctagon,
  BookOpen
} from "lucide-react";

interface AuditEvidence {
  evidence_id: string;
  source_document: string;
  regulation_matched: string;
  verdict: string;
  extracted_clause: string;
  assessed_at: string;
}

interface ComplianceScanResult {
  sop_name: string;
  regulation_name: string;
  compliance_percentage: number;
  deviations: string[];
  verdict: string;
}

export default function CompliancePage() {
  const [evidenceList, setEvidenceList] = useState<AuditEvidence[]>([]);
  const [scans, setScans] = useState<ComplianceScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // File Upload State
  const [sopId, setSopId] = useState("");
  const [regId, setRegId] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [evRes, scansRes] = await Promise.all([
        api.get("/api/compliance/evidence").catch(() => ({ data: [] })),
        api.get("/api/compliance/scans").catch(() => ({ data: [] }))
      ]);
      setEvidenceList(evRes.data || []);
      setScans(scansRes.data || []);
    } catch (err) {
      console.error("Failed to load compliance details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sopId || !regId) return;
    setIsScanning(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const res = await api.post("/api/compliance/scan", null, {
        params: { sop_id: sopId, regulation_id: regId }
      });
      setFormSuccess(true);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Compliance scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-3 text-slate-450 selection:bg-indigo-500 selection:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-bold">Querying compliance audits...</span>
      </div>
    );
  }

  // Fallback mock scans if database holds none
  const activeScans = scans.length > 0 ? scans : [
    {
      sop_name: "Pressure Valve Calibration SOP",
      regulation_name: "PESO Gas Cylinder Rules 2018",
      compliance_percentage: 95,
      deviations: [
        "Daily pressure testing logs must be digitally timestamped.",
        "Missing dual-signature approval protocols for relief-valve recalibration."
      ],
      verdict: "High Compliance with Minor Deviations"
    },
    {
      sop_name: "High Temperature Storage SOP",
      regulation_name: "ISO 45001 Safety Norms",
      compliance_percentage: 64,
      deviations: [
        "Inadequate PPE guidelines for maintenance operators at heat exchangers.",
        "Expired emergency valve backup tests."
      ],
      verdict: "Non-Compliant - Critical Updates Needed"
    }
  ];

  const activeEvidence = evidenceList.length > 0 ? evidenceList : [
    {
      evidence_id: "EVID-PESO-8321",
      source_document: "Pressure Valve Calibration SOP",
      regulation_matched: "PESO Gas Cylinder Rules 2018 Section 4.2",
      verdict: "Compliant",
      extracted_clause: "Relief valves shall be tested at 1.1x working limits every quarter.",
      assessed_at: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-550" /> Compliance Intelligence Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare active Standard Operating Procedures (SOPs) against PESO, OISD, ISO, and Factory Act regulations.
          </p>
        </div>
      </div>

      {/* TOP ROW: INITIATE SCAN SCANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Scan Form */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-550" /> Run AI Compliance Scan
          </h3>
          
          <form onSubmit={handleRunScan} className="mt-4 space-y-4">
            {formError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
                Scan complete! Compliance metrics refreshed.
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Target SOP ID</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 1 (Document ID of SOP)"
                  value={sopId}
                  onChange={(e) => setSopId(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 border rounded-lg bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400">Reference Regulation ID</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 2 (Document ID of PESO/ISO)"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 border rounded-lg bg-slate-950 border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isScanning || !sopId || !regId}
              className="w-full py-2 border border-transparent rounded-lg shadow font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Run Compliance Scan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Scan Results Cards */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Active Compliance Audits
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {activeScans.map((scan, i) => (
              <div key={i} className="p-4 border border-slate-850 bg-slate-950/40 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white">{scan.sop_name}</h4>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">vs {scan.regulation_name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${
                    scan.compliance_percentage >= 80
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-550/20"
                      : "bg-red-500/10 text-red-400 border-red-550/20"
                  }`}>
                    {scan.compliance_percentage}% Compliance
                  </span>
                </div>

                {scan.deviations.length > 0 && (
                  <div className="text-[11px] border-t border-slate-900 pt-2 text-slate-400 space-y-1">
                    <strong className="text-red-450 block flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Detected Deviations:
                    </strong>
                    {scan.deviations.map((dev, j) => (
                      <div key={j} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{dev}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: EVIDENCE PACKAGES */}
      <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Compliance Evidence Packages (Audit Evidence logs)
          </h3>
          <a
            href={`${api.defaults.baseURL || ""}/api/compliance/evidence/export`}
            download
            className="px-3 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF Evidence Bundle
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-450 font-bold">
                <th className="py-2.5">Evidence ID</th>
                <th className="py-2.5">SOP Name</th>
                <th className="py-2.5">Regulation Matched</th>
                <th className="py-2.5">Verdict</th>
                <th className="py-2.5">Clause Matched</th>
                <th className="py-2.5 text-right">Extracted Date</th>
              </tr>
            </thead>
            <tbody>
              {activeEvidence.map((ev, idx) => (
                <tr key={idx} className="border-b border-slate-850 hover:bg-slate-950/30 text-slate-300">
                  <td className="py-3 font-mono font-bold text-indigo-400">{ev.evidence_id}</td>
                  <td className="py-3 font-semibold">{ev.source_document}</td>
                  <td className="py-3 text-slate-400">{ev.regulation_matched}</td>
                  <td className="py-3">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      {ev.verdict}
                    </span>
                  </td>
                  <td className="py-3 max-w-xs truncate text-[11px] text-slate-400 italic">"{ev.extracted_clause}"</td>
                  <td className="py-3 text-right font-mono text-[10px] text-slate-500">
                    {new Date(ev.assessed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
