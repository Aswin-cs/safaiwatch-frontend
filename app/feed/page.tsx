"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profileApi, feedsApi, FeedPost } from "@/lib/api";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import FeedCardSkeleton from "@/components/FeedCardSkeleton";
import SafaiWatchLogo from "@/components/SafaiWatchLogo";
import NotificationPopup from "@/components/NotificationPopup";
import BottomNav from "@/components/BottomNav";

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface FeedItem {
  id: string;
  cleanerName: string;
  cleanerUsername?: string;
  cleanerAvatar: string;
  reporterName: string;
  reporterUsername?: string;
  reporterAvatar: string;
  timestamp: string;
  ward: string;
  beforeImg: string;
  afterImg: string;
  geminiTime: string;
  xpBonus: number;
  cheersCount: number;
  isCheered: boolean;
  caption: string;
  comments: Comment[];
  category: "nearby" | "top" | "challenge" | "following";
  isBackendPost?: boolean;
}

const DEFAULT_BEFORE_IMG =
  "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80";
const DEFAULT_AFTER_IMG =
  "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80";

function getAvatarUrl(user: any): string {
  if (!user) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  if (typeof user.avatar === "string" && user.avatar.trim()) return user.avatar;
  if (user.avatar?.url) return user.avatar.url;
  if (user.avatarUrl) return user.avatarUrl;
  if (user.username) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`;
  }
  return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
}

function formatTimeAgo(dateString?: string | Date): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSec < 60) return "Just now";
  if (diffInSec < 3600) return `${Math.floor(diffInSec / 60)}m ago`;
  if (diffInSec < 86400) return `${Math.floor(diffInSec / 3600)} hrs ago`;
  if (diffInSec < 604800) return `${Math.floor(diffInSec / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function FeedPage() {
  const router = useRouter();

  // Basic user & status info from backend
  const [basicInfo, setBasicInfo] = useState<any | null>(null);

  // Feed items & loading state
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);



  // Locality & Filter state
  const [selectedWard, setSelectedWard] = useState<string>("All Wards Territory");
  const [isWardDropdownOpen, setIsWardDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "liked" | "not_liked">("all");

  // Expanded comments & comment inputs per post
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Map raw backend post object to FeedItem interface
  const mapPostToFeedItem = useCallback((post: FeedPost, userLikes: any[] = [], idx: number = 0): FeedItem => {
    const isLiked = post.isLiked !== undefined
      ? Boolean(post.isLiked)
      : userLikes.some((item: any) => {
        const pid = item?.postId?._id || item?.postId || item;
        return pid && pid.toString() === post._id?.toString();
      });

    const categoryChoices: Array<"nearby" | "top" | "challenge" | "following"> = ["nearby", "top", "challenge", "following"];
    const category = categoryChoices[idx % categoryChoices.length];

    const cleanerUser = post.CleanedUser;
    const reporterUser = post.SpotedUser;
    const cleanerUserId = cleanerUser?.username || cleanerUser?.id || "Civic Cleaner";
    const reporterUserId = reporterUser?.username || reporterUser?.id || "Civic Spotter";

    return {
      id: post._id,
      cleanerName: cleanerUser?.username || cleanerUser?.name || "Civic Cleaner",
      cleanerUsername: cleanerUserId,
      cleanerAvatar: getAvatarUrl(cleanerUser),
      reporterName: reporterUser?.username || reporterUser?.name || "Civic Spotter",
      reporterUsername: reporterUserId,
      reporterAvatar: getAvatarUrl(reporterUser),
      timestamp: formatTimeAgo(post.createdAt),
      ward: post.geolocation?.address || "Ottapalam Ward",
      beforeImg: post.imageBefore || DEFAULT_BEFORE_IMG,
      afterImg: post.imageAfter || DEFAULT_AFTER_IMG,
      geminiTime: "3.0 Hours",
      xpBonus: 150,
      cheersCount: post.likeCount ?? 0,
      isCheered: isLiked,
      caption: post.description || post.postName || "Civic spot cleaned up successfully!",
      category,
      comments: [],
      isBackendPost: true,
    };
  }, []);

  // Fetch feed posts and user basic info from backend controllers
  const loadFeedData = useCallback(async () => {
    setIsLoadingFeed(true);
    let userLikes: any[] = [];
    let currentUserId: string | undefined = undefined;

    // 1. Check authorization status & fetch user basic info
    try {
      const meRes = await authApi.getMe();
      if (meRes && (meRes.authorizationType === "incomplete" || meRes.isProfileCompleted === false)) {
        router.push("/onboarding");
        return;
      }

      const infoRes = await profileApi.getBasicInfo();
      if (infoRes && infoRes.success) {
        setBasicInfo(infoRes);
        currentUserId = infoRes.user?.username || infoRes.user?.id;
        userLikes = infoRes.userStatus?.userLikePosts || [];
      } else if (meRes && meRes.success) {
        setBasicInfo(meRes);
        currentUserId = meRes.user?.username || meRes.user?.id;
      }
    } catch (err) {
      console.warn("Could not fetch basic info:", err);
    }

    // 2. Fetch backend feeds via feedsApi.getAllPosts based on backend feeds.controller.js
    try {
      const feedRes = await feedsApi.getAllPosts(1, 20, currentUserId);
      if (feedRes && feedRes.success && Array.isArray(feedRes.posts) && feedRes.posts.length > 0) {
        const userLikesFromFeed = Array.isArray(feedRes.userLikePosts) ? feedRes.userLikePosts : [];
        const combinedLikes = userLikesFromFeed.length > 0 ? userLikesFromFeed : userLikes;

        const mappedBackendItems = feedRes.posts.map((post: FeedPost, index: number) =>
          mapPostToFeedItem(post, combinedLikes, index)
        );
        setFeedItems(mappedBackendItems);
      } else {
        setFeedItems([]);
      }
    } catch (err) {
      console.error("Failed to load posts from feeds controller:", err);
      setFeedItems([]);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [mapPostToFeedItem, router]);

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  const basicUser = basicInfo?.user;
  const basicStatus = basicInfo?.userStatus;
  const basicRewards = basicInfo?.userRewards;

  const streaksCount = basicStatus?.streaks ?? basicRewards?.currentStreak ?? 0;
  const karmaPoints =
    basicRewards?.karmaBalance !== undefined
      ? basicRewards.karmaBalance
      : (basicStatus?.completedSpots ?? 0) * 100;

  const userAvatar = getAvatarUrl(basicUser);
  // const userProfileLink = basicUser?.username ? `/profile/${basicUser.username}` : "/profile";
  const userProfileLink = "/profile";

  // Dynamic Ward Choices generated from loaded feed items
  const uniqueWards = Array.from(new Set(feedItems.map((item) => item.ward))).filter(Boolean);
  const wardsList = ["All Wards Territory", ...uniqueWards];

  // Handle cheer / like toggle using feedsApi.toggleLike
  const handleCheerToggle = async (itemId: string) => {
    let targetItem = feedItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    const nextCheered = !targetItem.isCheered;
    const nextCount = nextCheered
      ? targetItem.cheersCount + 1
      : Math.max(0, targetItem.cheersCount - 1);

    // Optimistically update UI
    setFeedItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isCheered: nextCheered, cheersCount: nextCount } : item))
    );

    // Call backend API if it's a backend post ID
    if (targetItem.isBackendPost || itemId.length > 15) {
      try {
        const res = await feedsApi.toggleLike(itemId, basicUser?.username || basicUser?.id);
        if (res && res.success && res.likeCount !== undefined) {
          setFeedItems((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? {
                  ...item,
                  cheersCount: res.likeCount!,
                  isCheered: res.isLiked ?? nextCheered,
                }
                : item
            )
          );
        }
      } catch (err) {
        console.error("Error toggling like on backend:", err);
      }
    }
  };

  const toggleComments = (itemId: string) => {
    setExpandedComments((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleAddComment = (itemId: string) => {
    const text = newCommentText[itemId]?.trim();
    if (!text) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: basicUser?.username || "You (Civic Ranger)",
      avatar: userAvatar,
      text,
      timestamp: "Just now",
    };

    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, comments: [...item.comments, newComment] };
        }
        return item;
      })
    );

    setNewCommentText((prev) => ({ ...prev, [itemId]: "" }));
    triggerToast("Comment posted!");
  };

  const handleShare = (item: FeedItem) => {
    const postUrl = typeof window !== "undefined" ? `${window.location.origin}/feed/${item.id}` : `/feed/${item.id}`;
    const shareTitle = `SafaiWatch Cleanup - ${item.cleanerName} & ${item.reporterName}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: item.caption,
          url: postUrl,
        })
        .catch(() => { });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      triggerToast("Direct post link copied to clipboard!");
    } else {
      triggerToast("Link copied!");
    }
  };

  const handleSignOut = async () => {
    try {
      await authApi.signOut();
      triggerToast("Signed out successfully");
      setTimeout(() => {
        router.push("/login");
      }, 500);
    } catch (err) {
      router.push("/login");
    }
  };

  // Filter feed items by ward, search query, and category
  const filteredFeed = feedItems.filter((item) => {
    const matchesSearch =
      item.cleanerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ward.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWard =
      selectedWard === "All Wards Territory" ||
      item.ward.toLowerCase().includes(selectedWard.toLowerCase().split(",")[0]);

    const matchesFilter =
      activeFilter === "all"
        ? true
        : activeFilter === "liked"
          ? item.isCheered === true
          : activeFilter === "not_liked"
            ? item.isCheered === false
            : true;

    return matchesSearch && matchesWard && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070d18] text-[#131b2e] dark:text-slate-100 font-['Inter'] antialiased selection:bg-[#85f8c4] selection:text-[#002114] pb-24 md:pb-12 pt-32 md:pt-28">
      {/* Toast Notification */}
      {toast && (
        <NotificationPopup
          type="success"
          message={toast}
          duration={3500}
          onClose={() => setToast(null)}
          position="top-right"
        />
      )}

      {/* TOP NAVIGATION & SUB-FILTERS HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b border-[#dae2fd]/60 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-6 max-w-6xl mx-auto w-full gap-2">
          {/* Left: Brand Title & Locality Selector */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0 group" title="Return to Map">
              <SafaiWatchLogo variant="icon" size="sm" animated={true} />
              <h1 className="font-['Hanken_Grotesk'] text-lg sm:text-xl md:text-2xl font-black text-[#006948] dark:text-emerald-400 tracking-tight group-hover:text-[#00855d] dark:group-hover:text-emerald-300 transition-colors">
                Civic Feed
              </h1>
            </Link>

            {/* Locality Selector Dropdown */}
            <div className="relative shrink min-w-0">
              <button
                onClick={() => setIsWardDropdownOpen(!isWardDropdownOpen)}
                className="flex items-center gap-1 bg-[#dae2fd]/40 dark:bg-slate-800 text-[#131b2e] dark:text-slate-200 hover:bg-[#dae2fd]/70 dark:hover:bg-slate-700/80 transition-colors px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#bccac0]/40 dark:border-slate-700 cursor-pointer max-w-[120px] sm:max-w-[200px]"
              >
                <span className="material-symbols-outlined text-sm sm:text-base text-[#006948] dark:text-emerald-400 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
                <span className="font-['JetBrains_Mono'] text-[11px] sm:text-xs font-bold text-[#3d4a42] dark:text-slate-200 truncate">
                  {selectedWard}
                </span>
                <span className="material-symbols-outlined text-sm sm:text-base text-slate-500 dark:text-slate-400 shrink-0">arrow_drop_down</span>
              </button>

              {isWardDropdownOpen && (
                <div className="absolute top-9 left-0 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xl py-2 w-60 sm:w-64 max-h-60 overflow-y-auto animate-enter">
                  <div className="px-3 py-1 text-[10px] font-['JetBrains_Mono'] text-[#6d7a72] dark:text-slate-400 font-bold uppercase">
                    Select Locality Ward
                  </div>
                  {wardsList.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setSelectedWard(w);
                        setIsWardDropdownOpen(false);
                        triggerToast(`Filtered feed to ${w}`);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors truncate ${selectedWard === w ? "text-[#006948] dark:text-emerald-300 font-bold bg-[#ECFDF5] dark:bg-emerald-950/70" : "text-[#0F172A] dark:text-slate-200"
                        }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions (Refresh, Search, Profile, Logout) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={loadFeedData}
              disabled={isLoadingFeed}
              className="w-8 h-8 sm:w-9 sm:h-9 text-[#006948] dark:text-emerald-400 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100/80 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer flex items-center justify-center border border-emerald-200/60 dark:border-slate-700 shrink-0"
              title="Refresh Feed"
            >
              <span className={`material-symbols-outlined text-lg sm:text-xl ${isLoadingFeed ? "animate-spin" : ""}`}>
                refresh
              </span>
            </button>

            {/* Search Input (Desktop/Tablet) */}
            <div className="hidden md:flex items-center bg-white dark:bg-slate-800 border border-[#bccac0]/60 dark:border-slate-700 rounded-full px-3.5 py-1.5 focus-within:border-[#006948] dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-[#006948]/10 dark:focus-within:ring-emerald-500/20 transition-all">
              <span className="material-symbols-outlined text-base text-[#6d7a72] dark:text-slate-400">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent focus:outline-none text-xs ml-2 w-44 text-[#131b2e] dark:text-slate-100 placeholder:text-[#6d7a72] dark:placeholder:text-slate-400"
                placeholder="Search cleanups..."
                type="text"
              />
            </div>

            {/* Profile Avatar link */}
            <Link
              href={userProfileLink}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00855d] flex items-center justify-center overflow-hidden border-2 border-[#006948]/30 dark:border-emerald-500/40 cursor-pointer hover:scale-105 transition-transform shrink-0"
              title={basicUser?.username ? `@${basicUser.username}` : "My Profile"}
            >
              <img
                className="w-full h-full object-cover"
                alt={basicUser?.username || "Profile"}
                src={userAvatar}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
            </Link>

            {/* Sign Out Button (Desktop/Tablet) */}
            <button
              onClick={handleSignOut}
              className="hidden sm:flex px-3 py-1.5 text-xs font-bold text-[#ba1a1a] dark:text-rose-400 hover:bg-[#ffdad6]/40 dark:hover:bg-rose-950/40 border border-[#ba1a1a]/30 dark:border-rose-500/30 rounded-full transition-all cursor-pointer items-center gap-1 shrink-0"
              title="Sign Out of Session"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-filters horizontal bar */}
        <div className="w-full overflow-x-auto hide-scrollbar px-3.5 py-1.5 flex gap-1.5 sm:gap-2 border-t border-[#dae2fd]/40 dark:border-slate-800 max-w-6xl mx-auto sm:px-6">
          <button
            onClick={() => setActiveFilter("all")}
            className={`whitespace-nowrap px-3.5 py-1 rounded-full font-['JetBrains_Mono'] text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${activeFilter === "all"
                ? "bg-[#006948] dark:bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-[#3d4a42] dark:text-slate-300 border border-[#bccac0]/60 dark:border-slate-700 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
              }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setActiveFilter("liked")}
            className={`whitespace-nowrap px-3.5 py-1 rounded-full font-['JetBrains_Mono'] text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === "liked"
                ? "bg-[#006948] dark:bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-[#3d4a42] dark:text-slate-300 border border-[#bccac0]/60 dark:border-slate-700 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
              }`}
          >
            <span
              className="material-symbols-outlined text-[13px] sm:text-sm text-rose-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            <span>Liked</span>
            {feedItems.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-semibold ${activeFilter === "liked"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
              >
                {feedItems.filter((i) => i.isCheered).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter("not_liked")}
            className={`whitespace-nowrap px-3.5 py-1 rounded-full font-['JetBrains_Mono'] text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeFilter === "not_liked"
                ? "bg-[#006948] dark:bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-[#3d4a42] dark:text-slate-300 border border-[#bccac0]/60 dark:border-slate-700 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
              }`}
          >
            <span className="material-symbols-outlined text-[13px] sm:text-sm text-slate-400">
              favorite_border
            </span>
            <span>Not Liked</span>
            {feedItems.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-semibold ${activeFilter === "not_liked"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
              >
                {feedItems.filter((i) => !i.isCheered).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN FEED CANVAS */}
      <main className="max-w-xl mx-auto px-4 md:px-0 flex flex-col gap-6 md:gap-8 mt-2">
        {isLoadingFeed ? (
          <FeedCardSkeleton count={3} />
        ) : filteredFeed.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/90 rounded-[24px] p-8 text-center border border-[#E2E8F0] dark:border-slate-800 shadow-xs my-8">
            <span className="material-symbols-outlined text-4xl text-[#6d7a72] dark:text-slate-400 mb-2">search_off</span>
            <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] dark:text-slate-100">No Cleanup Posts Found</h3>
            <p className="text-xs text-[#6d7a72] dark:text-slate-400 mt-1">Try switching locality ward or resetting search keywords.</p>
            <button
              onClick={() => {
                setSelectedWard("All Wards Territory");
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="mt-4 bg-[#006948] dark:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-[#00855d] dark:hover:bg-emerald-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFeed.map((item) => {
            const isCommentsExpanded = expandedComments[item.id] || false;

            return (
              <article
                key={item.id}
                onDoubleClick={() => router.push(`/feed/${item.id}`)}
                className="feed-card bg-white dark:bg-slate-900/90 rounded-[24px] overflow-hidden flex flex-col transition-all duration-300 shadow-sm border border-[#E2E8F0] dark:border-slate-800"
              >
                {/* Dual Attribution Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-transparent dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <Link
                        href={`/profile/${encodeURIComponent(item.cleanerUsername || item.cleanerName)}`}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden z-10 relative shadow-xs hover:scale-105 transition-transform"
                        title={`View profile of ${item.cleanerName}`}
                      >
                        <img
                          className="w-full h-full object-cover"
                          alt={item.cleanerName}
                          src={item.cleanerAvatar}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                          }}
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#006948] dark:bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                      </Link>
                      <Link
                        href={`/profile/${encodeURIComponent(item.reporterUsername || item.reporterName)}`}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden z-0 shadow-xs hover:scale-105 transition-transform"
                        title={`View profile of ${item.reporterName}`}
                      >
                        <img
                          className="w-full h-full object-cover"
                          alt={item.reporterName}
                          src={item.reporterAvatar}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                          }}
                        />
                      </Link>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <Link
                          href={`/profile/${encodeURIComponent(item.cleanerUsername || item.cleanerName)}`}
                          className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e] dark:text-slate-100 hover:text-[#006948] dark:hover:text-emerald-400 transition-colors"
                        >
                          {item.cleanerName}
                        </Link>
                        <span className="text-[#6d7a72] dark:text-slate-400 text-xs font-semibold">&amp;</span>
                        <Link
                          href={`/profile/${encodeURIComponent(item.reporterUsername || item.reporterName)}`}
                          className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e] dark:text-slate-100 hover:text-[#006948] dark:hover:text-emerald-400 transition-colors"
                        >
                          {item.reporterName}
                        </Link>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] dark:text-slate-400 font-semibold">
                        {item.timestamp} • {item.ward}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.isBackendPost && (
                      <span className="bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#006948] dark:text-emerald-300 font-['JetBrains_Mono'] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#006948]/20 dark:border-emerald-600/40">
                        LIVE
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      className="text-[#6d7a72] dark:text-slate-400 hover:text-[#131b2e] dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-slate-800 cursor-pointer"
                      title="Share direct post link"
                    >
                      <span className="material-symbols-outlined text-xl">share</span>
                    </button>
                  </div>
                </div>

                {/* Media (4:5 Before/After Comparison Slider) */}
                <BeforeAfterSlider
                  beforeImg={item.beforeImg}
                  afterImg={item.afterImg}
                  aspectRatio="4/5"
                  onDoubleClick={() => router.push(`/feed/${item.id}`)}
                />

                {/* Action Bar */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800">
                  <div className="flex items-center gap-5">
                    {/* Cheer Button */}
                    <button
                      onClick={() => handleCheerToggle(item.id)}
                      className={`flex items-center gap-1.5 group cursor-pointer transition-colors ${item.isCheered ? "text-[#ef4444] dark:text-rose-400" : "text-[#3d4a42] dark:text-slate-300 hover:text-[#131b2e] dark:hover:text-white"
                        }`}
                    >
                      <span
                        className={`material-symbols-outlined text-xl transition-transform group-active:scale-75 ${item.isCheered ? "text-[#ef4444] dark:text-rose-400" : ""
                          }`}
                        style={{ fontVariationSettings: item.isCheered ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span className="font-['Hanken_Grotesk'] text-sm font-bold">
                        {item.cheersCount} Cheers
                      </span>
                    </button>
                  </div>
                </div>

                {/* Caption Content */}
                <div className="px-5 py-4 bg-white dark:bg-slate-900/90 flex items-center justify-between">
                  <Link href={`/feed/${item.id}`} className="block group flex-1 mr-4">
                    <p className="font-['Inter'] text-sm text-[#131b2e] dark:text-slate-200 leading-relaxed group-hover:text-[#006948] dark:group-hover:text-emerald-400 transition-colors cursor-pointer">
                      <span className="font-['Hanken_Grotesk'] font-bold text-sm mr-1.5 text-inherit">
                        {item.cleanerName}
                      </span>
                      {item.caption}
                    </p>
                  </Link>

                  <Link
                    href={`/feed/${item.id}`}
                    className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] dark:text-emerald-400 hover:underline hover:text-[#00855d] dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View Full Case</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNav userRole={basicInfo?.role} />
    </div>
  );
}
