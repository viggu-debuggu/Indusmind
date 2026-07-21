"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  LayoutDashboard,
  FileText,
  Cpu,
  GitBranch,
  MessageSquareCode,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Clock,
  Users,
  Briefcase,
  Activity,
  Network,
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  ClipboardList,
  Brain,
  Sparkles,
  Compass,
  Layers,
  Award,
  Server,
  Gauge
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic Notifications State
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New maintenance SOP manual uploaded", time: "10 mins ago", read: false },
    { id: 2, text: "Compliance alert: Boiler inspection pending", time: "2 hours ago", read: false }
  ]);

  const hasUnread = notifications.some((n) => !n.read);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // Initialize theme from system or class name
  useEffect(() => {
    document.body.classList.add("dark");
    setIsDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    const updated = !isDarkMode;
    setIsDarkMode(updated);
    if (updated) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  // Base navigation menu items
  const userRole = currentUser?.role || "Viewer";
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Organization Tree", path: "/dashboard/hierarchy", icon: Network },
    { name: "Workspaces", path: "/dashboard/workspaces", icon: Briefcase },
    { name: "Documents", path: "/dashboard/documents", icon: FileText },
    { name: "Equipment", path: "/dashboard/equipment", icon: Cpu },
    { name: "Knowledge Graph", path: "/dashboard/graph", icon: GitBranch },
    { name: "AI Copilot", path: "/dashboard/copilot", icon: MessageSquareCode },
    { name: "Semantic Search", path: "/dashboard/search", icon: Search },
    { name: "Industrial Memory AI", path: "/dashboard/memory", icon: Brain },
    { name: "Decision Intelligence", path: "/dashboard/decision", icon: Activity },
    { name: "Industrial Discovery", path: "/dashboard/discovery", icon: Compass },
    { name: "Knowledge Twin", path: "/dashboard/twin", icon: Layers },
    { name: "Continuous Learning", path: "/dashboard/learning", icon: Award },
    { name: "Executive Center", path: "/dashboard/executive", icon: Briefcase },
    { name: "AI Agent Center", path: "/dashboard/agents", icon: Sparkles },
    { name: "Enterprise Hub", path: "/dashboard/enterprise", icon: Server },
  ];

  // Append User Admin page if user is Super Admin or Admin
  const isAdmin = userRole === "Super Admin" || userRole === "Admin";
  if (isAdmin) {
    navItems.splice(5, 0, { name: "User Admin", path: "/dashboard/admin", icon: Users });
  }

  // Append Compliance Intelligence if allowed
  const isManagerOrAuditor = ["Super Admin", "Admin", "Department Manager", "Auditor"].includes(userRole);
  if (isManagerOrAuditor) {
    navItems.push({ name: "Compliance", path: "/dashboard/compliance", icon: ShieldCheck });
  }

  // Append Incidents & Lessons Learned if allowed
  const isIncidentTrackerAllowed = ["Super Admin", "Admin", "Engineer", "Department Manager", "Technician"].includes(userRole);
  if (isIncidentTrackerAllowed) {
    navItems.push({ name: "Incidents Tracker", path: "/dashboard/incidents", icon: AlertTriangle });
  }

  // Append Audit Trail if allowed
  if (isAdmin) {
    navItems.push({ name: "Audit Trail", path: "/dashboard/audit", icon: ClipboardList });
  }

  // Append Analytics & KPIs if allowed
  const isManagerOrAdmin = ["Super Admin", "Admin", "Department Manager"].includes(userRole);
  if (isManagerOrAdmin) {
    navItems.push({ name: "Analytics & KPIs", path: "/dashboard/analytics", icon: BarChart3 });
  }

  navItems.push({ name: "Notifications", path: "/dashboard/notifications", icon: Bell });
  navItems.push({ name: "Settings", path: "/dashboard/settings", icon: SettingsIcon });

  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.split(" ");
    return parts.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? "bg-industrial-darkest text-slate-100" : "bg-slate-50 text-slate-900"}`}>
        
        {/* SIDEBAR */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col border-r transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-64"
          } ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}
        >
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-industrial-dark dark:text-slate-200" />
                <span className="font-extrabold text-lg tracking-wider text-industrial-dark dark:text-white">
                  INDUSMIND <span className="text-steel-DEFAULT dark:text-slate-400">AI</span>
                </span>
              </Link>
            )}
            {isCollapsed && (
              <Shield className="w-6 h-6 mx-auto text-industrial-dark dark:text-slate-200" />
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden md:block p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${isCollapsed ? "mx-auto" : ""}`}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                    isActive
                      ? isDarkMode
                        ? "bg-industrial-dark text-white shadow-md shadow-industrial-dark/20"
                        : "bg-slate-100 text-industrial-dark font-semibold border-l-4 border-industrial-dark pl-2 rounded-l-none"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-industrial-dark dark:text-white" : ""}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer / Logout */}
          <div className="p-2 border-t border-inherit">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all duration-150"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTAINER */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? "pl-16" : "pl-64"}`}>
          
          {/* TOP NAVBAR */}
          <header className={`h-16 flex items-center justify-between px-6 border-b sticky top-0 z-20 ${
            isDarkMode ? "bg-slate-950/80 border-slate-800 backdrop-blur-md" : "bg-white/80 border-slate-200 backdrop-blur-md"
          }`}>
            {/* Mobile hamburger menu placeholder */}
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative max-w-md hidden sm:block">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search drawings, equipment, SOPs..."
                  className={`w-80 pl-9 pr-4 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-industrial-dark transition-all ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-850 text-white placeholder-slate-500 focus:border-slate-700"
                      : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-300"
                  }`}
                />
              </div>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-4">
              
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg border transition-all ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 text-yellow-500 hover:bg-slate-800"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className={`p-2 rounded-lg border transition-all relative ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </button>
 
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-xl py-2 z-50 transition-all ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="px-4 py-2 border-b border-inherit font-semibold text-sm flex justify-between items-center">
                      <span>Recent Alerts</span>
                      <button onClick={markAllRead} className="text-xs text-indigo-500 hover:underline cursor-pointer focus:outline-none bg-transparent border-0 p-0">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => toggleRead(n.id)}
                          className={`px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer border-b border-inherit/40 flex justify-between items-start gap-2 ${
                            !n.read ? "bg-indigo-50/20 dark:bg-indigo-950/10 font-semibold" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <p className={`text-xs ${!n.read ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                              {n.text}
                            </p>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {n.time}
                            </span>
                          </div>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                    {getInitials(currentUser?.fullName || "")}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold leading-3">{currentUser?.fullName || "Guest User"}</p>
                    <span className="text-[10px] text-slate-400">{currentUser?.jobTitle || currentUser?.role || "Viewer"}</span>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl py-2 z-50 transition-all ${
                    isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="px-4 py-2 border-b border-inherit">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold truncate">{currentUser?.email || ""}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      User Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left block px-4 py-2 text-xs text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* DYNAMIC PAGE CONTENT */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

      </div>
    </ProtectedRoute>
  );
}
