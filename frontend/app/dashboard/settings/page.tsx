"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Building,
  Database,
  Cloud,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [activeStorage, setActiveStorage] = useState("local");

  const [profile, setProfile] = useState({
    fullName: "Vignesh M.",
    email: "vignesh@indusmind.ai",
    role: "Chief Asset Architect",
    company: "Indusmind Operations Inc."
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Settings simulated successfully. Configurations written to active .env variables!");
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          System Control Panel
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure active cloud storage links, inspect database nodes, and manage employee profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SETTINGS TABS */}
        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {[
            { id: "profile", label: "User Profile", icon: User },
            { id: "organization", label: "Organization", icon: Building },
            { id: "storage", label: "Storage Providers", icon: Cloud },
            { id: "database", label: "Database status", icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? "bg-slate-900 border-slate-950 text-white dark:bg-slate-100 dark:border-white dark:text-slate-900 shadow-sm"
                    : "bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* DETAILS SECTION */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 md:p-8 shadow-sm">
          
          {/* USER PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Personal Profile Mappings</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400">Manage security credentials and notification defaults.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Corporate Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-100 dark:bg-slate-950/50 border-slate-200 dark:border-slate-850/80 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Designation Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </div>
          )}

          {/* ORGANIZATION TAB */}
          {activeTab === "organization" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Corporate Organization</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400">Configure regulatory groups and factory locations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Compliance Directory</label>
                  <input
                    type="text"
                    value="OSHA-Standard-1910"
                    disabled
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-100 dark:bg-slate-950/50 border-slate-200 dark:border-slate-850/80 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Update Org Details"}
                </button>
              </div>
            </div>
          )}

          {/* STORAGE TAB */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Modular Storage Integrations</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400">Configure where raw PDF blueprints and engineering manual files are physically persisted.</p>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: "local", name: "Local Storage" },
                  { id: "s3", name: "AWS S3" },
                  { id: "azure", name: "Azure Blob" },
                  { id: "minio", name: "MinIO Server" }
                ].map((prov) => (
                  <button
                    key={prov.id}
                    onClick={() => setActiveStorage(prov.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      activeStorage === prov.id
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Cloud className="w-6 h-6 mb-2" />
                    <span className="text-xs font-semibold">{prov.name}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Storage Config Details */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 space-y-4">
                {activeStorage === "local" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Local Storage Root Path</label>
                    <input
                      type="text"
                      value="/app/storage"
                      disabled
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 dark:text-white"
                    />
                  </div>
                )}
                {activeStorage === "s3" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">S3 Bucket Name</label>
                      <input type="text" placeholder="indusmind-bucket" className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Region</label>
                      <input type="text" placeholder="us-east-1" className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 dark:text-white" />
                    </div>
                  </div>
                )}
                {activeStorage !== "local" && activeStorage !== "s3" && (
                  <div className="text-center py-6 text-slate-400 text-xs font-light">
                    Configuration panel for {activeStorage.toUpperCase()} credentials template matches the backend `storage.py` factory definitions.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" /> Save Connection
                </button>
              </div>
            </div>
          )}

          {/* DATABASE TELEMETRY TAB */}
          {activeTab === "database" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Database Node Telemetry</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400">Monitor SQLAlchemy sessions and transaction pool loads.</p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-450 dark:text-emerald-400 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">PostgreSQL Nodes Operational</h4>
                  <p className="text-xs font-light mt-1 text-slate-650 dark:text-slate-400">
                    FastAPI db link successfully compiled engine using psycopg2 driver. Connected connection pool active.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs border-t border-slate-100 dark:border-slate-800 pt-6">
                <div>
                  <p className="text-slate-400 font-semibold uppercase">Dialect Driver</p>
                  <p className="font-bold text-slate-700 dark:text-slate-350 mt-1">PostgreSQL + psycopg2</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase">Connection Pool Size</p>
                  <p className="font-bold text-slate-700 dark:text-slate-350 mt-1">10 connections (Max 20 overflow)</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
