"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profileApi, feedsApi, FeedPost } from "@/lib/api";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import FeedCardSkeleton from "@/components/FeedCardSkeleton";

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
        currentUserId = profileRes.user?._id;
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

        const liked = userLikes.some((item: any) => {
          const pid = item?.postId?._id || item?.postId || item;
          return pid && pid.toString() === post._id?.toString();
        });
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

    if (nextCheered) triggerToast("Cheered for this cleanup! 🎉");
    else triggerToast("Cheer removed.");

    if (postData?._id) {
      try {
        const res = await feedsApi.toggleLike(postData._id, basicUser?._id);
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
  const cleanerUserId = cleanerUser?.username || cleanerUser?._id || "Rajesh Kumar";
  const cleanerAvatar = getAvatarUrl(cleanerUser) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80";

  const reporterName = reporterUser?.username || reporterUser?.name || "Aswin V.";
  const reporterUserId = reporterUser?.username || reporterUser?._id || "Aswin V.";
  const reporterAvatar = getAvatarUrl(reporterUser) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  const beforeImg = postData?.imageBefore || DEFAULT_BEFORE_IMG;
  const afterImg = postData?.imageAfter || DEFAULT_AFTER_IMG;
  const ward = postData?.geolocation?.address || "Ward 14, Ottapalam";
  const description = postData?.description || postData?.postName || "MG Road culvert cleared of plastic debris before monsoon rains. Great teamwork!";
  const timestampText = formatTimeAgo(postData?.createdAt) || "2 hrs ago";
  const coordsText = postData?.geolocation?.coordinates ? `${postData.geolocation.coordinates[1]}° N, ${postData.geolocation.coordinates[0]}° E` : "10.7749° N, 76.3812° E";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#131b2e] font-['Inter'] antialiased selection:bg-[#85f8c4] selection:text-[#002114] pb-24 md:pb-12 pt-20">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-[#006948] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#85f8c4]/30 flex items-center gap-3 animate-enter">
          <span className="material-symbols-outlined text-[#85f8c4]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* STICKY TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#faf8ff]/90 backdrop-blur-md border-b border-[#dae2fd]">
        <div className="flex items-center px-4 md:px-6 h-16 w-full max-w-4xl mx-auto justify-between">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-[#006948] hover:bg-[#eaedff] transition-colors p-2 rounded-full active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
            <span className="font-['Hanken_Grotesk'] text-sm font-bold hidden sm:inline">Back to Feed</span>
          </Link>

          <h1 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] truncate max-w-[200px] sm:max-w-md">
            Cleanup Case Details
          </h1>

          <button
            onClick={handleShare}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#131b2e] transition-colors cursor-pointer"
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
          <article className="feed-card bg-white rounded-[24px] overflow-hidden flex flex-col shadow-sm border border-[#E2E8F0]">
            {/* Dual Attribution Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <Link
                    href={`/profile/${encodeURIComponent(cleanerUserId)}`}
                    className="w-11 h-11 rounded-full border-2 border-white overflow-hidden z-10 relative shadow-xs hover:scale-105 transition-transform"
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
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#006948] rounded-full border-2 border-white"></div>
                  </Link>
                  <Link
                    href={`/profile/${encodeURIComponent(reporterUserId)}`}
                    className="w-11 h-11 rounded-full border-2 border-white overflow-hidden z-0 shadow-xs hover:scale-105 transition-transform"
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
                      className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e] hover:text-[#006948] transition-colors"
                    >
                      {cleanerName}
                    </Link>
                    <span className="text-[#6d7a72] text-xs font-semibold">&amp;</span>
                    <Link
                      href={`/profile/${encodeURIComponent(reporterUserId)}`}
                      className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e] hover:text-[#006948] transition-colors"
                    >
                      {reporterName}
                    </Link>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-xs text-[#6d7a72] font-semibold">
                    {timestampText} • {ward}
                  </span>
                </div>
              </div>

              <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] bg-[#85f8c4]/30 px-3 py-1 rounded-full border border-[#006948]/20">
                RESOLVED CASE
              </span>
            </div>

            {/* Media (4:5 Before/After Comparison Slider) */}
            <BeforeAfterSlider
              beforeImg={beforeImg}
              afterImg={afterImg}
              aspectRatio="4/5"
            />

            {/* Gemini AI Audit Proof Banner */}
            <div className="bg-[#00855d]/10 px-6 py-4 border-b border-[#00855d]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#006948]/15 flex items-center justify-center text-[#006948]">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-['JetBrains_Mono'] text-xs font-extrabold text-[#006948] uppercase tracking-wider">
                      Gemini AI Verified Clean
                    </span>
                    <span className="text-[#006948]/50 text-xs">•</span>
                    <span className="font-['Inter'] text-xs text-[#3d4a42] font-semibold">
                      Site Cleared in 3.5 Hours
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6d7a72] mt-0.5 font-['JetBrains_Mono']">
                    Confidence Score: 98.4% • Zero Strikes Audit
                  </p>
                </div>
              </div>

              <div className="bg-[#006948] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bolt
                </span>
                <span className="font-['JetBrains_Mono'] text-xs text-white font-extrabold">+200 XP</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0]">
              <button
                onClick={handleCheerToggle}
                className={`flex items-center gap-2 group cursor-pointer transition-colors ${
                  isCheered ? "text-[#ef4444]" : "text-[#3d4a42] hover:text-[#131b2e]"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl transition-transform group-active:scale-75 ${
                    isCheered ? "text-[#ef4444]" : ""
                  }`}
                  style={{ fontVariationSettings: isCheered ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
                <span className="font-['Hanken_Grotesk'] text-base font-bold">{cheersCount} Cheers</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E2E8F0]/60 hover:bg-[#E2E8F0] text-[#131b2e] transition-colors cursor-pointer"
                title="Share"
              >
                <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>
            </div>

            {/* Description & Incident Metadata */}
            <div className="p-6 bg-white flex flex-col gap-5">
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mb-1">
                  {postData?.postName || "Civic Spot Cleanup & Waste Segregation"}
                </h3>
                <p className="text-sm text-[#3d4a42] leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Incident Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-bold uppercase block">
                    GPS GEOTAG
                  </span>
                  <span className="font-['Inter'] text-xs font-semibold text-[#0F172A]">
                    {coordsText}
                  </span>
                </div>
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-bold uppercase block">
                    WASTE COLLECTED
                  </span>
                  <span className="font-['Inter'] text-xs font-semibold text-[#006948]">
                    42 kg (Plastics &amp; Silt)
                  </span>
                </div>
                <div>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-bold uppercase block">
                    RESPONSE TIME
                  </span>
                  <span className="font-['Inter'] text-xs font-semibold text-[#0F172A]">
                    3 Hours 30 Mins
                  </span>
                </div>
              </div>
            </div>
          </article>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#eaedff]/90 backdrop-blur-md border-t border-[#dae2fd] shadow-lg rounded-t-full">
        <Link className="flex flex-col items-center justify-center text-[#3d4a42] w-16" href="/">
          <span className="material-symbols-outlined mb-0.5">map</span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Map</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#006948] font-bold w-16" href="/feed">
          <span className="material-symbols-outlined mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
            rss_feed
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Feed</span>
        </Link>
        <Link className="flex flex-col items-center justify-center -translate-y-3" href="/">
          <div className="w-12 h-12 bg-[#006948] rounded-full shadow-md flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] mt-0.5 text-[#3d4a42]">Report</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#3d4a42] w-16" href="/reward">
          <span className="material-symbols-outlined mb-0.5">military_tech</span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Rewards</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#3d4a42] w-16" href="/profile">
          <span className="material-symbols-outlined mb-0.5">person</span>
          <span className="font-['JetBrains_Mono'] text-[10px]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
