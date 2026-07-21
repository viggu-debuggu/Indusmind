"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, ArrowLeft, Loader2, MailCheck } from "lucide-react";

import { api } from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setErrorText(null);
    try {
      await api.post("/api/auth/forgot-password", {
        email: data.email
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorText("Failed to process request. Please verify connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Shield className="w-10 h-10 text-indigo-500" />
          <span className="font-extrabold text-2xl tracking-wider text-white">
            INDUSMIND <span className="text-slate-400">AI</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Reset Portal Password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your registered email and we will send you a secure link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {errorText && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                  {errorText}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Corporate Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    {...register("email")}
                    className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm ${
                      errors.email ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <MailCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Reset Link Transmitted</h3>
              <p className="text-sm text-slate-400">
                Please check your inbox. If the email exists on our records, you will receive password reset instructions shortly.
              </p>
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
