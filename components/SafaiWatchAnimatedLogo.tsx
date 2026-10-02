"use client";

import React, { memo } from "react";
import SafaiWatchLogo, { SafaiWatchLogoProps } from "./SafaiWatchLogo";

export interface SafaiWatchAnimatedLogoProps {
  /** Logo variant layout: 'horizontal' (for headers), 'vertical' (centered stack), or 'icon' (mark only) */
  variant?: "horizontal" | "vertical" | "icon";
  /** Predefined size scale */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether animations run */
  animated?: boolean;
  /** Dark mode flag */
  theme?: "light" | "dark";
  /** Optional extra CSS classes */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

export const SafaiWatchAnimatedLogo = memo(function SafaiWatchAnimatedLogo({
  variant = "horizontal",
  size = "md",
  animated = true,
  theme = "light",
  className = "",
  onClick,
}: SafaiWatchAnimatedLogoProps) {
  const mappedVariant: SafaiWatchLogoProps["variant"] =
    variant === "horizontal" ? "full" : variant;

  return (
    <SafaiWatchLogo
      variant={mappedVariant}
      size={size}
      animated={animated}
      theme={theme}
      className={className}
      onClick={onClick}
    />
  );
});

SafaiWatchAnimatedLogo.displayName = "SafaiWatchAnimatedLogo";
export default SafaiWatchAnimatedLogo;
