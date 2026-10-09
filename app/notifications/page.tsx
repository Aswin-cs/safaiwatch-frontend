"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Image as ImageIcon,
  X,
  MessageSquareText,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
} from "lucide-react";
import { authApi, profileApi } from "@/lib/api";
import { socket } from "@/lib/socket";
import BottomNav from "@/components/BottomNav";
import {
  getCitizenClaimDefinition,
  getCustomOptionsForClaim,
  getQuickChipsForClaim,
} from "@/lib/citizenClaims";

interface CounterExplanation {
  reason?: string;
  explanation: string;
  imageUrl?: string | null;
  submittedAt?: string | Date | null;
}

interface CivicNotification {
  id: string;
  reportId?: string;
  title: string;
  message: string;
  type: "spot_reported";
  timestamp: string;
  isRead: boolean;
  link?: string;
  linkLabel?: string;
  badgeLabel?: string;
  forWhat?: string;
  reason?: string;
  reasonForSpot?: string;
  reasonForSpotComplete?: string;
  description?: string;
  imageUrl?: string;
  spotAddress?: string;
  spotCategory?: string;
  isSpotIsFake?: boolean;
  spot?: {
    id?: string | null;
    address?: string;
    category?: string;
    image?: string | null;
    isSpotIsFake?: boolean;
  } | null;
  counterExplanation?: CounterExplanation | null;
}

const formatReportReason = (reason?: string | null) => {
  if (!reason) return "Reported for review";
  const map: Record<string, string> = {
    fake_or_ai: "AI Generated or Fake Photo",
    already_cleaned: "Already Cleaned Beforehand",
    inaccessible: "Inaccessible or Private Location",
    wrong_location: "Inaccurate Coordinates / Wrong Location",
    not_completed: "Cleanup Incomplete or Not Cleaned",
    wrong_cleaned_location: "Wrong Cleanup Location",
    other_spam: "Spam or Invalid Content",
  };
  return map[reason] || reason.replace(/_/g, " ");
};

