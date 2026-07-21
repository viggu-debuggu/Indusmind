"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  ArrowLeft,
  FileText,
  BookOpen,
  Code,
  Database,
  GitBranch,
  Server,
  Download,
  CheckCircle2
} from "lucide-react";

export default function DeveloperCenterPage() {
  const [activeTab, setActiveTab] = useState("architecture");

  const docs = [
    { id: "architecture", title: "Enterprise System Architecture", file: "ENTERPRISE_ARCHITECTURE.md", icon: Server },
    { id: "api", title: "API Documentation & Endpoints", file: "API_DOCUMENTATION.md", icon: Code },
    { id: "database", title: "Database Schema Documentation", file: "DATABASE_SCHEMA.md", icon: Database },
    { id: "graph", title: "Knowledge Graph Specification", file: "KNOWLEDGE_GRAPH_SPEC.md", icon: GitBranch },
    { id: "developer", title: "Developer Setup Guide", file: "DEVELOPER_GUIDE.md", icon: Terminal },
    { id: "deployment", title: "Production Deployment Guide", file: "DEPLOYMENT_GUIDE.md", icon: Server },
    { id: "admin", title: "Platform Administration Guide", file: "ADMINISTRATION_GUIDE.md", icon: BookOpen },
    { id: "user", title: "User Guide & Feature Walkthrough", file: "USER_GUIDE.md", icon: FileText },
    { id: "troubleshooting", title: "Troubleshooting & Diagnostics", file: "TROUBLESHOOTING_GUIDE.md", icon: BookOpen }
  ];

  const docContent: Record<string, string> = {
    architecture: `# INDUSMIND AI - Enterprise System Architecture

## Architectural Principles
1. **Modular Extension Paradigm**: Decoupled domain services with standard repository patterns.
2. **Multi-Tier Performance Caching**: In-memory LRU stores for responses, vector embeddings, graph entities, and recommendations.
3. **Observability & Request Tracing**: End-to-end telemetry with structured logging and X-Request-ID headers.
4. **Hybrid Storage**: PostgreSQL 16 with pgvector extension for structured data and similarity search.
5. **Role-Based Access Control**: RBAC across Super Admin, Admin, Manager, Engineer, Auditor, Technician, and Viewer.`,
    api: `# INDUSMIND AI - API Specification & Endpoint Reference

## Authentication & Headers
All requests require: Authorization: Bearer <your_jwt_token>

## Key API Endpoints
- GET /api/v1/enterprise/readiness: Overall readiness score and status
- GET /api/v1/enterprise/health: Subsystem health pulse
- GET /api/v1/enterprise/performance: Cache hit rates & pool statistics
- GET /api/v1/enterprise/security: Security audit rating & event log
- GET /api/v1/enterprise/monitoring: Latency percentiles & request tracing
- GET /api/v1/enterprise/export/{format}: Export PDF, Excel, CSV reports`,
    database: `# INDUSMIND AI - Database Schema Documentation

## Database Engine
- PostgreSQL 16 with pgvector extension (0.6.0)
- SQLAlchemy 2.0 ORM with Alembic migrations

## Key Tables
- users, refresh_tokens, organizations, plants, departments
- documents, document_chunks (vector(384) embeddings)
- equipment, sensor_readings, maintenance_predictions
- agent_executions, agent_memories, knowledge_twins, executive_reports`,
    graph: `# INDUSMIND AI - Knowledge Graph Specification

## Entity Types
Equipment, Component, FailureMode, RootCause, SOP, Regulation

## Relationship Predicates
HAS_COMPONENT, EXHIBITS_FAILURE_MODE, CAUSED_BY, RESOLVED_BY, GOVERNED_BY`,
    developer: `# Developer Setup Guide

1. Install Python 3.11+ and Node.js 18+
2. cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
3. cd frontend && npm install && npm run dev`,
    deployment: `# Production Deployment Guide

1. Run docker-compose up -d --build
2. Verify with python docker/verify_enterprise_production.py`,
    admin: `# Administration Guide

Manage platform roles, inspect security audit logs, flush system caches, and verify backups.`,
    user: `# User Guide

Explore AI Copilot, Predictive Maintenance, Knowledge Graph, Decision Intelligence, and Enterprise Hub.`,
    troubleshooting: `# Troubleshooting Guide

Inspect system health center, verify database connection, check P95 latency percentiles.`
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/enterprise" className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-6 h-6 text-sky-500" />
              Developer & Documentation Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive architecture specs, API endpoint reference, database documentation, and manuals.
            </p>
          </div>
        </div>
      </div>

      {/* DOCUMENTATION INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">Documentation Suite</p>
          {docs.map((d) => {
            const Icon = d.icon;
            const isActive = activeTab === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setActiveTab(d.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{d.title}</span>
              </button>
            );
          })}
        </div>

        {/* DOCUMENT VIEWER */}
        <div className="lg:col-span-3 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {docs.find((d) => d.id === activeTab)?.title}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              docs/{docs.find((d) => d.id === activeTab)?.file}
            </span>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed border border-slate-800">
            {docContent[activeTab] || "Select a document to read."}
          </pre>
        </div>
      </div>
    </div>
  );
}
