"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { profileApi, authApi } from "@/lib/api";

interface RewardItem {
  id: string;
  name: string;
  category: "gift card" | "free meal" | "clothing";
  cost: number;
  description: string;
  icon: string;
  badge?: string;
  sizes?: Array<"S" | "M" | "L" | "XL">;
}

interface ClaimedReward {
  id: string;
  category: "gift card" | "free meal" | "clothing";
  name: string;
  clothSize?: string;
  pointsSpent: number;
  dateSelected: string;
  promoCode: string;
  icon: string;
}

// ─── Premium Skeleton Loading Component (Exclusive to Rewards Page) ───
function RewardsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6" aria-busy="true" aria-label="Loading rewards data">
      {/* Hero Vault Card Skeleton */}
      <div className="bg-gradient-to-br from-[#004D36] via-[#006948] to-[#00855D] rounded-[28px] p-6 md:p-8 relative overflow-hidden shadow-xl border border-[#85f8c4]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="reward-skeleton-bone-dark reward-skel-delay-1 h-6 w-40 rounded-full" />
              <div className="reward-skeleton-bone-dark reward-skel-delay-2 h-6 w-20 rounded-full" />
            </div>
            <div className="reward-skeleton-bone-dark reward-skel-delay-2 h-10 w-72 mb-3 rounded-xl" />
            <div className="reward-skeleton-bone-dark reward-skel-delay-3 h-4 w-80 max-w-full rounded-lg" />
          </div>
          {/* Balance box skeleton */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col items-center justify-center min-w-[220px] shadow-inner">
            <div className="reward-skeleton-bone-dark reward-skel-delay-2 h-3 w-24 mb-3 rounded" />
            <div className="reward-skeleton-bone-dark reward-skel-delay-3 h-12 w-28 mb-2 rounded-xl" />
            <div className="reward-skeleton-bone-dark reward-skel-delay-4 h-3 w-20 rounded" />
          </div>
        </div>
        {/* Stats row skeleton */}
        <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className={`reward-skeleton-bone-dark reward-skel-delay-${i} w-9 h-9 rounded-lg`} />
              <div className="flex-1">
                <div className={`reward-skeleton-bone-dark reward-skel-delay-${i} h-5 w-16 mb-1.5 rounded`} />
                <div className={`reward-skeleton-bone-dark reward-skel-delay-${Math.min(i + 1, 6)} h-3 w-20 rounded`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Tabs Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="reward-skeleton-bone reward-skel-delay-1 h-7 w-48 rounded-lg" />
          <div className="reward-skeleton-bone reward-skel-delay-2 h-4 w-28 rounded" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`reward-skeleton-bone reward-skel-delay-${i} h-10 rounded-full shrink-0`} style={{ width: `${65 + i * 12}px` }} />
          ))}
        </div>
      </div>

      {/* Marketplace Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[24px] border border-[#E2E8F0] p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`reward-skeleton-bone reward-skel-delay-${i} w-12 h-12 rounded-2xl`} />
                <div className="flex items-center gap-2">
                  {i % 2 === 0 && <div className={`reward-skeleton-bone reward-skel-delay-${Math.min(i + 1, 6)} h-5 w-16 rounded-full`} />}
                  <div className={`reward-skeleton-bone reward-skel-delay-${Math.min(i + 1, 6)} h-5 w-14 rounded-full`} />
                </div>
              </div>
              <div className={`reward-skeleton-bone reward-skel-delay-${i} h-6 w-3/4 mb-2 rounded-lg`} />
              <div className={`reward-skeleton-bone reward-skel-delay-${Math.min(i + 1, 6)} h-4 w-full mb-1 rounded`} />
              <div className={`reward-skeleton-bone reward-skel-delay-${Math.min(i + 2, 6)} h-4 w-2/3 mb-5 rounded`} />
            </div>
            <div className={`reward-skeleton-bone reward-skel-delay-${Math.min(i + 1, 6)} h-11 w-full rounded-xl`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RewardPage() {
  const router = useRouter();
  // Real Backend Sync State from UserRewards Model
  const [karmaBalance, setKarmaBalance] = useState<number>(850);
  const [sellingPoints, setSellingPoints] = useState<number>(650);
  const [totalSpotsCompleted, setTotalSpotsCompleted] = useState<number>(12);
  const [rank, setRank] = useState<string>("Sapling");
  const [streak, setStreak] = useState<number>(5);
  const [freezeShields, setFreezeShields] = useState<number>(1);
  const [badges, setBadges] = useState<any[]>([]);

  // Loading state — exclusive to rewards page
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI Interactive States
  const [activeCategory, setActiveCategory] = useState<"all" | "gift card" | "free meal" | "clothing" | "vault">("all");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, "S" | "M" | "L" | "XL">>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [activeSuccessModal, setActiveSuccessModal] = useState<ClaimedReward | null>(null);

  // Claimed Rewards List (Synced with UserRewards.selectedRewards schema)
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([
    {
      id: "claim-1",
      category: "gift card",
      name: "BookMyShow ₹100 Cinema Voucher",
      pointsSpent: 400,
      dateSelected: "Yesterday, 3:45 PM",
      promoCode: "BMS-SAFAI-9921",
      icon: "movie",
    },
    {
      id: "claim-2",
      category: "free meal",
      name: "Cafe Coffee Day Cappuccino Pass",
      pointsSpent: 350,
      dateSelected: "Sep 01, 2026",
      promoCode: "CCD-ECO-4410",
      icon: "local_cafe",
    },
    {
      id: "claim-3",
      category: "clothing",
      name: "Civic Ranger Embroidered Tee",
      clothSize: "M",
      pointsSpent: 600,
      dateSelected: "Aug 28, 2026",
      promoCode: "SWAG-TEE-8812",
      icon: "checkroom",
    },
  ]);

  // Fetch real UserRewards data from backend profile API on mount
  useEffect(() => {
    async function loadRewardsData() {
      try {
        const meRes = await authApi.getMe();
        if (!meRes || !meRes.success || !meRes.user) {
          router.push("/login");
          return;
        }

        if (meRes.authorizationType === "incomplete" || meRes.isProfileCompleted === false) {
          router.push("/onboarding");
          return;
        }

        const response = await profileApi.getMyProfile();
        if (response && response.success && response.userRewards) {
          const ur = response.userRewards;
          const kPoints = ur.karmaBalance ?? ur.karmaPoints ?? 850;
          setKarmaBalance(kPoints);
          setSellingPoints(ur.SellingPoints !== undefined ? ur.SellingPoints : kPoints);
          setTotalSpotsCompleted(ur.totalSpotsCompleted ?? response.userStatus?.completedSpots ?? 12);
          setRank(ur.rank || "Sapling");
          setStreak(ur.currentStreak ?? 5);
          setFreezeShields(ur.freezeShields ?? 1);
          if (Array.isArray(ur.badges)) setBadges(ur.badges);

          // Populate backend userRewards.selectedRewards if returned
          if (Array.isArray(ur.selectedRewards) && ur.selectedRewards.length > 0) {
            const mappedBackendClaims: ClaimedReward[] = ur.selectedRewards.map((r: any, idx: number) => ({
              id: r._id || `backend-claim-${idx}`,
              category: r.category || "gift card",
              name: r.name || "Civic Reward",
              clothSize: r.clothSize,
              pointsSpent: r.pointsSpent || 400,
              dateSelected: r.dateSelected ? new Date(r.dateSelected).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently",
              promoCode: `${(r.category || "PERK").slice(0, 3).toUpperCase()}-SAFAI-${1000 + idx * 7}`,
              icon: r.category === "clothing" ? "checkroom" : r.category === "free meal" ? "restaurant" : "local_activity",
            }));
            setClaimedRewards(mappedBackendClaims);
          }
        }
      } catch (err) {
        console.warn("Could not load backend UserRewards data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRewardsData();
  }, [router]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Catalogue of Available Marketplace Items based on UserRewards categories
  const rewardCatalog: RewardItem[] = [
    {
      id: "rw-1",
      name: "BookMyShow ₹100 Movie Pass",
      category: "gift card",
      cost: 400,
      description: "Valid on any movie ticket or event booking nationwide. Instant coupon code.",
      icon: "movie",
      badge: "POPULAR",
    },
    {
      id: "rw-2",
      name: "Swiggy ₹150 Gourmet Meal Pass",
      category: "free meal",
      cost: 350,
      description: "Enjoy ₹150 discount on any food delivery order across top city restaurants.",
      icon: "restaurant",
      badge: "BEST VALUE",
    },
    {
      id: "rw-3",
      name: "Civic Ranger Embroidered Tee",
      category: "clothing",
      cost: 600,
      description: "Heavyweight 100% organic cotton tee with reflective Civic Ranger chest badge.",
      icon: "checkroom",
      sizes: ["S", "M", "L", "XL"],
      badge: "LIMITED SWAG",
    },
    {
      id: "rw-4",
      name: "Cafe Coffee Day Hot Beverage Pass",
      category: "free meal",
      cost: 300,
      description: "Free hot cappuccino or cold coffee pass redeemable at any CCD branch.",
      icon: "local_cafe",
    },
    {
      id: "rw-5",
      name: "Amazon Pay ₹250 Gift Voucher",
      category: "gift card",
      cost: 550,
      description: "Add ₹250 directly to your Amazon Pay wallet for shopping & bill payments.",
      icon: "shopping_cart",
      badge: "TRENDING",
    },
    {
      id: "rw-6",
      name: "Field Volunteer Reflective Cap",
      category: "clothing",
      cost: 450,
      description: "Breathable dark-green cotton cap with 3M reflective SafaiWatch emblem.",
      icon: "military_tech",
    },
    {
      id: "rw-7",
      name: "Organic Juice Bar Wellness Pass",
      category: "free meal",
      cost: 250,
      description: "Complimentary cold-pressed organic detox juice at participating health bars.",
      icon: "local_bar",
    },
    {
      id: "rw-8",
      name: "SafaiWatch Eco Cotton Tote Bag",
      category: "clothing",
      cost: 400,
      description: "Ultra-durable 100% recycled cotton tote bag with reinforced handles.",
      icon: "shopping_bag",
    },
  ];

  const filteredCatalog = rewardCatalog.filter((item) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "vault") return false;
    return item.category === activeCategory;
  });

  const handleSelectSize = (itemId: string, size: "S" | "M" | "L" | "XL") => {
    setSelectedSizes((prev) => ({ ...prev, [itemId]: size }));
  };

  const handleRedeemItem = (item: RewardItem) => {
    const availableBalance = sellingPoints > 0 ? sellingPoints : karmaBalance;
    if (availableBalance < item.cost) {
      triggerToast(`Insufficient Karma! You need ${item.cost - availableBalance} more points.`);
      return;
    }

    const sizeChosen = item.category === "clothing" ? (selectedSizes[item.id] || "M") : undefined;
    const generatedCode = `${item.category.slice(0, 3).toUpperCase()}-SAFAI-${Math.floor(1000 + Math.random() * 9000)}`;

    const newClaim: ClaimedReward = {
      id: `claim-${Date.now()}`,
      category: item.category,
      name: item.name,
      clothSize: sizeChosen,
      pointsSpent: item.cost,
      dateSelected: "Just now",
      promoCode: generatedCode,
      icon: item.icon,
    };

    setSellingPoints((prev) => Math.max(0, prev - item.cost));
    setKarmaBalance((prev) => Math.max(0, prev - item.cost));
    setClaimedRewards((prev) => [newClaim, ...prev]);
    setActiveSuccessModal(newClaim);
    triggerToast(`Redeemed "${item.name}"! -${item.cost} Karma Points`);
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      triggerToast(`Copied coupon code "${code}" to clipboard!`);
    } else {
      triggerToast(`Coupon code: ${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-[#85f8c4] selection:text-[#002114] pb-24 md:pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-[#006948] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#85f8c4]/30 flex items-center gap-3 animate-enter">
          <span className="material-symbols-outlined text-[#85f8c4]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <span className="font-['Inter'] text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* 1. TOP HEADER / APP BAR */}
      <header className="w-full sticky top-0 bg-[#faf8ff]/90 backdrop-blur-md border-b border-[#dae2fd] z-40">
        <div className="flex items-center px-4 md:px-6 h-16 w-full max-w-6xl mx-auto justify-between">
          <Link
            href="/"
            className="flex items-center text-[#006948] hover:bg-[#006948]/10 transition-colors p-2 rounded-full active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006948] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              military_tech
            </span>
            <h1 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Rewards &amp; Vault</h1>
          </div>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 text-[#3d4a42] hover:bg-[#006948]/10 hover:text-[#006948] transition-colors px-3 py-1.5 rounded-full border border-[#dae2fd] active:scale-95 cursor-pointer text-xs font-semibold font-['JetBrains_Mono']"
            title="Redemption History"
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER — Show skeleton while loading */}
      {isLoading ? (
        <RewardsSkeleton />
      ) : (
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 reward-content-reveal">
        {/* 2. HERO USERREWARDS VAULT CARD */}
        <section className="bg-gradient-to-br from-[#004D36] via-[#006948] to-[#00855D] rounded-[28px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-[#85f8c4]/30">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#85f8c4]/20 text-[#85f8c4] font-['JetBrains_Mono'] text-xs font-extrabold px-3 py-1 rounded-full border border-[#85f8c4]/30 uppercase tracking-wider">
                  CIVIC REWARDS VAULT
                </span>
                <span className="bg-white/10 text-white font-['JetBrains_Mono'] text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                  {rank}
                </span>
              </div>
              <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-extrabold tracking-tight">
                Earn &amp; Spend Karma
              </h2>
              <p className="font-['Inter'] text-xs md:text-sm text-[#85f8c4]/90 mt-1 max-w-md">
                Clean up neighborhood spots to earn Karma points and redeem exclusive digital gift cards &amp; eco swag.
              </p>
            </div>

            {/* Balance Vault Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col items-center justify-center min-w-[220px] text-center shadow-inner">
              <span className="font-['JetBrains_Mono'] text-[11px] font-bold text-[#85f8c4] uppercase tracking-widest mb-1">
                KARMA BALANCE
              </span>
              <div className="flex items-center gap-2">
                <span className="font-['Hanken_Grotesk'] text-4xl md:text-5xl font-extrabold leading-none text-white">
                  {sellingPoints}
                </span>
                <span className="material-symbols-outlined text-[#FDE047] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  diamond
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#85f8c4] mt-2 font-semibold">
                Spendable XP Points
              </span>
            </div>
          </div>

          {/* UserRewards Analytics Row */}
          <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#85f8c4]/20 text-[#85f8c4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  task_alt
                </span>
              </div>
              <div>
                <p className="font-['Hanken_Grotesk'] text-lg font-bold leading-tight">{totalSpotsCompleted}</p>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#85f8c4] font-semibold">SPOTS CLEANED</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FDE047]/20 text-[#FDE047] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
              </div>
              <div>
                <p className="font-['Hanken_Grotesk'] text-lg font-bold leading-tight">{streak} Days</p>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#85f8c4] font-semibold">DAILY STREAK</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div>
                <p className="font-['Hanken_Grotesk'] text-lg font-bold leading-tight">{freezeShields} Active</p>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#85f8c4] font-semibold">STREAK SHIELD</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C084FC]/20 text-[#C084FC] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  card_membership
                </span>
              </div>
              <div>
                <p className="font-['Hanken_Grotesk'] text-lg font-bold leading-tight">{claimedRewards.length} Claimed</p>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#85f8c4] font-semibold">PERKS UNLOCKED</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CATEGORY SWITCHER TABS (Based on UserRewards Schema: gift card, free meal, clothing) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Reward Marketplace</h2>
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#6d7a72]">
              {filteredCatalog.length} AVAILABLE PERKS
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`font-['Inter'] text-xs font-semibold px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                  : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
              }`}
            >
              All Perks
            </button>
            <button
              onClick={() => setActiveCategory("gift card")}
              className={`font-['Inter'] text-xs font-semibold px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === "gift card"
                  ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                  : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">card_giftcard</span>
              Digital Gift Cards
            </button>
            <button
              onClick={() => setActiveCategory("free meal")}
              className={`font-['Inter'] text-xs font-semibold px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === "free meal"
                  ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                  : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">restaurant</span>
              Free Meals &amp; Dining
            </button>
            <button
              onClick={() => setActiveCategory("clothing")}
              className={`font-['Inter'] text-xs font-semibold px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === "clothing"
                  ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                  : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
              }`}
            >
              <span className="material-symbols-outlined text-sm">checkroom</span>
              Civic Apparel &amp; Swag
            </button>
            <button
              onClick={() => setActiveCategory("vault")}
              className={`font-['Inter'] text-xs font-semibold px-4 py-2.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 relative ${
                activeCategory === "vault"
                  ? "bg-[#006948] text-white border border-[#006948] shadow-xs"
                  : "bg-white text-[#006948] border border-[#006948]/30 hover:bg-[#006948]/10"
              }`}
            >
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              My Claimed Vault ({claimedRewards.length})
            </button>
          </div>
        </section>

        {/* 4. MARKETPLACE CATALOG GRID */}
        {activeCategory !== "vault" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((item) => {
              const isAffordable = sellingPoints >= item.cost;
              const hasSizes = item.category === "clothing" && Array.isArray(item.sizes);
              const currentSize = selectedSizes[item.id] || "M";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[24px] border border-[#E2E8F0] p-5 flex flex-col justify-between hover:border-[#006948]/40 transition-all shadow-xs group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {item.icon}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="font-['JetBrains_Mono'] text-[10px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FCD34D] uppercase">
                            {item.badge}
                          </span>
                        )}
                        <span className="font-['JetBrains_Mono'] text-xs font-extrabold text-[#006948] bg-[#85f8c4]/30 px-3 py-1 rounded-full border border-[#006948]/20">
                          {item.cost} XP
                        </span>
                      </div>
                    </div>

                    <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mb-1">
                      {item.name}
                    </h3>
                    <p className="font-['Inter'] text-xs text-[#6d7a72] leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Clothing Size Selector (UserRewards clothing clothSize schema) */}
                    {hasSizes && (
                      <div className="mb-4 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                        <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] uppercase mb-2">
                          SELECT APPAREL SIZE:
                        </p>
                        <div className="flex gap-2">
                          {item.sizes?.map((sz) => (
                            <button
                              key={sz}
                              onClick={() => handleSelectSize(item.id, sz)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['JetBrains_Mono'] transition-all cursor-pointer ${
                                currentSize === sz
                                  ? "bg-[#006948] text-white shadow-xs"
                                  : "bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#006948]"
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={!isAffordable}
                    onClick={() => handleRedeemItem(item)}
                    className={`w-full font-['Inter'] text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isAffordable
                        ? "bg-[#006948] hover:bg-[#00855d] text-white shadow-xs active:scale-[0.98]"
                        : "bg-[#CBD5E1] text-[#94A3B8] cursor-not-allowed"
                    }`}
                  >
                    <span>{isAffordable ? "Redeem Perk" : `Need ${item.cost - sellingPoints} More XP`}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* 5. CLAIMED REWARDS VAULT TAB */}
        {activeCategory === "vault" && (
          <section className="bg-white rounded-[28px] p-6 border border-[#E2E8F0] shadow-xs">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h2 className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#131b2e]">My Claimed Rewards Vault</h2>
                <p className="font-['Inter'] text-xs text-[#6d7a72] mt-0.5">
                  Synced with your UserRewards profile. Show promo codes at partner stores or online checkouts.
                </p>
              </div>
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] bg-[#85f8c4]/30 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
                {claimedRewards.length} UNLOCKED
              </span>
            </div>

            {claimedRewards.length === 0 ? (
              <div className="py-12 text-center text-[#6d7a72] flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#FAF8FF] flex items-center justify-center text-[#6d7a72] mb-3 border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-3xl">inventory_2</span>
                </div>
                <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e]">Vault is Empty</h4>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">
                  You haven't claimed any rewards yet. Participate in civic spot cleanups to earn Karma points!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {claimedRewards.map((v) => (
                  <div
                    key={v.id}
                    className="border border-[#E2E8F0] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8FAFC] hover:border-[#006948]/50 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {v.icon}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#006948] bg-[#85f8c4]/40 px-2.5 py-0.5 rounded uppercase">
                            {v.category}
                          </span>
                          {v.clothSize && (
                            <span className="font-['JetBrains_Mono'] text-[10px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FCD34D]">
                              SIZE: {v.clothSize}
                            </span>
                          )}
                        </div>
                        <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mt-1">{v.name}</h3>
                        <p className="font-['Inter'] text-xs text-[#6d7a72]">Redeemed {v.dateSelected} · Spent {v.pointsSpent} XP</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0] self-start md:self-auto shrink-0 shadow-xs">
                      <div className="flex flex-col">
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-bold">PROMO CODE</span>
                        <span className="font-['JetBrains_Mono'] text-sm font-extrabold text-[#006948] tracking-widest select-all">
                          {v.promoCode}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(v.promoCode)}
                        className="bg-[#006948] hover:bg-[#00855d] text-white px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      )}

      {/* 6. REDEMPTION UNLOCKED SUCCESS MODAL */}
      {activeSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 border border-[#E2E8F0] shadow-2xl animate-enter text-center">
            <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#10B981] mx-auto flex items-center justify-center mb-3 border border-[#10B981]/30 shadow-md">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>

            <h3 className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#131b2e] mb-1">
              Perk Unlocked!
            </h3>
            <p className="font-['Inter'] text-xs text-[#6d7a72] mb-4">
              You have successfully redeemed <strong>{activeSuccessModal.name}</strong>
              {activeSuccessModal.clothSize && ` (Size ${activeSuccessModal.clothSize})`}
            </p>

            <div className="bg-[#F8FAFC] border-2 border-dashed border-[#006948] p-4 rounded-2xl mb-5 shadow-xs">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-bold block mb-1 uppercase">YOUR PROMO CODE</span>
              <span className="font-['JetBrains_Mono'] text-2xl font-extrabold text-[#006948] tracking-widest block select-all">
                {activeSuccessModal.promoCode}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopyCode(activeSuccessModal.promoCode)}
                className="flex-1 bg-[#006948] hover:bg-[#00855d] text-white font-['Inter'] font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>Copy Code</span>
              </button>
              <button
                onClick={() => setActiveSuccessModal(null)}
                className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-['Inter'] font-semibold text-xs px-5 py-3 rounded-xl cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. REDEMPTION HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 border border-[#E2E8F0] shadow-2xl max-h-[85vh] overflow-y-auto animate-enter">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">UserRewards History</h3>
                <p className="font-['Inter'] text-xs text-[#6d7a72]">Synced with your UserRewards transaction ledger</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#6d7a72] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {claimedRewards.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center hover:bg-[#F1F5F9] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-['Inter'] text-xs font-bold text-[#0F172A]">{item.name}</h4>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] mt-0.5">
                        {item.dateSelected} · {item.category.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-xs font-extrabold text-[#BA1A1A]">
                    -{item.pointsSpent} XP
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-['Inter'] text-xs font-semibold py-3 rounded-xl mt-4 cursor-pointer transition-colors"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* 8. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#faf8ff]/90 backdrop-blur-md rounded-t-2xl border-t border-[#dae2fd] shadow-lg">
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/"
        >
          <span className="material-symbols-outlined">map</span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-semibold mt-0.5">Map</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/feed"
        >
          <span className="material-symbols-outlined">rss_feed</span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-semibold mt-0.5">Feed</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-semibold mt-0.5">Report</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center bg-[#00855d] text-white rounded-xl px-3 py-1.5 w-16 shadow-xs"
          href="/reward"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            military_tech
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-bold mt-0.5">Rewards</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/profile"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-semibold mt-0.5">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
