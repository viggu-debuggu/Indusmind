"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Key, Save, Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

// Form validation schemas
const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  company: z.string().min(2, "Company name is required"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm the new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { currentUser, refreshProfile } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<"details" | "password">("details");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: currentUser?.fullName || "",
      company: currentUser?.company || "",
      department: currentUser?.department || "",
      jobTitle: currentUser?.jobTitle || "",
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const onUpdateProfile = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.put("/api/users/me", {
        fullName: data.fullName,
        company: data.company,
        department: data.department || null,
        jobTitle: data.jobTitle || null,
      });
      await refreshProfile();
      setSuccessMsg("Profile details updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordFormValues) => {
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.put("/api/users/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
      setSuccessMsg("Security password changed successfully!");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || "Failed to change credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "US";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Profile Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your personal details, password security, and active permission metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Profile Card & Tabs */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow mx-auto mb-4">
              {getInitials(currentUser?.fullName || "")}
            </div>
            <h3 className="font-bold text-lg">{currentUser?.fullName || ""}</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono select-all truncate">{currentUser?.email || ""}</p>
            <div className="mt-4 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full inline-block">
              {currentUser?.role}
            </div>
          </div>

          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            <button
              onClick={() => {
                setActiveSubTab("details");
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${
                activeSubTab === "details"
                  ? "bg-slate-900 border-slate-950 text-white dark:bg-slate-100 dark:border-white dark:text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <User className="w-4 h-4" /> Account Details
            </button>
            <button
              onClick={() => {
                setActiveSubTab("password");
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border ${
                activeSubTab === "password"
                  ? "bg-slate-900 border-slate-950 text-white dark:bg-slate-100 dark:border-white dark:text-slate-900 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Key className="w-4 h-4" /> Change Password
            </button>
          </div>
        </div>

        {/* Editing Panels */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 md:p-8 shadow-sm">
          
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-2 mb-6">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeSubTab === "details" && (
            <form className="space-y-6" onSubmit={handleProfileSubmit(onUpdateProfile)}>
              <div>
                <h3 className="text-lg font-bold">Account Specifications</h3>
                <p className="text-xs text-slate-400">Configure your contact details and active department.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...registerProfile("fullName")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white ${
                      profileErrors.fullName ? "border-red-500" : ""
                    }`}
                  />
                  {profileErrors.fullName && (
                    <p className="mt-1 text-xs text-red-400">{profileErrors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    {...registerProfile("company")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white ${
                      profileErrors.company ? "border-red-500" : ""
                    }`}
                  />
                  {profileErrors.company && (
                    <p className="mt-1 text-xs text-red-400">{profileErrors.company.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    {...registerProfile("department")}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    {...registerProfile("jobTitle")}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Update profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeSubTab === "password" && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit(onChangePassword)}>
              <div>
                <h3 className="text-lg font-bold">Update security credentials</h3>
                <p className="text-xs text-slate-400">Regularly change your security password to protect database access.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("oldPassword")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white ${
                      passwordErrors.oldPassword ? "border-red-500" : ""
                    }`}
                  />
                  {passwordErrors.oldPassword && (
                    <p className="mt-1 text-xs text-red-400">{passwordErrors.oldPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("newPassword")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white ${
                      passwordErrors.newPassword ? "border-red-500" : ""
                    }`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("confirmPassword")}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 dark:text-white ${
                      passwordErrors.confirmPassword ? "border-red-500" : ""
                    }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Key className="w-4 h-4" /> Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
