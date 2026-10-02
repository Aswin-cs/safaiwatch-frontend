"use client";

import React, { useId, memo } from "react";

export interface SafaiWatchLogoProps {
  /** Logo variant layout: 'full' (horizontal with title), 'vertical' (centered stack), or 'icon' (mark only) */
  variant?: "full" | "icon" | "vertical";
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Color theme */
  theme?: "light" | "dark";
  /** Whether to enable SVG animations (eye look/blink, neural signals, gradient pulse) */
  animated?: boolean;
  /** Optional custom className */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

const SIZE_CONFIG = {
  xs: { icon: 26, title: "text-sm", sub: "text-[8px]", gap: "gap-1.5" },
  sm: { icon: 34, title: "text-lg", sub: "text-[9px]", gap: "gap-2.5" },
  md: { icon: 44, title: "text-xl", sub: "text-[10px]", gap: "gap-3" },
  lg: { icon: 56, title: "text-2xl", sub: "text-[11px]", gap: "gap-3.5" },
  xl: { icon: 80, title: "text-3xl", sub: "text-[13px]", gap: "gap-4" },
} as const;

export const SafaiWatchLogo = memo(function SafaiWatchLogo({
  variant = "full",
  size = "md",
  theme = "light",
  animated = true,
  className = "",
  onClick,
}: SafaiWatchLogoProps) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "_");
  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const isDark = theme === "dark";

  const pinGradId = `pinGrad-${uid}`;
  const irisGradId = `irisGrad-${uid}`;
  const glowId = `glow-${uid}`;
  const pinClipId = `pinClip-${uid}`;
  const eyeClipId = `eyeClip-${uid}`;

