"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { profileApi } from "@/lib/api";

interface HistoryItem {
  id: string;
  type: "marked" | "completed" | "assigned" | "liked_post" | "linked_post";
  category: string;
  title: string;
  location: string;
  image: string;
  imageBefore?: string;
  imageAfter?: string;
  isCompleted?: boolean;
  status: string;
  date: string;
  likeCount?: number;
  details?: {
    critical?: string;
    description?: string;
    markedBy?: string;
    completedBy?: string;
    assignedTo?: string;
    spotedUser?: string;
    cleanedUser?: string;
  };
}

export default function HistoryPage() {
  const [userRole, setUserRole] = useState<string>("Civilian");
  const [historyData, setHistoryData] = useState<{
    markedSpots: HistoryItem[];
    completedSpots: HistoryItem[];
    assignedSpots: HistoryItem[];
    likedPosts: HistoryItem[];
    linkedPosts: HistoryItem[];
    all: HistoryItem[];
  }>({
    markedSpots: [],
    completedSpots: [],
    assignedSpots: [],
    likedPosts: [],
    linkedPosts: [],
    all: [],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [activeCategory, setActiveCategory] = useState<
    "all" | "marked" | "completed" | "assigned" | "liked_post" | "linked_post"
  >("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modal detail item
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await profileApi.getUserHistory();
      if (res && res.success && res.history) {
        if (res.role) setUserRole(res.role);
        setHistoryData({
          markedSpots: res.history.markedSpots || [],
          completedSpots: res.history.completedSpots || [],
          assignedSpots: res.history.assignedSpots || [],
          likedPosts: res.history.likedPosts || [],
          linkedPosts: res.history.linkedPosts || [],
          all: res.history.all || [],
        });
      } else {
        // Fallback demo data if backend database has zero activity records
        setHistoryData(getMockHistoryData());
      }
    } catch (err) {
      console.warn("Could not fetch user history from backend:", err);
      setHistoryData(getMockHistoryData());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Compute filtered & sorted history list
  const filteredHistory = useMemo(() => {
    let sourceList: HistoryItem[] = [];

    if (activeCategory === "all") {
      sourceList = historyData.all;
    } else if (activeCategory === "marked") {
      sourceList = historyData.markedSpots;
    } else if (activeCategory === "completed") {
      sourceList = historyData.completedSpots;
    } else if (activeCategory === "assigned") {
      sourceList = historyData.assignedSpots;
    } else if (activeCategory === "liked_post") {
      sourceList = historyData.likedPosts;
    } else if (activeCategory === "linked_post") {
      sourceList = historyData.linkedPosts;
    }

    return sourceList
      .filter((item) => {
        // Status filter
        if (statusFilter === "completed" && item.status !== "Completed") return false;
        if (
          statusFilter === "pending" &&
          item.status !== "Pending" &&
          item.status !== "In Progress"
        )
          return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchLocation = item.location.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          const matchDesc = item.details?.description?.toLowerCase().includes(q) || false;
          const matchPerson =
            item.details?.markedBy?.toLowerCase().includes(q) ||
            item.details?.completedBy?.toLowerCase().includes(q) ||
            item.details?.spotedUser?.toLowerCase().includes(q) ||
            item.details?.cleanedUser?.toLowerCase().includes(q) ||
            false;

          return matchTitle || matchLocation || matchCategory || matchDesc || matchPerson;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date || Date.now()).getTime();
        const timeB = new Date(b.date || Date.now()).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [historyData, activeCategory, statusFilter, searchQuery, sortOrder]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryBadgeStyle = (type: string) => {
    switch (type) {
      case "marked":
        return "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]";
      case "completed":
        return "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]";
      case "assigned":
        return "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
      case "liked_post":
        return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
      case "linked_post":
        return "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]";
      default:
        return "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]";
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case "marked":
        return "add_location_alt";
      case "completed":
        return "task_alt";
      case "assigned":
        return "assignment_ind";
      case "liked_post":
        return "favorite";
      case "linked_post":
        return "sell";
      default:
        return "history";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] antialiased pb-24 md:pb-12 pt-20 md:pt-24 selection:bg-[#85f8c4] selection:text-[#002114]">
      {/* STICKY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#faf8ff]/90 backdrop-blur-md border-b border-[#dae2fd]">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-1.5 text-[#006948] hover:bg-[#eaedff] transition-colors p-2 rounded-full active:scale-95"
              title="Back to Profile"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
              <span className="font-['Hanken_Grotesk'] text-xs font-bold hidden sm:inline">
                Back to Profile
              </span>
            </Link>

            <h1 className="font-['Hanken_Grotesk'] text-lg md:text-xl font-extrabold text-[#131b2e] tracking-tight">
              Activity History
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#006948] bg-[#85f8c4]/40 px-3 py-1 rounded-full border border-[#006948]/20 uppercase">
              {userRole} ROLE
            </span>
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="p-2 text-[#006948] hover:bg-[#dae2fd]/40 rounded-full transition-colors cursor-pointer"
              title="Refresh History Data"
            >
              <span className={`material-symbols-outlined text-xl ${isLoading ? "animate-spin" : ""}`}>
                refresh
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col gap-6">
        {/* STATS OVERVIEW CARDS */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div
            onClick={() => setActiveCategory("all")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeCategory === "all"
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#006948]/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase opacity-80">
                TOTAL
              </span>
              <span className="material-symbols-outlined text-sm">history</span>
            </div>
            <p className="font-['Hanken_Grotesk'] text-2xl font-extrabold">{historyData.all.length}</p>
            <p className="text-[10px] font-['JetBrains_Mono'] opacity-70">Activities</p>
          </div>

          <div
            onClick={() => setActiveCategory("marked")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeCategory === "marked"
                ? "bg-[#0284C7] text-white border-[#0284C7]"
                : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#0284C7]/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase opacity-80">
                MARKED
              </span>
              <span className="material-symbols-outlined text-sm">add_location_alt</span>
            </div>
            <p className="font-['Hanken_Grotesk'] text-2xl font-extrabold">{historyData.markedSpots.length}</p>
            <p className="text-[10px] font-['JetBrains_Mono'] opacity-70">Reported Spots</p>
          </div>

          <div
            onClick={() => setActiveCategory("completed")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeCategory === "completed"
                ? "bg-[#059669] text-white border-[#059669]"
                : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#059669]/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase opacity-80">
                COMPLETED
              </span>
              <span className="material-symbols-outlined text-sm">task_alt</span>
            </div>
            <p className="font-['Hanken_Grotesk'] text-2xl font-extrabold">{historyData.completedSpots.length}</p>
            <p className="text-[10px] font-['JetBrains_Mono'] opacity-70">Cleaned Spots</p>
          </div>

          <div
            onClick={() => setActiveCategory("liked_post")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              activeCategory === "liked_post"
                ? "bg-[#DC2626] text-white border-[#DC2626]"
                : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#DC2626]/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase opacity-80">
                LIKED
              </span>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
            </div>
            <p className="font-['Hanken_Grotesk'] text-2xl font-extrabold">{historyData.likedPosts.length}</p>
            <p className="text-[10px] font-['JetBrains_Mono'] opacity-70">Liked Posts</p>
          </div>

          <div
            onClick={() => setActiveCategory("linked_post")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs col-span-2 sm:col-span-1 ${
              activeCategory === "linked_post"
                ? "bg-[#7E22CE] text-white border-[#7E22CE]"
                : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#7E22CE]/40"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase opacity-80">
                LINKED
              </span>
              <span className="material-symbols-outlined text-sm">sell</span>
            </div>
            <p className="font-['Hanken_Grotesk'] text-2xl font-extrabold">{historyData.linkedPosts.length}</p>
            <p className="text-[10px] font-['JetBrains_Mono'] opacity-70">Tagged Posts</p>
          </div>
        </section>

        {/* FILTER CONTROLS BAR */}
        <section className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`font-['JetBrains_Mono'] text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#006948] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              }`}
            >
              All Activity ({historyData.all.length})
            </button>
            <button
              onClick={() => setActiveCategory("marked")}
              className={`font-['JetBrains_Mono'] text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "marked"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              }`}
            >
              Marked Spots ({historyData.markedSpots.length})
            </button>
            <button
              onClick={() => setActiveCategory("completed")}
              className={`font-['JetBrains_Mono'] text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "completed"
                  ? "bg-[#059669] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              }`}
            >
              Completed Spots ({historyData.completedSpots.length})
            </button>

            {historyData.assignedSpots.length > 0 && (
              <button
                onClick={() => setActiveCategory("assigned")}
                className={`font-['JetBrains_Mono'] text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === "assigned"
                    ? "bg-[#D97706] text-white shadow-xs"
                    : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                }`}
              >
                Assigned Spots ({historyData.assignedSpots.length})
              </button>
            )}

            <button
              onClick={() => setActiveCategory("liked_post")}
              className={`font-['JetBrains_Mono'] text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "liked_post"
                  ? "bg-[#DC2626] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              }`}
            >
              Liked Posts ({historyData.likedPosts.length})
            </button>
            <button
              onClick={() => setActiveCategory("linked_post")}
              className={`font-['JetBrains_Mono'] text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "linked_post"
                  ? "bg-[#7E22CE] text-white shadow-xs"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              }`}
            >
              Linked Posts ({historyData.linkedPosts.length})
            </button>
          </div>

          {/* Sub-Filters Row: Search, Status, and Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-[#E2E8F0] pt-3">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#6d7a72] text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by location, title, or user..."
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#006948] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-[#6d7a72] hover:text-[#0F172A]"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-['JetBrains_Mono'] font-bold focus:outline-none focus:border-[#006948] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed Only</option>
                <option value="pending">Pending / In Progress</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs text-[#0F172A] font-['JetBrains_Mono'] font-bold focus:outline-none focus:border-[#006948] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </section>

        {/* HISTORY ITEMS LIST */}
        <section className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-[#006948] animate-spin">
                progress_activity
              </span>
              <p className="text-xs font-['JetBrains_Mono'] text-[#6d7a72] font-bold">
                Loading history records...
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E2E8F0] shadow-xs flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#6d7a72] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl">search_off</span>
              </div>
              <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e]">
                No History Records Found
              </h3>
              <p className="text-xs text-[#6d7a72] mt-1 max-w-xs leading-relaxed">
                No activity matches your selected filters or search terms. Try clearing search or selecting "All Activity".
              </p>
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 bg-[#006948] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#00855d] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const badgeStyle = getCategoryBadgeStyle(item.type);
              const categoryIcon = getCategoryIcon(item.type);

              return (
                <article
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row gap-4 hover:border-[#006948]/50 transition-all shadow-xs cursor-pointer group"
                >
                  {/* Thumbnail Image */}
                  <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-xl overflow-hidden bg-[#F1F5F9] shrink-0 border border-[#E2E8F0]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md">
                      <span className="material-symbols-outlined text-xs flex">{categoryIcon}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <span
                          className={`font-['JetBrains_Mono'] text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${badgeStyle}`}
                        >
                          {item.category}
                        </span>

                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-semibold">
                          {formatDate(item.date)}
                        </span>
                      </div>

                      <h3 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e] group-hover:text-[#006948] transition-colors line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="font-['Inter'] text-xs text-[#6d7a72] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-xs text-[#006948]">
                          location_on
                        </span>
                        <span className="truncate">{item.location}</span>
                      </p>
                    </div>

                    {/* Footer Info & Details Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] mt-1">
                      <div className="flex items-center gap-2 text-xs font-['Inter']">
                        {item.status && (
                          <span
                            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                              item.status === "Completed"
                                ? "bg-[#DCFCE7] text-[#15803D]"
                                : "bg-[#FEF3C7] text-[#B45309]"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {item.status === "Completed" ? "check_circle" : "pending"}
                            </span>
                            {item.status}
                          </span>
                        )}

                        {item.likeCount !== undefined && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#DC2626]">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                              favorite
                            </span>
                            {item.likeCount} Likes
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-bold text-[#006948] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E2E8F0] shadow-2xl max-h-[90vh] overflow-y-auto animate-enter">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span
                  className={`font-['JetBrains_Mono'] text-xs font-bold px-3 py-1 rounded-full border uppercase ${getCategoryBadgeStyle(
                    selectedItem.type
                  )}`}
                >
                  {selectedItem.category}
                </span>
                {selectedItem.details?.critical && (
                  <span className="font-['JetBrains_Mono'] text-[10px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FCD34D] uppercase">
                    {selectedItem.details.critical} CRITICAL
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#6d7a72] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Image Banner */}
              {selectedItem.imageAfter && selectedItem.imageBefore ? (
                <div>
                  <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] uppercase tracking-wider mb-2">
                    BEFORE &amp; AFTER CLEANUP AUDIT
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
                      <img
                        src={selectedItem.imageBefore}
                        alt="Before"
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/70 text-white font-['JetBrains_Mono'] text-[9px] font-bold px-2 py-0.5 rounded">
                        BEFORE
                      </span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-[#10B981]/30">
                      <img
                        src={selectedItem.imageAfter}
                        alt="After"
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-[#10B981] text-white font-['JetBrains_Mono'] text-[9px] font-bold px-2 py-0.5 rounded">
                        AFTER
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Title & Location */}
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e] mb-1">
                  {selectedItem.title}
                </h3>
                <p className="font-['Inter'] text-xs text-[#6d7a72] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-[#006948]">
                    location_on
                  </span>
                  {selectedItem.location}
                </p>
                {selectedItem.details?.description && (
                  <p className="font-['Inter'] text-xs text-[#0F172A] mt-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] leading-relaxed">
                    {selectedItem.details.description}
                  </p>
                )}
              </div>

              {/* Activity Details Grid */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] flex flex-col gap-2.5 text-xs font-['Inter']">
                <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] uppercase tracking-wider mb-1">
                  ACTIVITY AUDIT &amp; TIMESTAMP
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-[#6d7a72]">RECORD DATE:</span>
                  <span className="font-['JetBrains_Mono'] font-bold text-[#0F172A]">
                    {formatDate(selectedItem.date)}
                  </span>
                </div>

                {selectedItem.details?.markedBy && (
                  <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#6d7a72]">REPORTED BY:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {selectedItem.details.markedBy}
                    </span>
                  </div>
                )}

                {selectedItem.details?.completedBy && (
                  <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#6d7a72]">CLEANED BY:</span>
                    <span className="font-semibold text-[#059669]">
                      {selectedItem.details.completedBy}
                    </span>
                  </div>
                )}

                {selectedItem.details?.spotedUser && (
                  <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#6d7a72]">SPOTTED USER:</span>
                    <span className="font-semibold text-[#0F172A]">
                      {selectedItem.details.spotedUser}
                    </span>
                  </div>
                )}

                {selectedItem.details?.cleanedUser && (
                  <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-2">
                    <span className="text-[#6d7a72]">CLEANER USER:</span>
                    <span className="font-semibold text-[#059669]">
                      {selectedItem.details.cleanedUser}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-['Inter'] text-sm font-semibold py-3 rounded-xl mt-4 cursor-pointer transition-colors"
            >
              Close Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback Mock History Data if database has 0 activity records
function getMockHistoryData() {
  const markedSpots: HistoryItem[] = [
    {
      id: "hist-mark-1",
      type: "marked",
      category: "Marked Spot",
      title: "MG Road Culvert Plastic Waste",
      location: "Ward 14, Ottapalam",
      image:
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80",
      status: "Completed",
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      details: {
        critical: "High",
        description: "Plastic bottles and silt clogging drainage culvert.",
        markedBy: "Civilian Ranger",
      },
    },
  ];

  const completedSpots: HistoryItem[] = [
    {
      id: "hist-comp-1",
      type: "completed",
      category: "Completed Spot",
      title: "Park Avenue Waste Dump Cleared",
      location: "Ward 14, Community Park",
      image:
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80",
      imageAfter:
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80",
      status: "Completed",
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      details: {
        critical: "Medium",
        description: "Organic waste composted and plastics dispatched for recycling.",
        completedBy: "Clean Ranger Unit",
      },
    },
  ];

  const assignedSpots: HistoryItem[] = [
    {
      id: "hist-assign-1",
      type: "assigned",
      category: "Assigned Spot",
      title: "Market Square Garbage Spill",
      location: "Ward 12, Main Sq",
      image:
        "https://images.unsplash.com/photo-1604186837056-8e7c286756f2?w=500&auto=format&fit=crop&q=80",
      status: "In Progress",
      date: new Date(Date.now() - 3600000 * 4).toISOString(),
      details: {
        critical: "High",
        description: "Market cleanup assignment in progress.",
      },
    },
  ];

  const likedPosts: HistoryItem[] = [
    {
      id: "hist-like-1",
      type: "liked_post",
      category: "Liked Post",
      title: "Weekend Market Cleanup Drive Complete!",
      location: "Ward 14, Market Square",
      image:
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80",
      status: "Completed",
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      likeCount: 215,
      details: {
        spotedUser: "Squad #7",
        cleanedUser: "Rajesh K.",
        description: "45kg of segregated plastics dispatched to recycling hub.",
      },
    },
  ];

  const linkedPosts: HistoryItem[] = [
    {
      id: "hist-link-1",
      type: "linked_post",
      category: "Linked Post",
      title: "Drain Silt Removal & Waterflow Audit",
      location: "Ward 14, MG Road",
      image:
        "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80",
      status: "Completed",
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      likeCount: 142,
      details: {
        spotedUser: "Civilian Reporter",
        cleanedUser: "Clean Ranger Unit",
        description: "Verified cleanup post for MG Road drainage.",
      },
    },
  ];

  return {
    markedSpots,
    completedSpots,
    assignedSpots,
    likedPosts,
    linkedPosts,
    all: [
      ...markedSpots,
      ...completedSpots,
      ...assignedSpots,
      ...likedPosts,
      ...linkedPosts,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}
