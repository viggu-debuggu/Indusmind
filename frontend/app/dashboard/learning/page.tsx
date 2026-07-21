"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import {
  Award,
  CheckCircle2,
  XCircle,
  Edit3,
  Star,
  MessageSquare,
  Upload,
  RefreshCw,
  Sparkles,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ArrowRight
} from "lucide-react";

interface FeedbackRecord {
  id: number;
  uuid: string;
  userId?: number;
  entityType: string;
  entityId?: number;
  feedbackType: string;
  rating?: number;
  comment?: string;
  correctionText?: string;
  evidenceUrl?: string;
  status: string;
  createdAt: string;
}

export default function FeedbackCenterPage() {
  const pathname = usePathname();
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState("Accept");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const subTabs = [
    { name: "Feedback Center", path: "/dashboard/learning" },
    { name: "AI Improvement Dashboard", path: "/dashboard/learning/dashboard" },
    { name: "Learning Analytics", path: "/dashboard/learning/analytics" },
    { name: "Model Evaluation", path: "/dashboard/learning/evaluation" },
    { name: "Knowledge Evolution", path: "/dashboard/learning/evolution" },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fbRes, recRes] = await Promise.all([
        api.get("/api/learning/feedback"),
        api.get("/api/decision/recommendations")
      ]);
      setFeedbacks(fbRes.data || []);
      setRecommendations(recRes.data || []);
    } catch (err) {
      console.error("Failed to load continuous learning feedback", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleValidationAction = async (recId: number, actionType: string) => {
    try {
      setIsSubmitting(true);
      await api.post("/api/learning/feedback", {
        entityType: "Recommendation",
        entityId: recId,
        feedbackType: actionType,
        rating: actionType === "Accept" ? 5 : 2,
        comment: comment || `Engineer marked recommendation as ${actionType}.`,
        correctionText: actionType === "Modify" ? correctionText : null,
        evidenceUrl: evidenceUrl || null
      });

      // Clear form and refresh
      setComment("");
      setCorrectionText("");
      setEvidenceUrl("");
      setSelectedEntityId(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to record engineer feedback", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Engineer Feedback & Validation Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                  Phase 13 Active
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Validate AI recommendations (Accept / Reject / Modify), rate answer precision, and suggest operational corrections.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {subTabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* PENDING RECOMMENDATIONS VALIDATION SECTION */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Pending AI Decision Proposals for Engineer Validation
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mr-3" />
            <span>Loading AI Recommendations...</span>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm text-slate-400">All active AI recommendations have been validated by lead engineers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {recommendations.map((rec) => {
              const isSelected = selectedEntityId === rec.id;
              return (
                <div
                  key={rec.id}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-violet-500/30 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {rec.recommendation_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        Priority: <strong className="text-white">{rec.priority}</strong>
                      </span>
                      <span className="text-xs text-slate-400">
                        Confidence: <strong className="text-emerald-400">{rec.confidence_score}%</strong>
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${rec.status === "Approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {rec.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">{rec.title}</h4>
                    <p className="text-sm text-slate-300 mt-2">{rec.recommended_action}</p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleValidationAction(rec.id, "Accept")}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept Recommendation
                      </button>

                      <button
                        onClick={() => handleValidationAction(rec.id, "Reject")}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Reject Recommendation
                      </button>

                      <button
                        onClick={() => setSelectedEntityId(isSelected ? null : rec.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-4 h-4" /> Modify Action Protocol
                      </button>
                    </div>
                  </div>

                  {/* MODIFICATION FORM OVERLAY */}
                  {isSelected && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-3">
                      <h5 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Engineer Correction Form</h5>

                      <textarea
                        rows={2}
                        placeholder="Suggest modified operational action text..."
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                      />

                      <input
                        type="text"
                        placeholder="Optional comment / rationale..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleValidationAction(rec.id, "Modify")}
                          disabled={isSubmitting}
                          className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all"
                        >
                          Submit Correction
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FEEDBACK HISTORY LOG */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-400" />
          Recent Engineer Feedback & Validation Logs
        </h3>

        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-semibold ${fb.feedbackType === "Accept" ? "bg-emerald-500/10 text-emerald-400" : fb.feedbackType === "Reject" ? "bg-rose-500/10 text-rose-400" : "bg-purple-500/10 text-purple-400"}`}>
                    {fb.feedbackType}
                  </span>
                  <span className="font-bold text-white">{fb.entityType} #{fb.entityId}</span>
                </div>
                <p className="text-slate-300">{fb.comment || "Validation record logged."}</p>
                {fb.correctionText && (
                  <p className="text-violet-400 italic">Correction: "{fb.correctionText}"</p>
                )}
              </div>

              <span className="text-[11px] text-slate-500 font-mono">{fb.createdAt.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
