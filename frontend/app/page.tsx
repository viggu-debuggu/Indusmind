"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  ArrowRight,
  Database,
  Search,
  Cpu,
  Workflow,
  ClipboardCheck,
  HardHat,
  Network,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  Lock,
  Globe,
  Layers,
  Terminal,
  Box
} from "lucide-react";

/* ─── Animated Counter ─── */
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const duration = 1800;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * ease));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="count-up-number">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── Testimonial Data ─── */
const testimonials = [
  {
    quote: "INDUSMIND AI reduced our equipment manual search time from hours to seconds. The AI Copilot is like having an expert engineer available 24/7.",
    name: "Rajesh Verma",
    role: "Plant Manager, Visakhapatnam Refinery",
    avatar: "RV"
  },
  {
    quote: "The compliance intelligence module caught three critical regulatory gaps we missed in manual audits. It pays for itself in avoided penalties.",
    name: "Sarah Mitchell",
    role: "HSE Director, Global Chemical Corp",
    avatar: "SM"
  },
  {
    quote: "Finally, a platform that understands industrial documents — P&ID drawings, SOPs, calibration sheets. The knowledge graph is a game-changer for root cause analysis.",
    name: "Anand Krishnan",
    role: "Maintenance Lead, Tata Steel",
    avatar: "AK"
  }
];

/* ─── Tech Stack Data ─── */
const techStack = [
  { name: "Next.js 15", desc: "App Router + React 19", icon: Globe, color: "text-white" },
  { name: "FastAPI", desc: "Python 3.12 async API", icon: Zap, color: "text-emerald-400" },
  { name: "PostgreSQL 16", desc: "pgvector extensions", icon: Database, color: "text-sky-400" },
  { name: "SQLAlchemy 2", desc: "ORM with Alembic", icon: Layers, color: "text-amber-400" },
  { name: "Sentence Transformers", desc: "Vector embeddings", icon: Cpu, color: "text-purple-400" },
  { name: "Docker Compose", desc: "Multi-container deploy", icon: Box, color: "text-blue-400" },
  { name: "JWT + RBAC", desc: "5-role access control", icon: Lock, color: "text-rose-400" },
  { name: "RAG Pipeline", desc: "Grounded AI answers", icon: Terminal, color: "text-indigo-400" },
];

