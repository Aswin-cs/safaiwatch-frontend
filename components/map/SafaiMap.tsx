"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { SafaiMapInnerProps } from "./SafaiMapInner";

// Dynamic import with SSR disabled to prevent "window is not defined" errors during server rendering
const SafaiMapInner = dynamic(() => import("./SafaiMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-100 flex flex-col items-center justify-center text-slate-500 rounded-2xl animate-pulse p-6 border border-slate-200">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="font-['Hanken_Grotesk'] text-sm font-bold text-slate-700">
        Loading SafaiWatch Cleanliness Map...
      </p>
      <p className="text-xs text-slate-400 mt-1 font-mono">
        Connecting to OpenStreetMap Tiles & GPS
      </p>
    </div>
  ),
});

export type { Report } from "./SafaiMapInner";

export default function SafaiMap(props: SafaiMapInnerProps) {
  return <SafaiMapInner {...props} />;
}
