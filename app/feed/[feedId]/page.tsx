"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profileApi, feedsApi, FeedPost } from "@/lib/api";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import FeedCardSkeleton from "@/components/FeedCardSkeleton";
import NotificationPopup from "@/components/NotificationPopup";
import BottomNav from "@/components/BottomNav";

interface PageProps {
  params: Promise<{ feedId: string }>;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
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

export default function SingleFeedPostPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const feedId = resolvedParams.feedId || "item-1";

  // Basic User Info
  const [basicUser, setBasicUser] = useState<any>(null);

  // Interactive & Post Details State
  const [postData, setPostData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cheersCount, setCheersCount] = useState<number>(142);
  const [isCheered, setIsCheered] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentInput, setNewCommentInput] = useState<string>("");

  const fetchPostDetails = useCallback(async () => {
    setIsLoading(true);
    let currentUser: any = null;
    let userLikes: any[] = [];
    let currentUserId: string | undefined = undefined;

    try {
      const meRes = await authApi.getMe();
      if (meRes && (meRes.authorizationType === "incomplete" || meRes.isProfileCompleted === false)) {
        router.push("/onboarding");
        return;
      }

      const profileRes = await profileApi.getBasicInfo();
      if (profileRes && profileRes.success) {
        currentUser = profileRes.user;
        currentUserId = profileRes.user?.username || profileRes.user?.id;
        userLikes = profileRes.userStatus?.userLikePosts || [];
        setBasicUser(profileRes.user);
      }
    } catch (e) {
      console.warn("Could not load user profile:", e);
    }

    // Try fetching post from backend
    try {
      const res = await feedsApi.getPostById(feedId, currentUserId);
      if (res && res.success && res.post) {
        const post: FeedPost = res.post;
        setPostData(post);
        setCheersCount(post.likeCount ?? 0);

        const liked = res.isLiked !== undefined
          ? Boolean(res.isLiked)
          : (post.isLiked !== undefined
            ? Boolean(post.isLiked)
            : userLikes.some((item: any) => {
                const pid = item?.postId?._id || item?.postId || item;
                return pid && pid.toString() === post._id?.toString();
              }));
        setIsCheered(liked);
      } else {
        // Fallback mock post
        setPostData(null);
      }
    } catch (err) {
      console.error("Failed to fetch single post:", err);
      setPostData(null);
    } finally {
      setIsLoading(false);
    }
  }, [feedId, router]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  const handleCheerToggle = async () => {
    const nextCheered = !isCheered;
    const nextCount = nextCheered ? cheersCount + 1 : Math.max(0, cheersCount - 1);
    
    setIsCheered(nextCheered);
    setCheersCount(nextCount);

    if (postData?._id) {
      try {
        const res = await feedsApi.toggleLike(postData._id, basicUser?.username || basicUser?.id);
        if (res && res.success && res.likeCount !== undefined) {
          setCheersCount(res.likeCount);
          if (res.isLiked !== undefined) setIsCheered(res.isLiked);
        }
      } catch (err) {
        console.error("Error toggling like:", err);
      }
    }
  };

  const handleAddComment = () => {
    if (!newCommentInput.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: basicUser?.username || "You (Civic Ranger)",
      avatar: getAvatarUrl(basicUser),
      text: newCommentInput.trim(),
      timestamp: "Just now",
    };

    setComments((prev) => [...prev, newComment]);
    setNewCommentInput("");
    triggerToast("Comment added!");
  };

  const handleShare = () => {
    const postUrl = typeof window !== "undefined" ? `${window.location.origin}/feed/${feedId}` : `/feed/${feedId}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `SafaiWatch Post ${feedId}`,
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

  // Resolve display data (real post vs fallback mock)
  const cleanerUser = postData?.CleanedUser;
  const reporterUser = postData?.SpotedUser;
  const cleanerName = cleanerUser?.username || cleanerUser?.name || "Rajesh Kumar";
  const cleanerUserId = cleanerUser?.username || cleanerUser?.id || "Rajesh Kumar";
  const cleanerAvatar = getAvatarUrl(cleanerUser) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";

  const reporterName = reporterUser?.username || reporterUser?.name || "Aswin V.";
  const reporterUserId = reporterUser?.username || reporterUser?.id || "Aswin V.";
  const reporterAvatar = getAvatarUrl(reporterUser) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  const beforeImg = postData?.imageBefore || DEFAULT_BEFORE_IMG;
  const afterImg = postData?.imageAfter || DEFAULT_AFTER_IMG;
  const ward = postData?.geolocation?.address || "Ward 14, Ottapalam";
  const description = postData?.description || postData?.postName || "MG Road culvert cleared of plastic debris before monsoon rains. Great teamwork!";
  const timestampText = formatTimeAgo(postData?.createdAt) || "2 hrs ago";
  const coordsText = postData?.geolocation?.coordinates ? `${postData.geolocation.coordinates[1]}° N, ${postData.geolocation.coordinates[0]}° E` : "10.7749° N, 76.3812° E";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070d18] text-[#131b2e] dark:text-slate-100 font-['Inter'] antialiased selection:bg-[#85f8c4] selection:text-[#002114] pb-24 md:pb-12 pt-20">
      {/* Toast Banner */}
      {toast && (
        <NotificationPopup
          type="success"
          message={toast}
          duration={3500}
          onClose={() => setToast(null)}
          position="top-right"
        />
      )}

      {/* STICKY TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#faf8ff]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#dae2fd] dark:border-slate-800">
        <div className="flex items-center px-4 md:px-6 h-16 w-full max-w-4xl mx-auto justify-between">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-[#006948] dark:text-emerald-400 hover:bg-[#eaedff] dark:hover:bg-slate-800 transition-colors p-2 rounded-full active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
            <span className="font-['Hanken_Grotesk'] text-sm font-bold hidden sm:inline">Back to Feed</span>
          </Link>

          <h1 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
            Cleanup Case Details
          </h1>

          <button
            onClick={handleShare}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E2E8F0] dark:bg-slate-800 hover:bg-[#CBD5E1] dark:hover:bg-slate-700 text-[#131b2e] dark:text-slate-200 transition-colors cursor-pointer"
            title="Share"
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {isLoading ? (
          <FeedCardSkeleton count={1} />
        ) : (
          <article className="feed-card bg-white dark:bg-slate-900/90 rounded-[24px] overflow-hidden flex flex-col shadow-sm border border-[#E2E8F0] dark:border-slate-800">
            {/* Dual Attribution Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <Link
                    href={`/profile/${encodeURIComponent(cleanerUserId)}`}
                    className="w-11 h-11 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden z-10 relative shadow-xs hover:scale-105 transition-transform"
                    title={`View profile of ${cleanerName}`}
                  >
                    <img
                      className="w-full h-full object-cover"
                      alt={cleanerName}
                      src={cleanerAvatar}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                      }}
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#006948] dark:bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  </Link>
                  <Link
                    href={`/profile/${encodeURIComponent(reporterUserId)}`}
                    className="w-11 h-11 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden z-0 shadow-xs hover:scale-105 transition-transform"
                    title={`View profile of ${reporterName}`}
                  >
                    <img
                      className="w-full h-full object-cover"
                      alt={reporterName}
                      src={reporterAvatar}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                      }}
                    />
                  </Link>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <Link
                      href={`/profile/${encodeURIComponent(cleanerUserId)}`}
                      className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e] dark:text-slate-100 hover:text-[#006948] dark:hover:text-emerald-400 transition-colors"
                    >
                      {cleanerName}
                    </Link>
                    <span className="text-[#6d7a72] dark:text-slate-400 text-xs font-semibold">&amp;</span>
                    <Link
                      href={`/profile/${encodeURIComponent(reporterUserId)}`}
                      className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e] dark:text-slate-100 hover:text-[#006948] dark:hover:text-emerald-400 transition-colors"
                    >
                      {reporterName}
                    </Link>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-xs text-[#6d7a72] dark:text-slate-400 font-semibold">
                    {timestampText} • {ward}
                  </span>
                </div>
              </div>

              <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] dark:text-emerald-300 bg-[#85f8c4]/30 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-[#006948]/20 dark:border-emerald-600/40">
                RESOLVED CASE
              </span>
            </div>

            {/* Media (4:5 Before/After Comparison Slider) */}
            <BeforeAfterSlider
              beforeImg={beforeImg}
              afterImg={afterImg}
              aspectRatio="4/5"
            />

            {/* Action Bar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800">
              <button
                onClick={handleCheerToggle}
                className={`flex items-center gap-2 group cursor-pointer transition-colors ${
                  isCheered ? "text-[#ef4444] dark:text-rose-400" : "text-[#3d4a42] dark:text-slate-300 hover:text-[#131b2e] dark:hover:text-white"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl transition-transform group-active:scale-75 ${
                    isCheered ? "text-[#ef4444] dark:text-rose-400" : ""
                  }`}
                  style={{ fontVariationSettings: isCheered ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
                <span className="font-['Hanken_Grotesk'] text-base font-bold">{cheersCount} Cheers</span>
              </button>
            </div>

            {/* Description & Incident Metadata */}
            <div className="p-6 bg-white dark:bg-slate-900/90 flex flex-col gap-5">
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] dark:text-slate-100 mb-1">
                  {postData?.postName || "Civic Spot Cleanup & Waste Segregation"}
                </h3>
                <p className="text-sm text-[#3d4a42] dark:text-slate-300 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Incident Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F8FAFC] dark:bg-slate-800/60 p-4 rounded-2xl border border-[#E2E8F0] dark:border-slate-700/60">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] dark:text-slate-400 font-bold uppercase block">
                    GPS GEOTAG
                  </span>
                  <span className="font-['Inter'] text-xs font-semibold text-[#0F172A] dark:text-slate-200">
                    {coordsText}
                  </span>
                </div>
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] dark:text-slate-400 font-bold uppercase block">
                    WASTE COLLECTED
                  </span>
                  <span className="font-['Inter'] text-xs font-semibold text-[#006948] dark:text-emerald-400">
                    42 kg (Plastics &amp; Silt)
                  </span>
                </div>
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] dark:text-slate-400 font-bold uppercase block">
                    RESPONSE TIME
                  </span>
                  <span className="font-['Inter'] text-xs font-semibold text-[#0F172A] dark:text-slate-200">
                    3 Hours 30 Mins
                  </span>
                </div>
              </div>
            </div>
          </article>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNav userRole={basicUser?.role} />
    </div>
  );
}
