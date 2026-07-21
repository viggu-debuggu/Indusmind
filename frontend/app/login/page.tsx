"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      let errMsg = "Invalid email or password credentials.";
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
      setAuthError(errMsg);
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
          Sign in to your portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Or{" "}
          <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
            register a new industrial account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                {authError}
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
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Security Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm pr-10 ${
                    errors.password ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-800 bg-slate-950 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-300">
                  Remember my workstation
                </label>
              </div>

              <div className="text-xs">
                <Link href="/forgot-password" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </Link>
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
                  "Authenticate Session"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
