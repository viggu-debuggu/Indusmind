"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { currentUser } = useAuth();

  const hasAccess = currentUser && allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Node Terminated</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light leading-relaxed">
          Your current security classification (<strong>{currentUser?.role || "Viewer"}</strong>) does not possess permission rights to access this workspace section. Please contact a Super Admin or Platform Administrator for privilege adjustments.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
