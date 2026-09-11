import React from "react";

interface FeedCardSkeletonProps {
  count?: number;
}

export function FeedCardSkeleton({ count = 1 }: FeedCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="feed-card bg-white rounded-[24px] overflow-hidden flex flex-col shadow-sm border border-[#E2E8F0] animate-pulse transition-all duration-300"
        >
          {/* Dual Attribution Header Skeleton */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              {/* Overlapping circular avatars */}
              <div className="flex -space-x-2 relative">
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shrink-0 animate-shimmer" />
                <div className="w-10 h-10 rounded-full bg-slate-300/80 border-2 border-white shrink-0 animate-shimmer" />
              </div>

              <div className="flex flex-col gap-2">
                {/* Cleaner & Reporter Names placeholder */}
                <div className="h-4 w-36 sm:w-44 bg-slate-200 rounded-md animate-shimmer" />
                {/* Timestamp & Location placeholder */}
                <div className="h-3 w-28 bg-slate-200/70 rounded-md animate-shimmer" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-5 w-12 bg-emerald-100/80 rounded-full animate-shimmer" />
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-shimmer" />
            </div>
          </div>

          {/* Media 4:5 Slider Container Skeleton */}
          <div className="relative aspect-[4/5] bg-slate-200/80 animate-shimmer overflow-hidden">
            {/* Center Slider Handle Placeholder */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/60 z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md z-20 flex items-center justify-center border border-white/50">
              <div className="w-4 h-4 rounded-full bg-slate-300" />
            </div>

            {/* BEFORE / AFTER Badge Placeholders */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/20 backdrop-blur-xs rounded-md w-16 h-5" />
            <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-900/20 backdrop-blur-xs rounded-md w-16 h-5" />
          </div>

          {/* Gemini AI Audit Proof Banner Skeleton */}
          <div className="bg-[#00855d]/5 px-5 py-3 border-b border-[#00855d]/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#006948]/15 shrink-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#006948]/30" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-32 bg-[#006948]/20 rounded-md animate-shimmer" />
                <div className="h-2.5 w-24 bg-slate-200 rounded-md animate-shimmer" />
              </div>
            </div>

            <div className="w-20 h-6 bg-[#006948]/20 rounded-full animate-shimmer" />
          </div>

          {/* Action Bar Skeleton */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 animate-shimmer" />
              <div className="w-20 h-4 bg-slate-200 rounded-md animate-shimmer" />
            </div>

            <div className="w-9 h-9 rounded-full bg-slate-100 animate-shimmer" />
          </div>

          {/* Caption Content Skeleton */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-slate-200 rounded-md w-11/12 animate-shimmer" />
              <div className="h-3.5 bg-slate-200/70 rounded-md w-2/3 animate-shimmer" />
            </div>
            <div className="w-24 h-4 bg-emerald-100/80 rounded-md shrink-0 animate-shimmer" />
          </div>
        </article>
      ))}
    </>
  );
}

export default FeedCardSkeleton;
