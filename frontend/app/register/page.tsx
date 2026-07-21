"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().min(2, "Company name is required"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  role: z.enum(["Super Admin", "Admin", "Department Manager", "Engineer", "Technician", "Auditor", "Viewer"]),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms of service" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      company: "",
      department: "",
      jobTitle: "",
      role: "Viewer",
      password: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        company: data.company,
        department: data.department || null,
        jobTitle: data.jobTitle || null,
        role: data.role,
        password: data.password
      });
    } catch (err: any) {
      let errMsg = "Registration failed. Try again.";
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Shield className="w-10 h-10 text-indigo-500" />
          <span className="font-extrabold text-2xl tracking-wider text-white">
            INDUSMIND <span className="text-slate-400">AI</span>
          </span>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Create corporate account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in to your portal
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900 border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  {...register("fullName")}
                  className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm ${
                    errors.fullName ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Corporate Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="johndoe@company.com"
                  {...register("email")}
                  className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm ${
                    errors.email ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="company" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  placeholder="Shell"
                  {...register("company")}
                  className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm ${
                    errors.company ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {errors.company && (
                  <p className="mt-1 text-xs text-red-400">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="department" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  placeholder="Operations"
                  {...register("department")}
                  className="mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  placeholder="Site Manager"
                  {...register("jobTitle")}
                  className="mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Industrial Role / RBAC
                </label>
                <select
                  id="role"
                  {...register("role")}
                  className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm ${
                    errors.role ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                >
                  <option value="Viewer">Viewer / Employee</option>
                  <option value="Engineer">Operational Engineer</option>
                  <option value="Technician">Field Technician</option>
                  <option value="Department Manager">Department Manager</option>
                  <option value="Admin">Organization Admin</option>
                  <option value="Auditor">Compliance Auditor</option>
                  <option value="Super Admin">Platform Super Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-400">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/80 border-slate-800 text-white sm:text-sm ${
                    errors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsAccepted"
                  type="checkbox"
                  {...register("termsAccepted")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-800 bg-slate-950 rounded"
                />
              </div>
              <div className="ml-3 text-xs">
                <label htmlFor="termsAccepted" className="text-slate-350">
                  I accept the{" "}
                  <a href="#" className="font-semibold text-indigo-400 hover:underline">
                    terms of service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-semibold text-indigo-400 hover:underline">
                    industrial compliance guidelines
                  </a>.
                </label>
                {errors.termsAccepted && (
                  <p className="mt-1 text-xs text-red-400">{errors.termsAccepted.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
