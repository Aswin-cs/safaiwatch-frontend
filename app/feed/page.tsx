"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profileApi, feedsApi, FeedPost } from "@/lib/api";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

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

// Initial fallback posts if database has 0 posts yet
const INITIAL_FALLBACK_POSTS: FeedItem[] = [
  {
    id: "item-1",
    cleanerName: "Rajesh Kumar",
    cleanerUsername: "Rajesh Kumar",
    cleanerAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    reporterName: "Aswin V.",
    reporterUsername: "Aswin V.",
    reporterAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    timestamp: "2 hrs ago",
    ward: "Ward 14, Ottapalam",
    beforeImg: DEFAULT_BEFORE_IMG,
    afterImg: DEFAULT_AFTER_IMG,
    geminiTime: "3.5 Hours",
    xpBonus: 200,
    cheersCount: 142,
    isCheered: false,
    caption:
      "MG Road culvert cleared of plastic debris before monsoon rains. Great teamwork! 🌿🧹",
    category: "nearby",
    comments: [
      {
        id: "c-1",
        author: "Anitha Menon",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        text: "Awesome work! Drainage flow is so smooth now.",
        timestamp: "1 hr ago",
      },
      {
        id: "c-2",
        author: "Kiran R.",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
        text: "Kudos to Rajesh and Aswin! Real civic heroes.",
        timestamp: "45m ago",
      },
    ],
  },
  {
    id: "item-2",
    cleanerName: "Sneha Patel",
    cleanerAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    reporterName: "Amal R.",
    reporterAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    timestamp: "4 hrs ago",
    ward: "Ward 12, Park Street",
    beforeImg:
      "https://images.unsplash.com/photo-1604186837056-8e7c286756f2?w=800&auto=format&fit=crop&q=80",
    afterImg:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=80",
    geminiTime: "1.2 Hours",
    xpBonus: 150,
    cheersCount: 89,
    isCheered: false,
    caption:
      "Park bench area restored and organic waste composted. Clean neighborhood vibes! ✨🌳",
    category: "top",
    comments: [
      {
        id: "c-3",
        author: "Priya S.",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
        text: "Looks so clean and inviting now!",
        timestamp: "2 hrs ago",
      },
    ],
  },
  {
    id: "item-3",
    cleanerName: "Kavita Sharma",
    cleanerAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    reporterName: "Squad #7",
    reporterAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    timestamp: "Today, 8:00 AM",
    ward: "Ward 14, Market Square",
    beforeImg: DEFAULT_BEFORE_IMG,
    afterImg: DEFAULT_AFTER_IMG,
    geminiTime: "2.0 Hours",
    xpBonus: 250,
    cheersCount: 215,
    isCheered: true,
    caption:
      "Weekend Market Cleanup Drive complete! 45kg of segregated plastics dispatched to recycling hub.",
    category: "challenge",
    comments: [
      {
        id: "c-4",
        author: "Ranger Corp",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        text: "Verified! +250 Karma awarded to Squad #7.",
        timestamp: "3 hrs ago",
      },
    ],
  },
];

