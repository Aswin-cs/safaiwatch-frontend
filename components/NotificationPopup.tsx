"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Sparkles, X, ArrowRight } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info" | "ai_audit";

export interface NotificationPopupProps {
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number; // Duration in ms (default 5000ms)
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  position?: "top-center" | "top-right" | "bottom-right";
  icon?: React.ReactNode;
}

export default function NotificationPopup({
  type = "info",
  title,
  message,
  duration = 5000,
  onClose,
  actionLabel,
  onAction,
  position = "top-center",
  icon,
}: NotificationPopupProps) {
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    if (!duration || duration <= 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Determine styles & icons based on type
  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-white/95 dark:bg-[#0F172A]/95",
          border: "border-emerald-500/40 dark:border-emerald-500/50",
          glow: "shadow-[0_16px_40px_-8px_rgba(16,185,129,0.25)]",
          accentColor: "from-emerald-500 to-teal-600",
          iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          badgeText: "SUCCESS",
          timerBg: "bg-emerald-500",
          defaultIcon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case "ai_audit":
        return {
          bg: "bg-white/95 dark:bg-[#0F172A]/95",
          border: "border-[#006948]/50 dark:border-[#85f8c4]/40",
          glow: "shadow-[0_16px_40px_-8px_rgba(0,105,72,0.3)]",
          accentColor: "from-[#006948] to-[#00855d]",
          iconBg: "bg-[#006948]/10 text-[#006948] dark:text-[#85f8c4] border-[#006948]/20",
          badgeBg: "bg-[#85f8c4]/30 text-[#006948] dark:bg-[#006948]/40 dark:text-[#85f8c4] border-[#006948]/30",
          badgeText: "AI AUDIT VERIFIED",
          timerBg: "bg-[#006948]",
          defaultIcon: <Sparkles className="w-5 h-5 text-[#006948] dark:text-[#85f8c4] animate-pulse" />,
        };
      case "error":
        return {
          bg: "bg-white/95 dark:bg-[#0F172A]/95",
          border: "border-rose-500/40 dark:border-rose-500/50",
          glow: "shadow-[0_16px_40px_-8px_rgba(244,63,94,0.25)]",
          accentColor: "from-rose-500 to-red-600",
          iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          badgeBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          badgeText: "ALERT",
          timerBg: "bg-rose-500",
          defaultIcon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        };
      case "warning":
        return {
          bg: "bg-white/95 dark:bg-[#0F172A]/95",
          border: "border-amber-500/40 dark:border-amber-500/50",
          glow: "shadow-[0_16px_40px_-8px_rgba(245,158,11,0.25)]",
          accentColor: "from-amber-500 to-orange-600",
          iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          badgeText: "NOTICE",
          timerBg: "bg-amber-500",
          defaultIcon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        };
      default:
        return {
          bg: "bg-white/95 dark:bg-[#0F172A]/95",
          border: "border-blue-500/40 dark:border-blue-500/50",
          glow: "shadow-[0_16px_40px_-8px_rgba(59,130,246,0.25)]",
          accentColor: "from-blue-500 to-indigo-600",
          iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          badgeText: "NOTIFICATION",
          timerBg: "bg-blue-500",
          defaultIcon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        };
    }
  };

  const config = getConfig();

  const positionClasses = {
    "top-center": "top-20 left-1/2 -translate-x-1/2",
    "top-right": "top-20 right-4 sm:right-6",
    "bottom-right": "bottom-6 right-4 sm:right-6",
  }[position];

  return (
    <div
      className={`fixed z-[999] w-[92vw] max-w-md backdrop-blur-2xl rounded-2xl p-4 border shadow-2xl transition-all duration-300 ease-out select-none ${
        positionClasses
      } ${config.bg} ${config.border} ${config.glow} ${
        isClosing
          ? "opacity-0 -translate-y-4 scale-95 pointer-events-none"
          : "animate-notification-pop opacity-100 translate-y-0 scale-100"
      }`}
    >
      {/* Decorative top accent gradient bar */}
      <div className={`absolute top-0 left-6 right-6 h-[2.5px] rounded-full bg-gradient-to-r ${config.accentColor}`} />

      <div className="flex items-start justify-between gap-3 pt-1">
        {/* Left Side: Icon & Content */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Animated Icon Badge */}
          <div className="relative shrink-0 mt-0.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${config.iconBg}`}>
              {icon || config.defaultIcon}
            </div>
            <div className="absolute inset-0 rounded-xl bg-current opacity-20 animate-ping pointer-events-none" />
          </div>

          {/* Text Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border tracking-wider uppercase ${config.badgeBg}`}>
                {config.badgeText}
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
                JUST NOW
              </span>
            </div>

            {title && (
              <h4 className="font-['Hanken_Grotesk'] text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">
                {title}
              </h4>
            )}

            <p className="font-['Inter'] text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {message}
            </p>

            {actionLabel && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#006948] dark:text-[#85f8c4] hover:underline cursor-pointer group"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Dismiss Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer shrink-0 active:scale-90"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Smooth Timer Bar */}
      {duration > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-[3px] rounded-full overflow-hidden mt-3.5">
          <div
            className={`h-full ${config.timerBg}`}
            style={{
              animation: `notificationTimerBar ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
