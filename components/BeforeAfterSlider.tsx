"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";

interface BeforeAfterSliderProps {
  beforeImg: string;
  afterImg: string;
  aspectRatio?: string; // e.g. "4/5", "1/1", "16/9"
  onDoubleClick?: () => void;
}

export default function BeforeAfterSlider({
  beforeImg,
  afterImg,
  aspectRatio = "4/5",
  onDoubleClick,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const lastTapRef = useRef<number>(0);
  const startXRef = useRef<number>(0);

  const updatePosition = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  // Mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setHasInteracted(true);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onDoubleClick) {
        onDoubleClick();
      }
    },
    [onDoubleClick]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updatePosition]);

  // Touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const now = Date.now();
      const touch = e.touches[0];
      if (touch) {
        startXRef.current = touch.clientX;
      }

      if (now - lastTapRef.current < 320) {
        if (onDoubleClick) {
          onDoubleClick();
        }
      }
      lastTapRef.current = now;

      setIsDragging(true);
      setHasInteracted(true);
      if (touch) {
        updatePosition(touch.clientX);
      }
    },
    [updatePosition, onDoubleClick]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) {
        updatePosition(e.touches[0].clientX);
      }
    },
    [isDragging, updatePosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`ba-slider${isDragging ? " ba-active" : ""}`}
      style={{ aspectRatio }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* After image (bottom layer, always full) */}
      <img
        className="ba-img ba-after"
        src={afterImg}
        alt="After cleanup"
        draggable={false}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80";
        }}
      />

      {/* Before image (top layer, clipped) */}
      <img
        className="ba-img ba-before"
        src={beforeImg}
        alt="Before cleanup"
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80";
        }}
      />

      {/* Divider line */}
      <div
        className="ba-divider"
        style={{ left: `calc(${position}% - 1.5px)` }}
      />

      {/* Handle */}
      <div
        className={`ba-handle${!hasInteracted ? " ba-handle-pulse" : ""}`}
        style={{ left: `${position}%` }}
      >
        <div className="ba-handle-arrows">
          {/* Left chevron */}
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          <div className="ba-handle-grip" />
          <div className="ba-handle-grip" />
          {/* Right chevron */}
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div
        className="ba-label ba-label-before"
        style={{ opacity: position > 15 ? 1 : 0 }}
      >
        Before
      </div>
      <div
        className="ba-label ba-label-after"
        style={{ opacity: position < 85 ? 1 : 0 }}
      >
        After
      </div>
    </div>
  );
}
