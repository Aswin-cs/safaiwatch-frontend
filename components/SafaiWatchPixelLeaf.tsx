"use client";

import React, { useState } from "react";

export interface SafaiWatchPixelLeafProps {
  variant?: "horizontal" | "vertical" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  replayOnClick?: boolean;
  theme?: "light" | "dark";
  className?: string;
}

const sizeConfig = {
  sm: { icon: 28, title: "text-lg", sub: "text-[9px]", gap: "gap-2" },
  md: { icon: 40, title: "text-2xl", sub: "text-[10px]", gap: "gap-3" },
  lg: { icon: 56, title: "text-3xl", sub: "text-xs", gap: "gap-3.5" },
  xl: { icon: 84, title: "text-4xl", sub: "text-sm", gap: "gap-4" },
};

export default function SafaiWatchPixelLeaf({
  variant = "horizontal",
  size = "md",
  animated = true,
  replayOnClick = true,
  theme = "light",
  className = "",
}: SafaiWatchPixelLeafProps) {
  const [key, setKey] = useState<number>(0);
  const cfg = sizeConfig[size];
  const isDark = theme === "dark";

  const triggerReplay = () => {
    if (replayOnClick) setKey((prev) => prev + 1);
  };

  const renderMark = () => (
    <div
      key={key}
      onClick={triggerReplay}
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none transition-transform duration-200 hover:scale-110 active:scale-95`}
      style={{ width: cfg.icon, height: cfg.icon }}
      title="Click to replay pixel draw animation"
    >
      <svg
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ shapeRendering: "crispEdges" }}
      >
        <g className={animated ? "pixel-leaf-container" : ""}>
          {/* Stem */}
          <rect className={`px-vein d-1`} x="92" y="224" width="12" height="12" fill="#006948" />
          <rect className={`px-vein d-2`} x="104" y="212" width="12" height="12" fill="#006948" />
          <rect className={`px-vein d-3`} x="116" y="200" width="12" height="12" fill="#006948" />

          {/* Left Outline */}
          <rect className={`px d-4`} x="104" y="188" width="12" height="12" fill="#006948" />
          <rect className={`px d-5`} x="92" y="176" width="12" height="12" fill="#006948" />
          <rect className={`px d-6`} x="92" y="164" width="12" height="12" fill="#006948" />
          <rect className={`px d-7`} x="92" y="152" width="12" height="12" fill="#006948" />
          <rect className={`px d-8`} x="104" y="140" width="12" height="12" fill="#006948" />
          <rect className={`px d-9`} x="116" y="128" width="12" height="12" fill="#006948" />
          <rect className={`px d-10`} x="128" y="116" width="12" height="12" fill="#006948" />
          <rect className={`px d-11`} x="140" y="104" width="12" height="12" fill="#006948" />
          <rect className={`px d-12`} x="152" y="92" width="12" height="12" fill="#006948" />
          <rect className={`px d-13`} x="176" y="80" width="12" height="12" fill="#006948" />
          <rect className={`px d-14`} x="188" y="68" width="12" height="12" fill="#006948" />

          {/* Tip */}
          <rect className={`px-vein d-15`} x="200" y="56" width="12" height="12" fill="#10B981" />

          {/* Right Outline */}
          <rect className={`px d-16`} x="212" y="68" width="12" height="12" fill="#006948" />
          <rect className={`px d-17`} x="212" y="80" width="12" height="12" fill="#006948" />
          <rect className={`px d-18`} x="212" y="92" width="12" height="12" fill="#006948" />
          <rect className={`px d-19`} x="200" y="104" width="12" height="12" fill="#006948" />
          <rect className={`px d-20`} x="188" y="116" width="12" height="12" fill="#006948" />
          <rect className={`px d-21`} x="176" y="128" width="12" height="12" fill="#006948" />
          <rect className={`px d-22`} x="164" y="140" width="12" height="12" fill="#006948" />
          <rect className={`px d-23`} x="152" y="152" width="12" height="12" fill="#006948" />
          <rect className={`px d-24`} x="140" y="164" width="12" height="12" fill="#006948" />
          <rect className={`px d-24`} x="128" y="176" width="12" height="12" fill="#006948" />

          {/* Center Vein */}
          <rect className={`px-vein d-7`} x="128" y="188" width="12" height="12" fill="#34D399" />
          <rect className={`px-vein d-10`} x="140" y="176" width="12" height="12" fill="#34D399" />
          <rect className={`px-vein d-13`} x="152" y="140" width="12" height="12" fill="#34D399" />
          <rect className={`px-vein d-16`} x="164" y="116" width="12" height="12" fill="#34D399" />
          <rect className={`px-vein d-19`} x="176" y="92" width="12" height="12" fill="#34D399" />
          <rect className={`px-vein d-22`} x="188" y="80" width="12" height="12" fill="#34D399" />
        </g>
      </svg>
    </div>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{renderMark()}</div>;
  }

  if (variant === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center gap-2 group ${className}`}>
        {renderMark()}
        <div className="flex flex-col items-center">
          <span
            className={`font-['Hanken_Grotesk'] ${cfg.title} font-extrabold tracking-tight leading-none ${
              isDark ? "text-white" : "text-[#131b2e]"
            }`}
          >
            Safai<span className="text-[#006948] dark:text-[#68dba9]">Watch</span>
          </span>
          <span
            className={`font-mono ${cfg.sub} font-bold uppercase tracking-widest mt-1 text-[#006948] dark:text-[#85f8c4]`}
          >
            Clean Streets • Verified Action
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center ${cfg.gap} group ${className}`}>
      {renderMark()}
      <div className="flex flex-col">
        <span
          className={`font-['Hanken_Grotesk'] ${cfg.title} font-extrabold tracking-tight leading-none ${
            isDark ? "text-white" : "text-[#131b2e]"
          }`}
        >
          Safai<span className="text-[#006948] dark:text-[#68dba9]">Watch</span>
        </span>
        <span
          className={`font-mono ${cfg.sub} font-bold uppercase tracking-widest mt-0.5 text-[#006948] dark:text-[#85f8c4]`}
        >
          Civic Action &amp; Cleanliness Network
        </span>
      </div>
    </div>
  );
}
