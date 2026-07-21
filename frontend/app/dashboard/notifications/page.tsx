"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ShieldAlert,
  Loader2,
  Sparkles,
  UserCheck,
  Cpu
} from "lucide-react";

interface NotificationItem {
  id: number;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await api.delete("/api/notifications/clear");
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-3 text-slate-450 selection:bg-indigo-500 selection:text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-bold">Checking central notification center...</span>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("ai")) return <Sparkles className="w-5 h-5 text-indigo-400" />;
    if (t.includes("compliance")) return <ShieldAlert className="w-5 h-5 text-amber-400" />;
    if (t.includes("approval")) return <UserCheck className="w-5 h-5 text-purple-400" />;
    return <Cpu className="w-5 h-5 text-teal-400" />;
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-550" /> Notification Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time industrial logs, workflow task assignments, and compliance alarms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 border border-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-lg hover:text-white transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-450" /> Mark all read
          </button>
          <button
            onClick={handleClearNotifications}
            className="px-3.5 py-1.5 border border-red-900/30 bg-red-950/10 hover:bg-red-950/20 text-xs font-bold text-red-400 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS CONTAINER */}
      <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl space-y-4">
        <div className="divide-y divide-slate-850">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`py-4 flex items-start gap-4 transition-all ${
                item.read ? "opacity-60" : "bg-indigo-950/5 rounded-lg px-2 -mx-2"
              }`}
            >
              <div className="p-2 border border-slate-850 bg-slate-950/40 rounded-xl">
                {getAlertIcon(item.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
                    {item.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-light leading-relaxed">{item.message}</p>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-24 text-center text-slate-500 text-xs font-semibold">
              No notification logs or alerts registered yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
