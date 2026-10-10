"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  MapPin,
  Sparkles,
  ArrowLeft,
  Home,
  Bell,
  Trophy,
  User,
  ShieldCheck,
  Search,
  RotateCcw,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { SafaiWatchLogo } from "@/components/SafaiWatchLogo";
import BottomNav from "@/components/BottomNav";

export default function NotFound() {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.pathname);
    }
  }, []);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleCopyPath = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col justify-between selection:bg-[#85f8c4] selection:text-[#002114] relative overflow-x-hidden">
      {/* Decorative Background Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-[#85f8c4]/30 blur-3xl opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#e2dfff]/40 blur-3xl opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-20 left-1/4 w-80 h-80 rounded-full bg-[#68dba9]/20 blur-3xl opacity-50"
      />

      {/* Top Header */}
      <header className="relative z-20 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
            title="SafaiWatch Home"
          >
            <SafaiWatchLogo variant="full" size="sm" animated={true} />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#006948] border border-emerald-200/70 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00855d] animate-ping inline-block" />
              <span>Civic Grid Active</span>
            </div>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 max-w-4xl mx-auto w-full text-center">
        {/* Animated Visual 404 Radar */}
        <div className="relative mb-6 flex items-center justify-center select-none">
          {/* Backdrop Radar Rings */}
          <div className="absolute w-56 h-56 rounded-full border border-emerald-500/15 animate-ping opacity-30 pointer-events-none" />
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-emerald-500/25 animate-spin pointer-events-none [animation-duration:18s]" />
          <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#85f8c4]/40 to-[#e2dfff]/40 blur-xl pointer-events-none" />

          {/* 404 Number Graphic */}
          <div className="flex items-center justify-center font-extrabold tracking-tighter text-[96px] sm:text-[132px] md:text-[150px] leading-none text-[#003825]">
            <span className="drop-shadow-sm select-none">4</span>

            {/* Central Animated Compass / Radar Spot */}
            <div className="relative mx-1 sm:mx-2 w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white shadow-[0_12px_32px_rgba(0,105,72,0.18)] border-2 border-emerald-300 flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-[#eaedff] opacity-80" />
              
              {/* Radar sweep line */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="w-full h-full origin-bottom-right bg-gradient-to-tr from-transparent via-emerald-400/20 to-[#00855d]/30 animate-spin [animation-duration:4s]" />
              </div>

              {/* Pin Centerpiece */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#006948] to-[#00855d] text-white flex items-center justify-center shadow-md transform transition-transform group-hover:rotate-12 duration-300">
                  <Compass className="w-7 h-7 sm:w-9 sm:h-9 text-[#85f8c4] animate-pulse" />
                </div>
              </div>

              {/* Sparkle badge */}
              <span className="absolute top-2 right-2 text-xs">✨</span>
            </div>

            <span className="drop-shadow-sm select-none">4</span>
          </div>
        </div>

        {/* Civic Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-100/80 text-[#005137] border border-emerald-300/80 shadow-xs mb-4">
          <ShieldCheck className="w-4 h-4 text-[#006948]" />
          <span>Zone Inspected: No Waste or Page Found Here</span>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#131b2e] tracking-tight mb-3">
          Lost in the Grid? <span className="text-[#006948]">Spot Not Found</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed mb-6">
          The civic coordinate or page you requested doesn’t exist on SafaiWatch.
          Either the location was moved, or our civic champions swept it squeaky clean!
        </p>

        {/* Attempted Route Info Box (if non-empty) */}
        {currentUrl && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-mono text-slate-600 max-w-md truncate">
            <span className="text-slate-400">Path:</span>
            <span className="font-semibold text-slate-800 truncate">{currentUrl}</span>
            <button
              onClick={handleCopyPath}
              className="ml-1 text-[11px] font-sans font-medium text-[#006948] hover:underline cursor-pointer"
              title="Copy URL"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10 w-full max-w-md">
          <Link
            href="/"
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#006948] to-[#00855d] text-white font-semibold text-sm shadow-[0_8px_20px_rgba(0,105,72,0.28)] hover:shadow-[0_10px_24px_rgba(0,105,72,0.36)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#85f8c4]" />
            <span>Civic Map</span>
          </Link>

          <Link
            href="/feed"
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-[#006948] font-semibold text-sm shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Community Feed</span>
          </Link>

          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Previous Page</span>
          </button>
        </div>

        {/* Quick Civic Destinations Grid */}
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-left">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Popular Civic Hubs
            </h2>
            <span className="text-[11px] text-emerald-700 font-medium">SafaiWatch Quick Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/"
              className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-[#006948]/50 hover:bg-emerald-50/50 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006948] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-[#006948] transition-colors">
                  Live Cleanliness Map
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pinpoint waste spots, active cleanups & routing
                </p>
              </div>
            </Link>

            <Link
              href="/feed"
              className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-[#006948]/50 hover:bg-emerald-50/50 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#e2dfff] text-[#4b41e1] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-[#4b41e1] transition-colors">
                  Citizen Action Feed
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Before-and-after photos, cheers & comments
                </p>
              </div>
            </Link>

            <Link
              href="/rewards"
              className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-[#006948]/50 hover:bg-emerald-50/50 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                  Eco Rewards Vault
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Redeem civic credits, gift cards & eco badges
                </p>
              </div>
            </Link>

            <Link
              href="/notifications"
              className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-[#006948]/50 hover:bg-emerald-50/50 transition-all flex items-start gap-3 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  Civic Alerts & Updates
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status changes for reported & cleaned spots
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-slate-500 pb-24 sm:pb-8">
        <p>
          SafaiWatch Civic Action Network &bull; Clean Streets, Verified Action
        </p>
      </footer>

      {/* Persistent Bottom Nav on Mobile */}
      <BottomNav />
    </div>
  );
}
