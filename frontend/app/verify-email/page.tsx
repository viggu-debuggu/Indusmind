"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Shield, Loader2, MailCheck, AlertTriangle, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setErrorMessage("Verification token is missing from url parameters.");
        return;
      }

      try {
        await api.post("/api/auth/verify-email", { token });
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        let errMsg = "Failed to verify account. The link may have expired.";
        if (err.response?.data?.error?.message) {
          errMsg = err.response.data.error.message;
        } else if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          if (Array.isArray(detail)) {
            errMsg = detail.map((d: any) => `${d.loc ? d.loc.join(".") + ": " : ""}${d.msg}`).join(", ");
          } else if (typeof detail === "object" && detail !== null) {
            errMsg = JSON.stringify(detail);
          } else {
            errMsg = String(detail);
          }
        }
        setErrorMessage(errMsg);
      }
    }
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative text-slate-100 selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <Shield className="w-10 h-10 text-indigo-500" />
          <span className="font-extrabold text-2xl tracking-wider text-white">
            INDUSMIND <span className="text-slate-400">AI</span>
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Email Validation Node
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 text-center">
          
          {status === "loading" && (
            <div className="py-6 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-350">Confirming registration token...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <MailCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Verification Complete</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Your email has been authenticated and your account status is active.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors w-full"
                >
                  Sign in to Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Validation Failed</h3>
              <p className="text-xs text-red-400 font-light leading-relaxed">
                {errorMessage}
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 text-xs font-semibold hover:bg-slate-900 transition-colors w-full"
                >
                  Return to login
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