/* ─── Feature Cards ─── */
const features = [
  {
    title: "Document Intelligence",
    description: "Extract text, schematics, tables, and notes automatically from legacy PDFs, inspection sheets, and engineering drawings using multi-format OCR.",
    icon: Database,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  {
    title: "AI Copilot",
    description: "Chat with your equipment manuals, SOPs, and assets directly. Retrieve specifications, maintenance steps, and compliance data instantly.",
    icon: Cpu,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20"
  },
  {
    title: "Knowledge Graph",
    description: "Automatically map linkages between equipment parts, maintenance alerts, processes, manuals, and sensor telemetry readings.",
    icon: Network,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  },
  {
    title: "Predictive Maintenance",
    description: "ML-powered failure prediction from sensor telemetry, historic work orders, and operational baselines. Get alerts before failures happen.",
    icon: Workflow,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  {
    title: "Compliance Intelligence",
    description: "Cross-reference SOPs and documents with OSHA, ISO 9001, EPA, and custom regulatory frameworks. Get instant audit-ready evidence reports.",
    icon: ClipboardCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  {
    title: "Analytics & KPIs",
    description: "Real-time enterprise dashboards with asset health distributions, document coverage metrics, maintenance trends, and AI query analytics.",
    icon: BarChart3,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20"
  }
];

/* ─── Stats ─── */
const stats = [
  { value: 500, suffix: "+", label: "Documents Indexed" },
  { value: 12, suffix: "", label: "Industrial Sites" },
  { value: 99, suffix: ".8%", label: "Platform Uptime" },
  { value: 50, suffix: "k+", label: "AI Queries Processed" }
];

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-advance testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* ═══ ANIMATED BACKGROUND ═══ */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* ═══ HEADER ═══ */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 animate-fade-in-down">
            <Shield className="w-8 h-8 text-indigo-500" />
            <span className="font-extrabold text-xl tracking-wider">
              INDUSMIND <span className="text-slate-400">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4 animate-fade-in-down delay-200">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 group"
            >
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center">
        {/* Decorative orb */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/8 rounded-full blur-[100px] -z-10" />

        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <HardHat className="w-4 h-4" />
            Industry 4.0 Brain
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.08] mb-7 animate-fade-in-up delay-100">
          One AI Brain for Every{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
            Industrial Asset
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-light mb-12 leading-relaxed animate-fade-in-up delay-200">
          Transform engineering documents, manuals, drawings, and maintenance logs into a centralized, searchable intelligence platform powered by RAG and vector embeddings.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
          >
            Deploy Platform <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2"
          >
            Explore Dashboard
          </Link>
        </div>
      </section>

      {/* ═══ STATS TICKER ═══ */}
      <section className="border-y border-slate-800/50 bg-slate-900/30 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100 + 100}ms` }}>
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                <CountUp target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES SECTION ═══ */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              Core Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Designed for Industrial Workforces
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-light leading-relaxed">
              Connect distributed operations with document extraction, compliance checks, predictive maintenance, and cross-asset knowledge graphs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className={`glass-card p-8 rounded-2xl flex flex-col h-full group`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-6 border ${feat.border}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-light flex-1">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW ═══ */}
      <section className="py-24 px-6 relative border-t border-slate-800/40">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/5 to-slate-950 -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              Live Interface
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              See the Platform in Action
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-light">
              A dark-mode, industrial-grade dashboard built for engineers, operators, and plant managers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Dashboard Preview */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/40">
                <div className="h-8 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="text-[9px] text-slate-500 ml-2">Industrial Control Center</span>
                </div>
                <Image
                  src="/previews/dashboard.png"
                  alt="INDUSMIND AI Dashboard"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <p className="text-center text-xs text-slate-500 mt-3 font-medium">Real-time Operations Dashboard</p>
            </div>

            {/* Copilot Preview */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-purple-950/40">
                <div className="h-8 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="text-[9px] text-slate-500 ml-2">AI Copilot Workspace</span>
                </div>
                <Image
                  src="/previews/copilot.png"
                  alt="INDUSMIND AI Copilot"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <p className="text-center text-xs text-slate-500 mt-3 font-medium">RAG-Grounded AI Copilot</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TECH STACK ═══ */}
      <section className="py-24 px-6 border-t border-slate-800/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              Engineering
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Built with Modern Infrastructure
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-light">
              Enterprise-grade architecture with clean separation of concerns, containerized deployment, and production-ready security.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="glass-card p-5 rounded-xl text-center group"
                >
                  <Icon className={`w-7 h-7 ${tech.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                  <h4 className="text-sm font-bold text-white mb-0.5">{tech.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{tech.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-24 px-6 border-t border-slate-800/40 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/5 to-slate-950 -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-5">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>

          {/* Testimonial Carousel */}
          <div className="max-w-3xl mx-auto relative">
            <div className="overflow-hidden">
              {testimonials.map((t, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-500 ${
                    idx === currentTestimonial
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 absolute inset-0 translate-x-8"
                  }`}
                >
                  <div className="glass-card p-10 rounded-2xl text-center">
                    <svg className="w-8 h-8 text-indigo-500/40 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="text-lg text-slate-200 font-light leading-relaxed mb-8 italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {t.avatar}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentTestimonial ? "bg-indigo-500 w-6" : "bg-slate-700 hover:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 px-6 border-t border-slate-800/40 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 via-purple-950/10 to-indigo-950/20 -z-10" />
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Deploy Your{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Industrial Brain
            </span>
          </h2>
          <p className="text-slate-400 text-base font-light mb-10 max-w-xl mx-auto leading-relaxed">
            Start aggregating, parsing, and linking your engineering knowledge base in minutes. One platform for every asset, every document, every insight.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="https://github.com"
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-500" />
            <span className="font-extrabold text-sm tracking-wider">
              INDUSMIND <span className="text-slate-400">AI</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 font-light">
            © {new Date().getFullYear()} INDUSMIND AI Technologies Inc. All rights reserved.
          </p>

          <div className="flex gap-6 text-xs text-slate-400 font-light">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Standards</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
