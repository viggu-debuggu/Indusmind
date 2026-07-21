import React from "react";
import Link from "next/link";
import { Shield, AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10" />

      <div className="text-center max-w-md space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
          404 - Node Unreachable
        </h1>

        <p className="text-sm text-slate-400 font-light">
          The requested system node, operational telemetry page, or documentation route does not exist or has been relocated within the platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors"
          >
            Access Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return Home
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-center">
        <div className="flex items-center gap-1.5 justify-center text-slate-500">
          <Shield className="w-4 h-4 text-indigo-550" />
          <span className="font-bold text-[10px] uppercase tracking-wider">
            INDUSMIND AI Security Node
          </span>
        </div>
      </div>
    </div>
  );
}
