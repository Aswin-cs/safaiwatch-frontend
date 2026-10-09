"use client";

import React, { memo, useState, useEffect } from "react";
import SafaiWatchLogo from "./SafaiWatchLogo";

export interface SplashLoaderProps {
  /** Main headline text */
  title?: string;
  /** Secondary description text */
  subtitle?: string;
  /** Show the animated progress bar */
  showProgress?: boolean;
}

const CIVIC_STATUS_STEPS = [
  "Verifying civic credentials…",
  "Establishing encrypted mesh session…",
  "Syncing geospatial spot telemetry…",
  "Preparing live civic dashboard…",
];

/**
 * World-class, minimalist premium splash screen (inspired by Linear & Stripe).
 * Features a pure floating transparent logo, dynamic ambient bloom,
 * laser-edge progress bar, and real-time civic telemetry.
 */
export const SplashLoader = memo(function SplashLoader({
  title = "SafaiWatch",
  subtitle,
  showProgress = true,
}: SplashLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Dynamic progressive status cycler
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % CIVIC_STATUS_STEPS.length);
    }, 1700);

    // Smooth progressive percentage bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return prev;
        const delta = Math.floor(Math.random() * 9) + 4;
        return Math.min(prev + delta, 96);
      });
    }, 280);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const activeSubtitle = subtitle || CIVIC_STATUS_STEPS[stepIndex];

  return (
    <div
      className="relative flex flex-col items-center justify-between min-h-screen min-h-[100dvh] w-full bg-[#fbfcfd] text-slate-800 overflow-hidden select-none px-6 py-10 font-['Inter']"
      id="splash-loader"
      role="status"
      aria-live="polite"
    >
      {/* ── Background Subtle Ambient Spotlight ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Soft emerald radial bloom */}
        <div className="w-[480px] h-[480px] rounded-full bg-emerald-400/10 blur-[100px] animate-pulse" />
        <div className="absolute w-[280px] h-[280px] rounded-full bg-teal-300/15 blur-[60px]" />

        {/* Ultra-subtle engineering grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── Top Brand Meta / Pill ── */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-[11px] font-semibold text-slate-600 shadow-2xs backdrop-blur-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span className="tracking-wider uppercase font-mono text-[10px]">Civic Intelligence OS</span>
        </div>
      </div>

      {/* ── Center Stage: Transparent Floating Logo & Brand ── */}
      <div className="relative z-10 flex flex-col items-center my-auto max-w-sm w-full">
        {/* Logo Container (NO background color box) */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Ambient soft backlight aura */}
          <div className="absolute w-32 h-32 rounded-full bg-emerald-400/25 blur-2xl pointer-events-none" />

          {/* Gentle breathing ripple rings */}
          <div className="absolute w-28 h-28 rounded-full border border-emerald-500/20 animate-ping opacity-30 pointer-events-none" />
          <div className="absolute w-36 h-36 rounded-full border border-dashed border-emerald-400/25 animate-[spin_12s_linear_infinite] pointer-events-none" />

          {/* Pure Floating Logo with Zero Box/Background */}
          <div className="relative transition-transform duration-500 hover:scale-105 animate-[bounce_3s_ease-in-out_infinite] [animation-duration:4s]">
            <SafaiWatchLogo variant="icon" size="xl" animated={true} />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-1.5">
          {title}
        </h1>

        {/* Dynamic Status Subtitle */}
        <div className="h-8 flex items-center justify-center px-4">
          <p
            key={activeSubtitle}
            className="text-xs text-slate-500 font-medium tracking-normal text-center animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            {activeSubtitle}
          </p>
        </div>

        {/* ── High-End Laser Progress Bar (Linear/Raycast Style) ── */}
        {showProgress && (
          <div className="w-full max-w-[220px] mt-6 space-y-2">
            <div className="relative w-full h-1.5 rounded-full bg-slate-200/90 overflow-hidden p-0 shadow-inner">
              {/* Progress Line */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-[#85f8c4] transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Glowing Leading Head Laser */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 blur-[2px] shadow-[0_0_8px_#34d399]" />
                {/* Traveling Shimmer Light */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
            </div>

            {/* Live Progress Telemetry Indicator */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-semibold px-0.5">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span>SYNCING</span>
              </span>
              <span className="text-emerald-700 font-bold tracking-wider">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Session Footer ── */}
      <div className="relative z-10 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
        <span>SECURE CIVIC MESH • END-TO-END VERIFIED</span>
      </div>
    </div>
  );
});

SplashLoader.displayName = "SplashLoader";
export default SplashLoader;
