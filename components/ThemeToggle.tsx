"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  /** Visual display style */
  variant?: "pill" | "icon" | "button";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Show text label */
  showLabel?: boolean;
  /** Optional custom CSS classes */
  className?: string;
}

export default function ThemeToggle({
  variant = "pill",
  size = "md",
  showLabel = false,
  className = "",
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(25);
      } catch (_) {}
    }
  };

  const handleClick = () => {
    triggerHaptic();
    toggleTheme();
  };

  // Avoid hydration mismatch by rendering neutral skeleton placeholder before mount
  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-slate-200/50 ${
          size === "sm" ? "w-8 h-8" : "w-9 h-9"
        } ${className}`}
        aria-hidden="true"
      />
    );
  }

  // Variant 1: Compact Icon-only button (Round)
  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        type="button"
        aria-label={isDark ? "Switch to Day theme" : "Switch to Night theme"}
        title={isDark ? "Switch to Day theme" : "Switch to Night theme"}
        className={`relative inline-flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
          isDark
            ? "bg-slate-800 text-amber-300 border border-slate-700/80 hover:bg-slate-700 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
            : "bg-white text-amber-500 border border-slate-200/90 hover:bg-slate-50 shadow-xs hover:shadow-sm"
        } active:scale-90 ${
          size === "sm"
            ? "w-8 h-8"
            : size === "lg"
            ? "w-11 h-11"
            : "w-9 h-9"
        } ${className}`}
      >
        <span
          className={`transform transition-transform duration-300 ${
            isDark ? "rotate-[-20deg] scale-100" : "rotate-0 scale-100"
          }`}
        >
          {isDark ? (
            <Moon className={size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-4.5 h-4.5"} />
          ) : (
            <Sun className={size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-4.5 h-4.5"} />
          )}
        </span>
      </button>
    );
  }

  // Variant 2: Interactive Day / Night Pill Slider
  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={isDark ? "Switch to Day theme" : "Switch to Night theme"}
      title={isDark ? "Currently Night (Click for Day)" : "Currently Day (Click for Night)"}
      className={`group relative inline-flex items-center rounded-full p-1 transition-all duration-300 select-none cursor-pointer ${
        isDark
          ? "bg-slate-900 border border-slate-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          : "bg-slate-100 border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
      } ${
        size === "sm"
          ? "h-7.5 px-1 min-w-[56px]"
          : size === "lg"
          ? "h-10 px-1.5 min-w-[76px]"
          : "h-8.5 px-1 min-w-[66px]"
      } ${className}`}
    >
      {/* Sliding indicator dot */}
      <span
        className={`absolute top-1 rounded-full transition-all duration-300 flex items-center justify-center shadow-md ${
          isDark
            ? "left-[calc(100%-28px)] bg-indigo-950 text-indigo-300 border border-indigo-700/50 shadow-[0_0_10px_rgba(129,140,248,0.35)]"
            : "left-1 bg-white text-amber-500 border border-amber-200/60 shadow-xs"
        } ${
          size === "sm"
            ? "w-5.5 h-5.5 left-1 " + (isDark ? "left-[calc(100%-25px)]" : "left-1")
            : size === "lg"
            ? "w-7.5 h-7.5 " + (isDark ? "left-[calc(100%-34px)]" : "left-1.5")
            : "w-6.5 h-6.5 " + (isDark ? "left-[calc(100%-30px)]" : "left-1")
        }`}
      >
        {isDark ? (
          <Moon className={`${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} transition-transform duration-300 group-hover:-rotate-12`} />
        ) : (
          <Sun className={`${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} transition-transform duration-300 group-hover:rotate-45 text-amber-500`} />
        )}
      </span>

      {/* Background Icons (Sun on Left, Moon on Right) */}
      <div className="w-full flex items-center justify-between px-1.5 pointer-events-none text-slate-400">
        <Sun
          className={`${
            size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"
          } transition-opacity duration-200 ${
            !isDark ? "opacity-0" : "opacity-60 text-slate-400"
          }`}
        />
        <Moon
          className={`${
            size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"
          } transition-opacity duration-200 ${
            isDark ? "opacity-0" : "opacity-50 text-slate-400"
          }`}
        />
      </div>

      {showLabel && (
        <span
          className={`ml-1.5 text-xs font-semibold uppercase tracking-wider ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {isDark ? "Night" : "Day"}
        </span>
      )}
    </button>
  );
}