const formatRelativeTime = (dateInput?: string | Date | null) => {
  if (!dateInput) return "Recently";
  const now = new Date();
  const date = new Date(dateInput);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getPresetsForReport = (reasonKey?: string | null, forWhat?: string) => {
  return getCustomOptionsForClaim(reasonKey, forWhat);
};

const getQuickChips = (reasonKey?: string | null, forWhat?: string) => {
  return getQuickChipsForClaim(reasonKey, forWhat);
};

export default function NotificationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("Civilian");
  const [filter, setFilter] = useState<"all" | "spot" | "cleanup" | "unread">("all");
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dispute "What Really Happened?" Modal State
  const [selectedReport, setSelectedReport] = useState<CivicNotification | null>(null);
  const [explanationReason, setExplanationReason] = useState<string>("");
  const [explanationText, setExplanationText] = useState<string>("");
  const [explanationImage, setExplanationImage] = useState<string | null>(null);
  const [showAllStances, setShowAllStances] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await authApi.getMe();
      if (!meRes || !meRes.success || !meRes.user) {
        router.push("/login");
        return;
      }
      if (meRes.user.role) {
        setUserRole(meRes.user.role);
      }

      // Join socket room for user real-time notifications
      const userIdent = meRes.user.username || meRes.user.id || (meRes.user as any)._id;
      if (userIdent) {
        socket.emit("joinUserRoom", { username: String(userIdent), userId: String(userIdent) });
      }

      // Fetch real reports filed against this user's spots
      const notifRes: any = await profileApi.getNotifications().catch(() => null);
      const rawReports: any[] = notifRes?.success && Array.isArray(notifRes.reports) ? notifRes.reports : [];

      const reportItems: CivicNotification[] = rawReports
        .filter((r: any) => !r.isSpotIsFake && !r.spot?.isSpotIsFake)
        .map((r: any, idx: number) => {
        const rawReason = r.reasonForSpot || r.reasonForSpotComplete || r.reason || "other_spam";
        const readableReason = formatReportReason(rawReason);
        const isCompleteReport = r.forWhat === "reportCompleteSpot";
        const title = isCompleteReport
          ? "Cleanup Submission Contested"
          : "Marked Spot Contested by Citizen";
        const msg = isCompleteReport
          ? "A citizen has contested your completed cleanup. Review the dispute details below and submit your side of the story."
          : "A citizen has raised a dispute regarding your marked spot. Review the dispute details below and submit your side of the story.";

        return {
          id: r.id || r.reportId || `report-forme-${idx}`,
          reportId: r.reportId || r.id,
          title,
          message: msg,
          type: "spot_reported",
          timestamp: formatRelativeTime(r.reportAt),
          isRead: false,
          link: r.spot?.id ? `/?spotId=${r.spot.id}` : "/",
          linkLabel: "Inspect Spot",
          badgeLabel: isCompleteReport ? "Cleanup Contested" : "Spot Contested",
          forWhat: r.forWhat,
          reason: readableReason,
          reasonForSpot: r.reasonForSpot,
          reasonForSpotComplete: r.reasonForSpotComplete,
          description: r.description,
          imageUrl: r.imageUrl,
          spotAddress: r.spot?.address,
          spotCategory: r.spot?.category,
          isSpotIsFake: Boolean(r.isSpotIsFake || r.spot?.isSpotIsFake),
          spot: r.spot || null,
          counterExplanation: r.counterExplanation || null,
        };
      });

      setNotifications(reportItems);
    } catch (err) {
      console.warn("Could not load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadNotifications();

    const onSpotReported = (data: any) => {
      if (!data) return;
      const rawReason = data.reason || data.reasonForSpot || data.reasonForSpotComplete;
      const readableReason = formatReportReason(rawReason);
      const isCompleteReport = data.forWhat === "reportCompleteSpot";

      const liveReport: CivicNotification = {
        id: data.reportId || `live-report-${Date.now()}`,
        reportId: data.reportId,
        title: isCompleteReport
          ? "Cleanup Submission Contested"
          : "Marked Spot Contested by Citizen",
        message: isCompleteReport
          ? "A citizen has contested your completed cleanup. Review the dispute details below and submit your side of the story."
          : "A citizen has raised a dispute regarding your marked spot. Review the dispute details below and submit your side of the story.",
        type: "spot_reported",
        timestamp: "Just now",
        isRead: false,
        link: data.spotId ? `/?spotId=${data.spotId}` : "/",
        linkLabel: "Inspect Spot",
        badgeLabel: isCompleteReport ? "Cleanup Contested" : "Spot Contested",
        forWhat: data.forWhat,
        reason: readableReason,
        reasonForSpot: data.reasonForSpot,
        reasonForSpotComplete: data.reasonForSpotComplete,
        description: data.description,
        imageUrl: data.imageUrl,
        counterExplanation: null,
      };

      setNotifications((prev) => [liveReport, ...prev]);
    };

    socket.on("spot:reported", onSpotReported);

    const onReportCountered = (data: any) => {
      if (!data?.reportId) return;
      setNotifications((prev) =>
        prev.filter((n) => n.id !== data.reportId && n.reportId !== data.reportId)
      );
    };
    socket.on("report:countered", onReportCountered);

    return () => {
      socket.off("spot:reported", onSpotReported);
      socket.off("report:countered", onReportCountered);
    };
  }, [loadNotifications]);

  const toggleReadStatus = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleOpenExplanation = (item: CivicNotification) => {
    setIsClosing(false);
    setSelectedReport(item);
    const rawReason = item.reasonForSpot || item.reasonForSpotComplete;
    const claimDef = getCitizenClaimDefinition(rawReason, item.forWhat);

    const defaultReason = item.counterExplanation?.reason || claimDef.recommendedRebuttal;

    setExplanationReason(defaultReason);
    setExplanationText(item.counterExplanation?.explanation || "");
    setExplanationImage(item.counterExplanation?.imageUrl || null);
    setExplanationError(null);
    setShowAllStances(false);
  };

  const handleCloseExplanation = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setSelectedReport(null);
      setIsClosing(false);
      setExplanationText("");
      setExplanationImage(null);
      setExplanationError(null);
      setShowAllStances(false);
    }, 240);
  };

  const handleAddChip = (chipText: string) => {
    setExplanationText((prev) => {
      if (!prev.trim()) return `${chipText}. `;
      if (prev.toLowerCase().includes(chipText.toLowerCase())) return prev;
      return `${prev.trim().replace(/\.$/, "")}, and ${chipText.toLowerCase()}. `;
    });
  };


  const handleSubmitExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    const reportId = selectedReport.reportId || selectedReport.id;
    if (!reportId) {
      setExplanationError("Report ID is missing");
      return;
    }
    if (!explanationText.trim()) {
      setExplanationError("Please enter your explanation to describe what really happened.");
      return;
    }

    setSubmitting(true);
    setExplanationError(null);

    try {
      const res: any = await profileApi.submitReportExplanation({
        reportId,
        reason: explanationReason,
        explanation: explanationText.trim(),
        image: explanationImage || undefined,
      });

      if (res && (res.success || res.status === 200 || res.data)) {
        // Since isSpotIsFake is now true, remove this report notification from the notifications page
        setNotifications((prev) =>
          prev.filter((n) => n.id !== selectedReport.id && n.reportId !== reportId)
        );

        showToast("Counter evidence submitted successfully!");
        handleCloseExplanation();
      } else {
        setExplanationError(res?.message || "Failed to submit explanation");
      }
    } catch (err: any) {
      console.error("Error submitting explanation:", err);
      setExplanationError(err?.message || "Could not submit explanation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (item.isSpotIsFake || item.spot?.isSpotIsFake) return false;
    if (filter === "all") return true;
    if (filter === "spot") return item.forWhat === "reportSpot" || !item.forWhat;
    if (filter === "cleanup") return item.forWhat === "reportCompleteSpot";
    if (filter === "unread") return !item.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (forWhat?: string) => {
    if (forWhat === "reportCompleteSpot") {
      return <ShieldAlert className="w-5 h-5 text-amber-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-rose-600" />;
  };

  const getTypeBadgeStyle = (forWhat?: string) => {
    if (forWhat === "reportCompleteSpot") {
      return "bg-amber-50 text-amber-800 border-amber-200/80";
    }
    return "bg-rose-50 text-rose-800 border-rose-200/80";
  };

  // Preset defense stance computation for modal:
  // Dynamically constructed based on the citizen claim from the report!
  const modalClaimKey = selectedReport ? (selectedReport.reasonForSpot || selectedReport.reasonForSpotComplete) : null;
  const currentClaimDef = selectedReport ? getCitizenClaimDefinition(modalClaimKey, selectedReport.forWhat) : null;
  const modalPresets = currentClaimDef ? currentClaimDef.options : [];
  const primaryPreset = modalPresets.find((p) => p.isRecommended) || modalPresets[0];
  const otherPresets = modalPresets.filter((p) => p.id !== primaryPreset?.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 font-['Inter']">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              title="Return to Map"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Hanken_Grotesk'] text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Alerts & Reports
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Disputes and citizen reports submitted on your civic spots
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 sm:px-6 space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "all", label: `All Reports (${notifications.length})` },
              { id: "spot", label: "Spot Reports" },
              { id: "cleanup", label: "Cleanup Reports" },
              { id: "unread", label: `Unread (${unreadCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filter === tab.id
                  ? "bg-[#006948] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 mx-auto border-3 border-[#006948] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Syncing civic reports…</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3 text-[#006948]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-['Hanken_Grotesk'] text-base font-bold text-slate-800 mb-1">
              No reports found
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
              All clear! No civic disputes or reports have been filed against your spots in this category.
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-xs font-bold text-[#006948] hover:underline cursor-pointer"
              >
                View all reports
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredNotifications.map((item) => {
              const isCleanupReport = item.forWhat === "reportCompleteSpot";

              return (
                <div
                  key={item.id}
                  onClick={() => toggleReadStatus(item.id)}
                  className={`relative group bg-white rounded-3xl border p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                    item.isRead
                      ? "border-slate-200/90 opacity-95"
                      : isCleanupReport
                      ? "border-amber-300/80 bg-gradient-to-br from-amber-50/20 via-white to-white ring-1 ring-amber-200/40"
                      : "border-rose-300/80 bg-gradient-to-br from-rose-50/20 via-white to-white ring-1 ring-rose-200/40"
                  }`}
                >
                  {/* Card Header Row: Icon + Badge + Time + Unread indicator */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                          isCleanupReport
                            ? "bg-amber-50 border-amber-200/80"
                            : "bg-rose-50 border-rose-200/80"
                        }`}
                      >
                        {getTypeIcon(item.forWhat)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.badgeLabel && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${getTypeBadgeStyle(
                                item.forWhat
                              )}`}
                            >
                              {item.badgeLabel}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0 mt-1" />
                    )}
                  </div>

                  {/* Title & Concise Subtitle */}
                  <h4
                    className={`font-['Hanken_Grotesk'] text-base font-extrabold leading-tight mb-1 ${
                      isCleanupReport ? "text-amber-950" : "text-rose-950"
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    {item.message}
                  </p>

                  {/* Unified Dispute Details Card */}
                  <div className="rounded-2xl bg-slate-50/90 border border-slate-200/80 p-3.5 space-y-2.5 mb-3.5">
                    {/* Reason badge & Location in a clean responsive row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isCleanupReport
                            ? "text-amber-900 bg-amber-50 border-amber-200/90"
                            : "text-rose-800 bg-rose-50 border-rose-200/90"
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Dispute Reason: {item.reason}</span>
                      </span>

                      {item.spotAddress && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{item.spotAddress}</span>
                        </span>
                      )}
                    </div>

                    {/* Citizen Note Quote */}
                    {item.description && (
                      <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Citizen's Note
                        </span>
                        <p className="text-xs text-slate-700 italic font-medium leading-snug">
                          "{item.description}"
                        </p>
                      </div>
                    )}

                    {/* Evidence Photo Button */}
                    {item.imageUrl && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(item.imageUrl || null);
                          }}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50/80 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                          <span>View Evidence Photo</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Counter Explanation Section (if already submitted) */}
                  {item.counterExplanation && (
                    <div className="mb-3.5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Your Submitted Defense</span>
                        </span>
                        {item.counterExplanation.submittedAt && (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            {formatRelativeTime(item.counterExplanation.submittedAt)}
                          </span>
                        )}
                      </div>

                      {item.counterExplanation.reason && (
                        <div className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-300/60">
                          Defense: {item.counterExplanation.reason}
                        </div>
                      )}

                      <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-emerald-200/70 leading-relaxed font-medium">
                        "{item.counterExplanation.explanation}"
                      </p>

                      {item.counterExplanation.imageUrl && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(item.counterExplanation?.imageUrl || null);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer shadow-2xs transition-colors hover:bg-emerald-50"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Your Counter Photo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Bottom Actions Row (Always single row, no awkward stacking) */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    {item.link ? (
                      <Link
                        href={item.link}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:translate-x-0.5 transition-all py-1"
                      >
                        <span>{item.linkLabel || "Inspect Spot"}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenExplanation(item);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 active:scale-95 ${
                        item.counterExplanation
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          : "bg-[#006948] hover:bg-[#005238] text-white shadow-emerald-900/15"
                      }`}
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>
                        {item.counterExplanation
                          ? "Edit Defense"
                          : "What Really Happened?"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* "What Really Happened?" Modal Form (Bottom sheet on mobile, centered modal on desktop) */}
      {selectedReport && (
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 ${
            isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
          }`}
          onClick={handleCloseExplanation}
        >
          <div
            className={`relative max-w-lg w-full bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh] ${
              isClosing ? "animate-modal-slide-down" : "animate-modal-slide-up"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200/80 flex items-center justify-center text-[#006948] shadow-2xs">
                  <MessageSquareText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-['Hanken_Grotesk'] text-base font-extrabold text-slate-900 leading-tight">
                    What Really Happened?
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    State your side of the story to resolve this dispute
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseExplanation}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form wrapping scrollable content + sticky footer */}
            <form onSubmit={handleSubmitExplanation} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Context Summary Box */}
                <div className="rounded-2xl bg-amber-500/10 border border-amber-200/70 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Citizen Claim
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                      {currentClaimDef?.claimLabel || currentClaimDef?.title || selectedReport.reason}
                    </span>
                  </div>

                  {selectedReport.description && (
                    <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200/60 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Citizen's Note
                      </span>
                      <p className="italic text-xs text-slate-800 leading-snug font-medium">
                        "{selectedReport.description}"
                      </p>
                    </div>
                  )}

                  {selectedReport.spotAddress && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{selectedReport.spotAddress}</span>
                    </div>
                  )}
                </div>

                {explanationError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{explanationError}</span>
                  </div>
                )}

                {/* Compact Defense Stance Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Select Defense Stance</span>
                    </label>
                    {otherPresets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllStances(!showAllStances)}
                        className="text-[11px] font-semibold text-[#006948] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{showAllStances ? "Show primary only" : `View all options (${otherPresets.length})`}</span>
                        {showAllStances ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {/* Primary Stance Card */}
                    {primaryPreset && (
                      <button
                        type="button"
                        onClick={() => setExplanationReason(primaryPreset.text)}
                        className={`w-full p-3 rounded-2xl text-left transition-all border-2 flex items-start justify-between gap-3 cursor-pointer ${
                          explanationReason === primaryPreset.text
                            ? "bg-emerald-50/90 border-[#006948] text-emerald-950 shadow-2xs ring-1 ring-emerald-500/20"
                            : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Recommended Match
                            </span>
                            <span className="text-xs font-bold text-slate-900">Direct Rebuttal</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-snug">{primaryPreset.text}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            explanationReason === primaryPreset.text
                              ? "border-[#006948] bg-[#006948] text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {explanationReason === primaryPreset.text && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    )}

                    {/* Collapsible Alternative Stances */}
                    {showAllStances && (
                      <div className="pt-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                          Alternative Stances
                        </span>
                        {otherPresets.map((preset) => {
                          const isSelected = explanationReason === preset.text;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setExplanationReason(preset.text)}
                              className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-center justify-between gap-2.5 cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-2xs"
                                  : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/90 text-slate-700"
                              }`}
                            >
                              <span className="text-xs leading-snug">{preset.text}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-[#006948] bg-[#006948] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Explanation Textarea with Quick Add Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Your Explanation & Details <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {explanationText.length} characters
                    </span>
                  </div>

                  {/* Quick-insert suggestion chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-1 scrollbar-none">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
                      Tap to add:
                    </span>
                    {getQuickChips(modalClaimKey, selectedReport.forWhat).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddChip(chip)}
                        className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/80 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Add to explanation"
                      >
                        <Plus className="w-2.5 h-2.5 text-slate-400" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={explanationText}
                    onChange={(e) => setExplanationText(e.target.value)}
                    placeholder="Provide clear details to clarify the situation (e.g. how the area can be reached, surrounding landmarks, or why the citizen report is mistaken)..."
                    className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006948]/30 focus:border-[#006948] placeholder-slate-400 bg-slate-50/50 resize-y"
                    required
                  />
                </div>

              </div>

              {/* STICKY FOOTER (Always visible and accessible) */}
              <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseExplanation}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !explanationText.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#006948] hover:bg-[#005238] shadow-md shadow-emerald-900/15 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Explanation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <h3 className="font-['Hanken_Grotesk'] text-sm font-bold text-slate-900">
                Evidence Photo
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-slate-950 flex items-center justify-center rounded-xl overflow-hidden mt-2">
              <img
                src={previewImage}
                alt="Evidence Photo Preview"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar */}
      <BottomNav
        activeTab="notifications"
        hasUnreadNotifications={unreadCount > 0}
        userRole={userRole}
      />
    </div>
  );
}
