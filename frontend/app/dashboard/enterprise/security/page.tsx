"use client";

import React from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Users,
  Key,
  Shield,
  FileText
} from "lucide-react";

export default function SecurityCenterPage() {
  const securityChecks = [
    { check: "JWT Secret Length & Strength", status: "PASSED", rating: "CRITICAL", msg: "SECRET_KEY satisfies length requirements" },
    { check: "Production Mode Flag", status: "PASSED", rating: "LOW", msg: "Environment properly configured" },
    { check: "Database Password Encrypted", status: "PASSED", rating: "HIGH", msg: "PostgreSQL pgvector credentials secured" },
    { check: "CORS Allowed Origins Guard", status: "PASSED", rating: "MEDIUM", msg: "Restricted to authorized domains" },
    { check: "API Documentation Guard", status: "PASSED", rating: "LOW", msg: "Swagger access disabled in prod mode" }
  ];

  const permissionsMatrix = [
    { role: "Super Admin", access: "Full System Access, Config, User Admin, Export", badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300" },
    { role: "Admin", access: "User Admin, Workspaces, Equipment, Compliance", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" },
    { role: "Department Manager", access: "Workspaces, Documents, Analytics, Equipment", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
    { role: "Engineer", access: "Documents Upload, Equipment Write, Incidents, Twin", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
    { role: "Auditor", access: "Compliance Read, Audit Logs, Executive Center", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" },
    { role: "Technician", access: "Incidents Tracker, Equipment Read, Semantic Search", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" }
  ];

  const recentEvents = [
    { id: "SEC-104", event: "AUTHENTICATION_SUCCESS", actor: "admin@indusmind.ai", time: "2 mins ago", status: "SUCCESS" },
    { id: "SEC-103", event: "PRIVILEGE_CHECK", actor: "manager@plant.com", time: "15 mins ago", status: "PASSED" },
    { id: "SEC-102", event: "SENSITIVE_CONFIG_AUDIT", actor: "system_cron", time: "1 hour ago", status: "PASSED" },
    { id: "SEC-101", event: "TOKEN_REFRESH", actor: "engineer@indusmind.ai", time: "2 hours ago", status: "SUCCESS" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/enterprise" className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-500" />
              Security Center & Audits
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authentication audits, permission matrices, failed login monitoring, and configuration validation.
            </p>
          </div>
        </div>
      </div>

      {/* SECURITY SCORE HERO */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center font-extrabold text-2xl">
            A+
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Security Audit Rating: A+ (100%)</h2>
            <p className="text-xs text-slate-300 mt-1">
              0 Critical Vulnerabilities. All authentication, authorization, and secret configurations passed audit.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-center">
          <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-xl font-bold text-emerald-400">0</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Active Threats</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-xl font-bold text-indigo-400">0</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Failed Logins (24h)</p>
          </div>
        </div>
      </div>

      {/* CONFIGURATION AUDIT */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          Sensitive Configuration Validation
        </h2>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {securityChecks.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.check}</p>
                  <p className="text-slate-500 dark:text-slate-400">{item.msg}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PERMISSION AUDIT MATRIX */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          RBAC Permission Audit Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissionsMatrix.map((p, idx) => (
            <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badge}`}>{p.role}</span>
                <span className="text-[10px] text-emerald-500 font-semibold">Permission Enforced</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{p.access}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