  const renderIconMark = () => (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none transition-transform duration-300 hover:scale-105 active:scale-95 ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ width: cfg.icon, height: cfg.icon }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        role="img"
        aria-label="SafaiWatch AI Logo"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={pinGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#bef264" />
            <stop offset="0.5" stopColor="#4ade80" />
            <stop offset="1" stopColor="#15803d" />
            {animated && (
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                values="0 .5 .5; 360 .5 .5"
                dur="8s"
                repeatCount="indefinite"
              />
            )}
          </linearGradient>

          <linearGradient id={irisGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ecfccb" />
            <stop offset="1" stopColor="#84cc16" />
          </linearGradient>

          <radialGradient id={glowId} cx="0.5" cy="0.45" r="0.5">
            <stop offset="0" stopColor="#4ade80" stopOpacity="0.45" />
            <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
          </radialGradient>

          <clipPath id={pinClipId}>
            <path d="M100 172 C70 150 46 122 46 86 C46 52 72 30 118 24 C140 40 154 62 154 86 C154 122 130 150 100 172 Z" />
          </clipPath>

          <clipPath id={eyeClipId}>
            <path d="M68 86 Q100 58 132 86 Q100 114 68 86 Z" />
          </clipPath>

          {animated && (
            <style>{`
              @keyframes swBob_${uid} {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes swBlink_${uid} {
                0%, 90%, 100% { transform: scaleY(1); }
                94% { transform: scaleY(0.08); }
              }
              @keyframes swLook_${uid} {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-8px); }
                60% { transform: translateX(8px); }
                80% { transform: translateX(0); }
              }
              @keyframes swNodePulse_${uid} {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.4); }
              }
              @keyframes swBreathe_${uid} {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
              }
              .sw-pin-${uid} {
                opacity: 1;
                transform-box: fill-box;
                transform-origin: center;
                animation: swBob_${uid} 3.2s ease-in-out infinite;
              }
              .sw-glow-${uid} {
                opacity: 0.8;
                transform-box: fill-box;
                transform-origin: center;
                animation: swBreathe_${uid} 3.2s ease-in-out infinite;
              }
              .sw-eye-${uid} {
                transform-box: fill-box;
                transform-origin: center;
                animation: swBlink_${uid} 5s ease-in-out 1.5s infinite;
              }
              .sw-look-${uid} {
                animation: swLook_${uid} 4s ease-in-out 1.2s infinite;
              }
              .sw-node-${uid} {
                transform-box: fill-box;
                transform-origin: center;
                animation: swNodePulse_${uid} 2.4s ease-in-out infinite;
              }
            `}</style>
          )}
        </defs>

        {/* Ambient Glow */}
        <circle
          className={animated ? `sw-glow-${uid}` : ""}
          cx="100"
          cy="90"
          r="80"
          fill={`url(#${glowId})`}
          opacity="0.8"
        />

        {/* Ground Shadow */}
        <ellipse cx="100" cy="180" rx="26" ry="5" fill="#000" opacity="0.35" />

        {/* Pin Leaf Body & Elements */}
        <g className={animated ? `sw-pin-${uid}` : ""}>
          {/* Main Leaf-Pin Shape */}
          <path
            fill={`url(#${pinGradId})`}
            d="M100 172 C70 150 46 122 46 86 C46 52 72 30 118 24 C140 40 154 62 154 86 C154 122 130 150 100 172 Z"
          />

          {/* Leaf Veins as Neural Network */}
          <g clipPath={`url(#${pinClipId})`}>
            <path d="M100 172 Q98 140 100 106" fill="none" stroke="#052e16" strokeOpacity="0.7" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M99 152 Q82 144 70 128" fill="none" stroke="#052e16" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M99 152 Q118 144 130 128" fill="none" stroke="#052e16" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M99 132 Q84 126 62 110" fill="none" stroke="#052e16" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M99 132 Q116 126 138 110" fill="none" stroke="#052e16" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M100 70 Q106 48 118 26" fill="none" stroke="#052e16" strokeOpacity="0.7" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M100 70 Q96 54 80 46" fill="none" stroke="#052e16" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M101 62 Q118 60 134 52" fill="none" stroke="#052e16" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />

            {/* Neural Nodes */}
            <circle className={animated ? `sw-node-${uid}` : ""} cx="70" cy="128" r="2.8" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />
            <circle className={animated ? `sw-node-${uid}` : ""} style={{ animationDelay: "0.4s" }} cx="130" cy="128" r="2.8" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />
            <circle className={animated ? `sw-node-${uid}` : ""} style={{ animationDelay: "0.8s" }} cx="62" cy="110" r="2.8" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />
            <circle className={animated ? `sw-node-${uid}` : ""} style={{ animationDelay: "1.2s" }} cx="138" cy="110" r="2.8" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />
            <circle className={animated ? `sw-node-${uid}` : ""} style={{ animationDelay: "1.6s" }} cx="80" cy="46" r="2.8" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />
            <circle className={animated ? `sw-node-${uid}` : ""} style={{ animationDelay: "2.0s" }} cx="134" cy="52" r="2.8" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />
            <circle className={animated ? `sw-node-${uid}` : ""} style={{ animationDelay: "0.6s" }} cx="100" cy="152" r="2.4" fill="#0f2a14" stroke="#ecfccb" strokeWidth="1.2" />

            {/* Neural Data Signals Travelling along Veins */}
            {animated && (
              <>
                <circle fill="#fff" r="2">
                  <animateMotion dur="2.4s" begin="1.4s" repeatCount="indefinite" path="M100 172 Q98 140 100 106" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="2.4s" begin="1.4s" repeatCount="indefinite" />
                </circle>
                <circle fill="#fff" r="1.8">
                  <animateMotion dur="1.6s" begin="2.0s" repeatCount="indefinite" path="M99 152 Q82 144 70 128" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin="2.0s" repeatCount="indefinite" />
                </circle>
                <circle fill="#fff" r="1.8">
                  <animateMotion dur="1.6s" begin="2.5s" repeatCount="indefinite" path="M99 152 Q118 144 130 128" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin="2.5s" repeatCount="indefinite" />
                </circle>
                <circle fill="#fff" r="1.8">
                  <animateMotion dur="1.8s" begin="1.8s" repeatCount="indefinite" path="M100 70 Q96 54 80 46" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin="1.8s" repeatCount="indefinite" />
                </circle>
                <circle fill="#fff" r="1.8">
                  <animateMotion dur="1.8s" begin="2.6s" repeatCount="indefinite" path="M101 62 Q118 60 134 52" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" begin="2.6s" repeatCount="indefinite" />
                </circle>
                <circle fill="#fff" r="2">
                  <animateMotion dur="2s" begin="2.2s" repeatCount="indefinite" path="M100 70 Q106 48 118 26" />
                  <animate attributeName="opacity" values="0;1;1;0" dur="2s" begin="2.2s" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </g>

          {/* Central AI Eye (SafaiWatch Monitoring) */}
          <g className={animated ? `sw-eye-${uid}` : ""}>
            <path d="M68 86 Q100 58 132 86 Q100 114 68 86 Z" fill="#0f2a14" />
            <g clipPath={`url(#${eyeClipId})`}>
              <circle className={animated ? `sw-look-${uid}` : ""} cx="100" cy="86" r="13" fill={`url(#${irisGradId})`} />
              <circle className={animated ? `sw-look-${uid}` : ""} cx="100" cy="86" r="6" fill="#0f2a14" />
              <circle className={animated ? `sw-look-${uid}` : ""} cx="104" cy="82" r="2.2" fill="#fff" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {renderIconMark()}
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center gap-2 group ${className}`}>
        {renderIconMark()}
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
            Clean Streets • AI Verified Action
          </span>
        </div>
      </div>
    );
  }

  // Default: Horizontal / Full
  return (
    <div className={`flex items-center ${cfg.gap} group ${className}`}>
      {renderIconMark()}
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
});

SafaiWatchLogo.displayName = "SafaiWatchLogo";
export default SafaiWatchLogo;
