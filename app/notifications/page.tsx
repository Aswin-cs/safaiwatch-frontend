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
} from "lucide-react";
import { authApi, profileApi } from "@/lib/api";
import { socket } from "@/lib/socket";
import BottomNav from "@/components/BottomNav";

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

const REASON_FOR_SPOT_MAP: Record<string, { label: string; defense: string }> = {
  fake_or_ai: {
    label: "AI Generated or Fake Photo",
    defense: "Photo is 100% genuine and taken live on-site (not AI or fake)",
  },
  already_cleaned: {
    label: "Already Cleaned Beforehand",
    defense: "Spot was not cleaned beforehand; accumulated waste was present when reported",
  },
  inaccessible: {
    label: "Inaccessible or Private Location",
    defense: "Spot is publicly accessible along the civic path, not private property",
  },
  wrong_location: {
    label: "Inaccurate Coordinates / Wrong Location",
    defense: "Coordinates match the exact physical location where waste was spotted",
  },
  other_spam: {
    label: "Spam or Invalid Content",
    defense: "Legitimate civic issue reported in good faith, not spam",
  },
};

const EXPLANATION_PRESETS = [
  { key: "fake_or_ai", text: "Photo is 100% genuine and taken live on-site (not AI or fake)" },
  { key: "already_cleaned", text: "Waste was present on-site; was not cleaned beforehand" },
  { key: "inaccessible", text: "Location is fully accessible to public and clean rangers" },
  { key: "wrong_location", text: "GPS pin and coordinates accurately mark the spot" },
  { key: "other_spam", text: "Authentic civic report, not spam or fake contest" },
  { key: "other", text: "Other custom explanation" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("Civilian");
  const [filter, setFilter] = useState<"all" | "spot" | "cleanup" | "unread">("all");
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Dispute "What Really Happened?" Modal State
  const [selectedReport, setSelectedReport] = useState<CivicNotification | null>(null);
  const [explanationReason, setExplanationReason] = useState<string>(EXPLANATION_PRESETS[0].text);
  const [explanationText, setExplanationText] = useState<string>("");
  const [explanationImage, setExplanationImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      // Fetch real reports filed against this user's spots (UserStatus.reportForme populated without exposing reporter userId)
      const notifRes: any = await profileApi.getNotifications().catch(() => null);
      const rawReports: any[] = notifRes?.success && Array.isArray(notifRes.reports) ? notifRes.reports : [];

      const reportItems: CivicNotification[] = rawReports.map((r: any, idx: number) => {
        const rawReason = r.reasonForSpot || r.reasonForSpotComplete || r.reason || "other_spam";
        const readableReason = formatReportReason(rawReason);
        const isCompleteReport = r.forWhat === "reportCompleteSpot";
        const title = isCompleteReport
          ? "Cleanup Report Filed on Spot"
          : "Marked Spot Reported by Citizen";
        const msg = `Your ${isCompleteReport ? "cleanup submission" : "marked spot"} was reported for: ${readableReason}.${
          r.description ? ` Details: "${r.description}"` : ""
        }`;

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
          counterExplanation: r.counterExplanation || null,
        };
      });

      // Display exclusively real reports from UserStatus.reportForme
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
          ? "Cleanup Report Filed on Spot"
          : "Marked Spot Reported by Citizen",
        message:
          data.message ||
          `Your spot was reported for: ${readableReason}.${data.description ? ` Details: "${data.description}"` : ""}`,
        type: "spot_reported",
        timestamp: "Just now",
        isRead: false,
        link: data.spotId ? `/?spotId=${data.spotId}` : "/",
        linkLabel: "Inspect Spot",
        badgeLabel: "New Report",
        forWhat: data.forWhat,
        reason: readableReason,
        description: data.description,
        imageUrl: data.imageUrl,
        counterExplanation: null,
      };

      setNotifications((prev) => [liveReport, ...prev]);
    };

    socket.on("spot:reported", onSpotReported);
    return () => {
      socket.off("spot:reported", onSpotReported);
    };
  }, [loadNotifications]);

  const toggleReadStatus = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleOpenExplanation = (item: CivicNotification) => {
    setSelectedReport(item);
    const defaultReason =
      item.counterExplanation?.reason ||
      (item.reasonForSpot && REASON_FOR_SPOT_MAP[item.reasonForSpot]
        ? REASON_FOR_SPOT_MAP[item.reasonForSpot].defense
        : EXPLANATION_PRESETS[0].text);
    setExplanationReason(defaultReason);
    setExplanationText(item.counterExplanation?.explanation || "");
    setExplanationImage(item.counterExplanation?.imageUrl || null);
    setExplanationError(null);
  };

  const handleCloseExplanation = () => {
    setSelectedReport(null);
    setExplanationText("");
    setExplanationImage(null);
    setExplanationError(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setExplanationError("Image size must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setExplanationImage(reader.result as string);
      setExplanationError(null);
    };
    reader.readAsDataURL(file);
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
      setExplanationError("Please enter what really happened.");
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
        const updatedCounter: CounterExplanation = res.data?.counterExplanation || {
          reason: explanationReason,
          explanation: explanationText.trim(),
          imageUrl: explanationImage,
          submittedAt: new Date().toISOString(),
        };

        // Update local state immediately
        setNotifications((prev) =>
          prev.map((n) => {
            const isMatch = n.id === selectedReport.id || n.reportId === reportId;
            if (isMatch) {
              return {
                ...n,
                counterExplanation: updatedCounter,
              };
            }
            return n;
          })
        );

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
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 font-['Inter']">
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
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-600 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Disputes and reports submitted on your civic spots
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
          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const isCleanupReport = item.forWhat === "reportCompleteSpot";

              return (
                <div
                  key={item.id}
                  onClick={() => toggleReadStatus(item.id)}
                  className={`relative group bg-white rounded-2xl border p-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                    item.isRead
                      ? "border-slate-200/90 opacity-95"
                      : isCleanupReport
                      ? "border-amber-300 bg-gradient-to-r from-amber-50/40 to-white ring-1 ring-amber-200/50"
                      : "border-rose-300 bg-gradient-to-r from-rose-50/40 to-white ring-1 ring-rose-200/50"
                  }`}
                >
                  {!item.isRead && (
                    <div
                      className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                        isCleanupReport ? "bg-amber-500 animate-pulse" : "bg-rose-600 animate-pulse"
                      }`}
                    />
                  )}

                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        isCleanupReport
                          ? "bg-amber-50 border-amber-200"
                          : "bg-rose-50 border-rose-200"
                      }`}
                    >
                      {getTypeIcon(item.forWhat)}
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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

                      <h4
                        className={`font-['Hanken_Grotesk'] text-sm font-bold leading-tight mb-1 ${
                          isCleanupReport ? "text-amber-950" : "text-rose-950"
                        }`}
                      >
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed mb-2">
                        {item.message}
                      </p>

                      {/* Detailed Section for Reported Spot */}
                      <div className="my-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                              isCleanupReport
                                ? "text-amber-800 bg-amber-50 border-amber-200"
                                : "text-rose-700 bg-rose-50 border-rose-200"
                            }`}
                          >
                            Dispute Reason: {item.reason}
                          </span>
                          {item.reasonForSpot && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                              reasonForSpot: {item.reasonForSpot}
                            </span>
                          )}
                          {item.reasonForSpotComplete && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                              reasonForSpotComplete: {item.reasonForSpotComplete}
                            </span>
                          )}
                          {item.spotAddress && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[220px]">{item.spotAddress}</span>
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-normal">
                            <span className="font-semibold text-slate-900">Reporter's Note:</span>{" "}
                            {item.description}
                          </p>
                        )}

                        {item.imageUrl && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(item.imageUrl || null);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>View Evidence Photo</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Counter Explanation Section (if already submitted) */}
                      {item.counterExplanation && (
                        <div className="my-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Your Explanation:
                            </span>
                            {item.counterExplanation.submittedAt && (
                              <span className="text-[10px] text-emerald-700 font-medium">
                                {formatRelativeTime(item.counterExplanation.submittedAt)}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-100 leading-relaxed font-medium">
                            "{item.counterExplanation.explanation}"
                          </p>

                          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                            {item.counterExplanation.reason && (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200/60">
                                {item.counterExplanation.reason}
                              </span>
                            )}
                            {item.counterExplanation.imageUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(item.counterExplanation?.imageUrl || null);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200 cursor-pointer shadow-2xs"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>View Your Counter Photo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Card Action Row: Inspect Spot and "What Really Happened?" Button */}
                      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100">
                        {item.link ? (
                          <Link
                            href={item.link}
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1 text-xs font-bold transition-transform hover:translate-x-0.5 ${
                              isCleanupReport
                                ? "text-amber-800 hover:text-amber-900"
                                : "text-rose-700 hover:text-rose-800"
                            }`}
                          >
                            <span>{item.linkLabel || "Inspect Spot"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            item.counterExplanation
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                              : "bg-[#006948] hover:bg-[#005238] text-white shadow-emerald-900/10 active:scale-95"
                          }`}
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                          <span>
                            {item.counterExplanation
                              ? "Update Explanation"
                              : "What Really Happened?"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* "What Really Happened?" Modal Popup Form */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-enter"
          onClick={handleCloseExplanation}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-[#006948]">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Hanken_Grotesk'] text-base font-extrabold text-slate-900 leading-tight">
                    What Really Happened?
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    State your side of the story for this dispute
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseExplanation}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitExplanation} className="p-5 overflow-y-auto space-y-4">
              {/* Context Summary Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                    <span>Reported Reason: {selectedReport.reason}</span>
                  </div>
                  {selectedReport.reasonForSpot && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300">
                      reasonForSpot: {selectedReport.reasonForSpot}
                    </span>
                  )}
                  {selectedReport.reasonForSpotComplete && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300">
                      reasonForSpotComplete: {selectedReport.reasonForSpotComplete}
                    </span>
                  )}
                </div>
                {selectedReport.description && (
                  <p className="text-amber-800 text-[11px] italic bg-white/70 p-2 rounded-lg border border-amber-100">
                    "{selectedReport.description}"
                  </p>
                )}
                {selectedReport.spotAddress && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-800/80">
                    <MapPin className="w-3 h-3 text-amber-600" />
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

              {/* Quick Reason Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Select Quick Reason / Category (reasonForSpot)
                  </label>
                  {selectedReport.reasonForSpot && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Reported as: <code className="font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">{selectedReport.reasonForSpot}</code>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXPLANATION_PRESETS.map((preset) => {
                    const isSelected = explanationReason === preset.text;
                    const isReportedEnum = selectedReport.reasonForSpot === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setExplanationReason(preset.text)}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all text-left cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#006948] text-white shadow-xs"
                            : isReportedEnum
                            ? "bg-rose-50 text-rose-900 border border-rose-300 font-semibold hover:bg-rose-100"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                        }`}
                      >
                        {isReportedEnum && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                        <span>{preset.text}</span>
                        {preset.key !== "other" && (
                          <span className={`text-[9px] font-mono px-1 rounded ${isSelected ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"}`}>
                            {preset.key}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Explanation Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Explanation / Story <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={explanationText}
                  onChange={(e) => setExplanationText(e.target.value)}
                  placeholder="Explain what really happened when you visited or marked this spot. Include details like the time of day, surroundings, or reasons why the citizen report is mistaken..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#006948]/30 focus:border-[#006948] placeholder-slate-400 bg-slate-50/50 resize-y"
                  required
                />
              </div>

              {/* Counter Evidence Photo (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Counter Evidence Photo (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {explanationImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                    <img
                      src={explanationImage}
                      alt="Counter Evidence Preview"
                      className="w-full max-h-48 object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExplanationImage(null)}
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>Upload Counter Photo / Proof</span>
                  </button>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Upload an authentic photo confirming the spot or clearing up the report (max 5MB).
                </p>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseExplanation}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#006948] hover:bg-[#005238] shadow-sm disabled:opacity-50 transition-all cursor-pointer active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit Explanation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-enter"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <h3 className="font-['Hanken_Grotesk'] text-sm font-bold text-slate-900">
                Report Proof Photo
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
                alt="Report Evidence"
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