export default function FeedPage() {
  const router = useRouter();

  // Basic user & status info from backend
  const [basicInfo, setBasicInfo] = useState<any | null>(null);

  // Feed items & loading state
  const [feedItems, setFeedItems] = useState<FeedItem[]>(INITIAL_FALLBACK_POSTS);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);



  // Locality & Filter state
  const [selectedWard, setSelectedWard] = useState<string>("All Wards Territory");
  const [isWardDropdownOpen, setIsWardDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"nearby" | "top" | "challenge" | "following">("nearby");

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
    const cleanerUserId = cleanerUser?._id || cleanerUser?.username || "Civic Cleaner";
    const reporterUserId = reporterUser?._id || reporterUser?.username || "Civic Spotter";

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
      comments: [
        {
          id: `c-bot-${post._id}`,
          author: "SafaiWatch Audit",
          avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          text: `Verified cleanup post for ${post.geolocation?.address || "this spot"}.`,
          timestamp: formatTimeAgo(post.createdAt),
        },
      ],
      isBackendPost: true,
    };
  }, []);

  // Fetch feed posts and user basic info from backend controllers
  const loadFeedData = useCallback(async () => {
    setIsLoadingFeed(true);
    let userLikes: any[] = [];
    let currentUserId: string | undefined = undefined;

    // 1. Fetch user basic info
    try {
      const infoRes = await profileApi.getBasicInfo();
      if (infoRes && infoRes.success) {
        setBasicInfo(infoRes);
        currentUserId = infoRes.user?._id;
        userLikes = infoRes.userStatus?.userLikePosts || [];
      } else {
        const meRes = await authApi.getMe();
        if (meRes && meRes.success) {
          setBasicInfo(meRes);
          currentUserId = meRes.user?._id;
        }
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
        // Fallback to sample posts if DB has 0 posts
        setFeedItems(INITIAL_FALLBACK_POSTS);
      }
    } catch (err) {
      console.error("Failed to load posts from feeds controller:", err);
      setFeedItems(INITIAL_FALLBACK_POSTS);
    } finally {
      setIsLoadingFeed(false);
    }
  }, [mapPostToFeedItem]);

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
  const userProfileLink = basicUser?.username ? `/profile/${basicUser.username}` : "/profile";

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

    if (nextCheered) {
      triggerToast(`Cheered for ${targetItem.cleanerName}'s cleanup! 🎉`);
    } else {
      triggerToast("Cheer removed.");
    }

    // Call backend API if it's a backend post ID
    if (targetItem.isBackendPost || itemId.length > 15) {
      try {
        const res = await feedsApi.toggleLike(itemId, basicUser?._id);
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
        .catch(() => {});
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

    const matchesCategory =
      activeFilter === "nearby"
        ? true
        : activeFilter === "top"
        ? item.cheersCount > 50 || item.category === "top"
        : activeFilter === "challenge"
        ? item.category === "challenge"
        : true;

    return matchesSearch && matchesWard && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#131b2e] font-['Inter'] antialiased selection:bg-[#85f8c4] selection:text-[#002114] pb-24 md:pb-12 pt-32 md:pt-28">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-50 bg-[#006948] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#85f8c4]/30 flex items-center gap-3 animate-enter">
          <span className="material-symbols-outlined text-[#85f8c4]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* TOP NAVIGATION & SUB-FILTERS HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col glass-panel shadow-xs">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <h1 className="font-['Hanken_Grotesk'] text-xl md:text-2xl font-extrabold text-[#006948] tracking-tight">
                Civic Feed
              </h1>
            </Link>

            {/* Locality Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsWardDropdownOpen(!isWardDropdownOpen)}
                className="flex items-center gap-1 bg-[#dae2fd]/40 text-[#131b2e] hover:bg-[#dae2fd]/70 transition-colors px-3 py-1.5 rounded-full border border-[#bccac0]/40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-[#006948]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
                <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#3d4a42] truncate max-w-[120px] sm:max-w-[180px]">
                  {selectedWard}
                </span>
                <span className="material-symbols-outlined text-base">arrow_drop_down</span>
              </button>

              {isWardDropdownOpen && (
                <div className="absolute top-10 left-0 z-50 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl py-2 w-64 max-h-60 overflow-y-auto animate-enter">
                  <div className="px-3 py-1 text-[10px] font-['JetBrains_Mono'] text-[#6d7a72] font-bold uppercase">
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
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#F1F5F9] transition-colors truncate ${
                        selectedWard === w ? "text-[#006948] font-bold bg-[#ECFDF5]" : "text-[#0F172A]"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Refresh Button */}
            <button
              onClick={loadFeedData}
              disabled={isLoadingFeed}
              className="p-2 text-[#006948] hover:bg-[#dae2fd]/40 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title="Refresh Feed"
            >
              <span className={`material-symbols-outlined text-xl ${isLoadingFeed ? "animate-spin" : ""}`}>
                refresh
              </span>
            </button>

            {/* Search Input */}
            <div className="hidden md:flex items-center bg-white border border-[#bccac0]/60 rounded-full px-3.5 py-1.5 focus-within:border-[#006948] focus-within:ring-2 focus-within:ring-[#006948]/10 transition-all">
              <span className="material-symbols-outlined text-base text-[#6d7a72]">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent focus:outline-none text-xs ml-2 w-44 text-[#131b2e] placeholder:text-[#6d7a72]"
                placeholder="Search cleanups..."
                type="text"
              />
            </div>

            {/* User XP Pill */}
            <div className="hidden md:flex items-center gap-2 bg-[#dae2fd]/30 px-3 py-1.5 rounded-full border border-[#dae2fd]">
              <span className="font-['JetBrains_Mono'] text-xs text-[#006948] font-bold">
                {streaksCount} 🔥 • {karmaPoints} XP
              </span>
            </div>

            {/* Profile Avatar link */}
            <Link
              href={userProfileLink}
              className="w-9 h-9 rounded-full bg-[#00855d] flex items-center justify-center overflow-hidden border-2 border-[#006948]/30 cursor-pointer hover:scale-105 transition-transform shrink-0"
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

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-full transition-all cursor-pointer flex items-center gap-1"
              title="Sign Out of Session"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-filters horizontal bar */}
        <div className="w-full overflow-x-auto hide-scrollbar px-4 py-2 flex gap-2 border-t border-[#dae2fd]/40 max-w-6xl mx-auto md:px-8">
          <button
            onClick={() => setActiveFilter("nearby")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-['JetBrains_Mono'] text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "nearby"
                ? "bg-[#006948] text-white shadow-xs"
                : "bg-white text-[#3d4a42] border border-[#bccac0]/60 hover:bg-[#F1F5F9]"
            }`}
          >
            Nearby
          </button>
          <button
            onClick={() => setActiveFilter("top")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-['JetBrains_Mono'] text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "top"
                ? "bg-[#006948] text-white shadow-xs"
                : "bg-white text-[#3d4a42] border border-[#bccac0]/60 hover:bg-[#F1F5F9]"
            }`}
          >
            Top Cleanups
          </button>
          <button
            onClick={() => setActiveFilter("challenge")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-['JetBrains_Mono'] text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "challenge"
                ? "bg-[#006948] text-white shadow-xs"
                : "bg-white text-[#3d4a42] border border-[#bccac0]/60 hover:bg-[#F1F5F9]"
            }`}
          >
            Ward Challenges
          </button>
          <button
            onClick={() => setActiveFilter("following")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full font-['JetBrains_Mono'] text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "following"
                ? "bg-[#006948] text-white shadow-xs"
                : "bg-white text-[#3d4a42] border border-[#bccac0]/60 hover:bg-[#F1F5F9]"
            }`}
          >
            Following
          </button>
        </div>
      </header>

      {/* MAIN FEED CANVAS */}
      <main className="max-w-xl mx-auto px-4 md:px-0 flex flex-col gap-6 md:gap-8 mt-2">
        {isLoadingFeed ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-4xl text-[#006948] animate-spin">
              progress_activity
            </span>
            <p className="text-xs font-['JetBrains_Mono'] text-[#6d7a72] font-bold">
              Fetching latest civic cleanup posts...
            </p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="bg-white rounded-[24px] p-8 text-center border border-[#E2E8F0] shadow-xs my-8">
            <span className="material-symbols-outlined text-4xl text-[#6d7a72] mb-2">search_off</span>
            <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e]">No Cleanup Posts Found</h3>
            <p className="text-xs text-[#6d7a72] mt-1">Try switching locality ward or resetting search keywords.</p>
            <button
              onClick={() => {
                setSelectedWard("All Wards Territory");
                setSearchQuery("");
                setActiveFilter("nearby");
              }}
              className="mt-4 bg-[#006948] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-[#00855d] transition-colors"
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
                className="feed-card bg-white rounded-[24px] overflow-hidden flex flex-col transition-all duration-300 shadow-sm border border-[#E2E8F0]"
              >
                {/* Dual Attribution Header */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <Link
                        href={`/profile/${encodeURIComponent(item.cleanerUsername || item.cleanerName)}`}
                        className="w-10 h-10 rounded-full border-2 border-white overflow-hidden z-10 relative shadow-xs hover:scale-105 transition-transform"
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
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#006948] rounded-full border-2 border-white"></div>
                      </Link>
                      <Link
                        href={`/profile/${encodeURIComponent(item.reporterUsername || item.reporterName)}`}
                        className="w-10 h-10 rounded-full border-2 border-white overflow-hidden z-0 shadow-xs hover:scale-105 transition-transform"
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
                          className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e] hover:text-[#006948] transition-colors"
                        >
                          {item.cleanerName}
                        </Link>
                        <span className="text-[#6d7a72] text-xs font-semibold">&amp;</span>
                        <Link
                          href={`/profile/${encodeURIComponent(item.reporterUsername || item.reporterName)}`}
                          className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e] hover:text-[#006948] transition-colors"
                        >
                          {item.reporterName}
                        </Link>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-semibold">
                        {item.timestamp} • {item.ward}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.isBackendPost && (
                      <span className="bg-[#ECFDF5] text-[#006948] font-['JetBrains_Mono'] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#006948]/20">
                        LIVE
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      className="text-[#6d7a72] hover:text-[#131b2e] transition-colors p-1.5 rounded-full hover:bg-[#F1F5F9] cursor-pointer"
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

                {/* Gemini AI Audit Proof Banner */}
                <div className="bg-[#00855d]/10 px-5 py-3 border-b border-[#00855d]/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#006948]/15 flex items-center justify-center text-[#006948]">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-['JetBrains_Mono'] text-[11px] font-extrabold text-[#006948] uppercase tracking-wider">
                          Gemini Verified
                        </span>
                        <span className="text-[#006948]/50 text-[10px]">•</span>
                        <span className="font-['Inter'] text-xs text-[#3d4a42] font-semibold">
                          Site Cleared in {item.geminiTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#006948] px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      bolt
                    </span>
                    <span className="font-['JetBrains_Mono'] text-xs text-white font-extrabold">
                      +{item.xpBonus} XP
                    </span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-5">
                    {/* Cheer Button */}
                    <button
                      onClick={() => handleCheerToggle(item.id)}
                      className={`flex items-center gap-1.5 group cursor-pointer transition-colors ${
                        item.isCheered ? "text-[#ef4444]" : "text-[#3d4a42] hover:text-[#131b2e]"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-xl transition-transform group-active:scale-75 ${
                          item.isCheered ? "text-[#ef4444]" : ""
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

                  {/* Share button */}
                  <button
                    onClick={() => handleShare(item)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#E2E8F0]/60 hover:bg-[#E2E8F0] text-[#131b2e] transition-colors cursor-pointer"
                    title="Share Post"
                  >
                    <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </button>
                </div>

                {/* Caption Content */}
                <div className="px-5 py-4 bg-white flex items-center justify-between">
                  <Link href={`/feed/${item.id}`} className="block group flex-1 mr-4">
                    <p className="font-['Inter'] text-sm text-[#131b2e] leading-relaxed group-hover:text-[#006948] transition-colors cursor-pointer">
                      <span className="font-['Hanken_Grotesk'] font-bold text-sm mr-1.5">
                        {item.cleanerName}
                      </span>
                      {item.caption}
                    </p>
                  </Link>

                  <Link
                    href={`/feed/${item.id}`}
                    className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
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
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#eaedff]/90 backdrop-blur-md border-t border-[#dae2fd] shadow-lg rounded-t-full">
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/"
        >
          <span className="material-symbols-outlined mb-0.5">map</span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Map</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center bg-[#00855d] text-white rounded-full px-4 py-1.5 shadow-xs"
          href="/feed"
        >
          <span className="material-symbols-outlined mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            rss_feed
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-bold">Feed</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center -translate-y-3 active:scale-90 transition-transform"
          href="/"
        >
          <div className="w-12 h-12 bg-[#006948] rounded-full shadow-md flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] mt-0.5 text-[#3d4a42]">Report</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/reward"
        >
          <span className="material-symbols-outlined mb-0.5">military_tech</span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Quests</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href={userProfileLink}
        >
          <span className="material-symbols-outlined mb-0.5">person</span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
