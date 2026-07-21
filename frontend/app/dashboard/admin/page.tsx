"use client";

import React, { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserX,
  UserCheck,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

interface UserAccount {
  id: number;
  uuid: string;
  email: string;
  fullName: string;
  company?: string;
  department?: string;
  jobTitle?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const roleQuery = roleFilter !== "all" ? roleFilter : "";
      const res = await api.get("/api/admin/users", {
        params: {
          search: search || undefined,
          role: roleQuery || undefined,
          skip: (page - 1) * limit,
          limit: limit,
        }
      });
      setUsers(res.data);
    } catch (err: any) {
      setErrorMessage("Failed to load user records from security database node.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const toggleUserStatus = async (user: UserAccount) => {
    // Prevent self-deactivation
    if (user.id === currentUser?.id) {
      alert("Self-deactivation is prohibited by security policy.");
      return;
    }

    const action = user.isActive ? "deactivate" : "activate";
    try {
      await api.put(`/api/admin/users/${user.id}/${action}`);
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Operation failed.");
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    // Prevent modifying own role
    if (userId === currentUser?.id) {
      alert("Modifying your own administrative role is prohibited.");
      return;
    }

    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update role.");
    }
  };

  const allowedRoles = ["Super Admin", "Admin", "Engineer", "Technician", "Viewer"];

  return (
    <RoleGuard allowedRoles={["Super Admin", "Admin"]}>
      <div className="space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            User Account Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit portal accounts, elevate operational privileges, and manage security verification tokens.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Role Filters */}
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-xs font-semibold bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 focus:outline-none"
            >
              <option value="all">All Roles</option>
              {allowedRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 pb-3 text-slate-450 text-xs font-semibold uppercase tracking-wider bg-slate-50/55 dark:bg-slate-950/20">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Security Role</th>
                  <th className="p-4">Organization / Company</th>
                  <th className="p-4">Ver. Status</th>
                  <th className="p-4">Active State</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                      <p className="text-xs text-slate-400 mt-2 font-light">Loading portal records...</p>
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === currentUser?.id}
                          className="px-2.5 py-1 border rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 focus:outline-none disabled:opacity-50"
                        >
                          {allowedRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-650 dark:text-slate-350">{user.company || "N/A"}</div>
                        <div className="text-[10px] text-slate-400 font-light mt-0.5">{user.jobTitle || "Viewer"}</div>
                      </td>
                      <td className="p-4">
                        {user.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-450 font-medium bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          disabled={user.id === currentUser?.id}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ml-auto ${
                            user.isActive
                              ? "border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white"
                              : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          } disabled:opacity-50`}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400 text-xs font-light">
                      No user accounts found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 text-xs">
            <span className="text-slate-450 font-light">Showing page {page}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => (users.length === limit ? p + 1 : p))}
                disabled={users.length < limit}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}
