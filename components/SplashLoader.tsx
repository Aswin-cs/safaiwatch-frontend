"use client";

import React from "react";
import { Shield } from "lucide-react";

interface SplashLoaderProps {
  /** Main headline text */
  title?: string;
  /** Secondary description text */
  subtitle?: string;
  /** Show the animated progress bar */
  showProgress?: boolean;
}

/**
 * Premium branded splash/loading screen for SafaiWatch.
 *
 * Features:
 * - Breathing shield logo with gradient
 * - Orbital spinning dots (dual-ring)
 * - Expanding ripple pulse rings
 * - Animated progress bar with shimmer
 * - Staggered text reveal with blur-to-focus transition
 * - Subtle dot-grid background pattern
 */
export default function SplashLoader({
  title = "SafaiWatch",
  subtitle = "Preparing your civic dashboard…",
  showProgress = true,
}: SplashLoaderProps) {
  return (
    <div className="splash-screen" id="splash-loader">
      {/* ── Animated Logo Assembly ── */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Ripple rings */}
        <div className="splash-ripple" />
        <div className="splash-ripple" />
        <div className="splash-ripple" />

        {/* Outer orbital ring */}
        <div className="splash-orbit">
          <div className="splash-orbit-dot" />
          <div className="splash-orbit-dot" />
          <div className="splash-orbit-dot" />
          <div className="splash-orbit-dot" />
        </div>

        {/* Inner orbital ring (counter-rotating) */}
        <div className="splash-orbit-inner">
          <div className="splash-orbit-dot splash-orbit-dot-sm" />
          <div className="splash-orbit-dot splash-orbit-dot-sm" />
          <div className="splash-orbit-dot splash-orbit-dot-sm" />
        </div>

        {/* Shield logo */}
        <div className="splash-logo">
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#00855d] to-transparent opacity-50" />
          <Shield className="w-10 h-10 text-[#85f8c4] z-10 drop-shadow-[0_0_10px_rgba(133,248,196,0.9)]" />
        </div>
      </div>

      {/* ── Text Block ── */}
      <h1 className="splash-title font-['Hanken_Grotesk'] text-2xl font-extrabold tracking-tight text-[#131b2e] text-center">
        {title}
      </h1>
      <p className="splash-subtitle font-['Inter'] text-sm text-[#3d4a42] mt-1.5 text-center max-w-[280px]">
        {subtitle}
      </p>

      {/* ── Progress Bar ── */}
      {showProgress && (
        <div className="splash-progress-track splash-hint">
          <div className="splash-progress-fill" />
        </div>
      )}

      {/* ── Hint Badge ── */}
      <div className="splash-hint mt-5 flex items-center gap-2">
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] uppercase tracking-widest font-bold">
          Civic Action Network
        </span>
        <span className="inline-loader">
          <span className="inline-loader-dot" />
          <span className="inline-loader-dot" />
          <span className="inline-loader-dot" />
        </span>
      </div>
    </div>
  );
}
