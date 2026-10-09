"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Map as MapIcon,
  Compass,
  PlusCircle,
  Trophy,
  Bell,
} from "lucide-react";

interface BottomNavProps {
  activeTab?: "map" | "explore" | "rewards" | "notifications" | "profile";
  onReportClick?: () => void;
  onMapClick?: () => void;
  onNotificationClick?: () => void;
  hasUnreadNotifications?: boolean;
  userRole?: string;
}

export default function BottomNav({
  activeTab: explicitActiveTab,
  onReportClick,
  onMapClick,
  onNotificationClick,
  hasUnreadNotifications,
  userRole,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab automatically from pathname if not explicitly provided
  const currentTab =
    explicitActiveTab ||
    (pathname === "/"
      ? "map"
      : pathname.startsWith("/feed")
      ? "explore"
      : pathname.startsWith("/reward") || pathname.startsWith("/rewards")
      ? "rewards"
      : pathname.startsWith("/notifications")
      ? "notifications"
      : "map");

  const isCoordinator = (userRole || "").trim().toLowerCase() === "coordinator";

  const handlePlusClick = (e: React.MouseEvent) => {
    if (onReportClick) {
      e.preventDefault();
      onReportClick();
    } else {
      router.push("/?action=report");
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (onMapClick && pathname === "/") {
      e.preventDefault();
      onMapClick();
    }
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    if (onNotificationClick) {
      e.preventDefault();
      onNotificationClick();
    }
  };

  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-40 flex justify-around items-center px-4 py-2 bg-white/95 backdrop-blur-xl rounded-full border border-slate-200/90 shadow-[0_12px_35px_rgba(15,23,42,0.12)] transition-all">
      {/* Map Tab */}
      <Link
        href="/"
        onClick={handleMapClick}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          currentTab === "map"
            ? "text-[#006948] scale-110 font-extrabold"
            : "text-slate-500 hover:text-[#006948]"
        }`}
      >
        <MapIcon className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Map</span>
      </Link>

      {/* Explore Tab */}
      <Link
        href="/feed"
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          currentTab === "explore"
            ? "text-[#006948] scale-110 font-extrabold"
            : "text-slate-500 hover:text-[#006948]"
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Explore</span>
      </Link>

      {/* Plus Action Dispatch Button (Hidden for Coordinators) */}
      {!isCoordinator && (
        <button
          onClick={handlePlusClick}
          className="relative -top-3 w-12 h-12 rounded-full bg-[#006948] hover:bg-[#00855d] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,105,72,0.35)] transition-transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
          title="Report Spot at Current Location"
        >
          <PlusCircle className="w-7 h-7 text-[#85f8c4]" />
        </button>
      )}

      {/* Rewards Tab (formerly Ranks) */}
      <Link
        href="/rewards"
        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
          currentTab === "rewards"
            ? "text-[#006948] scale-110 font-extrabold"
            : "text-slate-500 hover:text-[#006948]"
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Rewards</span>
      </Link>

      {/* Notifications Tab */}
      <Link
        href="/notifications"
        onClick={handleNotificationClick}
        className={`flex flex-col items-center justify-center transition-all cursor-pointer relative ${
          currentTab === "notifications"
            ? "text-[#006948] scale-110 font-extrabold"
            : "text-slate-500 hover:text-[#006948]"
        }`}
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#006948] rounded-full ring-2 ring-white" />
          )}
        </div>
        <span className="text-[10px] mt-0.5">Notifications</span>
      </Link>
    </nav>
  );
}
