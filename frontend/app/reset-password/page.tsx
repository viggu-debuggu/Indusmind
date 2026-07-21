"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { Shield, Eye, EyeOff, Loader2, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Reset token is missing from url parameters.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await api.post("/api/auth/reset-password", {
        token: token,
        new_password: data.password,
      });
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      let errMsg = "Failed to reset password. The link may have expired.";
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
    } finally {
      setIsLoading(false);
    }
  };

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
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {status === "form" && (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="mt-1.5">
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Apply New Password
                  </>
                )}
              </button>
            </form>
          )}

          {status === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Password Updated</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Your credentials have been updated successfully.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors w-full"
                >
                  Sign in to Portal
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-red-400">Reset Error</h3>
              <p className="text-xs text-red-400/90 font-light leading-relaxed">
                {errorMessage}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStatus("form")}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 text-xs font-semibold hover:bg-slate-900 transition-colors w-full"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
