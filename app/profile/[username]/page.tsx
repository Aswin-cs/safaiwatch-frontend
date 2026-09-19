"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profileApi, spotsApi } from "@/lib/api";

interface PageProps {
  params: Promise<{ username?: string; id?: string }>;
}

interface Trophy {
  id: string;
  name: string;
  subtitle: string;
  levelTag: string;
  isUnlocked: boolean;
  type: "gold" | "silver" | "bronze" | "locked";
  icon: string;
  description: string;
  progressPercent?: number;
  unlockedDate?: string;
  karmaBonus?: number;
}

interface CaseItem {
  id: string;
  title: string;
  location: string;
  timestamp?: string;
  status: "resolved" | "in_progress";
  karmaChange?: number;
  badgeText: string;
  badgeType: "green" | "yellow" | "red";
  image: string;
  imageAfter?: string;
  caseType?: string;
  description?: string;
  markedBy?: string;
  assignedTo?: string;
  completedBy?: string;
  markedAt?: string;
  completedAt?: string;
  assignedAt?: string;
  critical?: string;
}

interface Voucher {
  id: string;
  title: string;
  category: string;
  cost: number;
  description: string;
  icon: string;
  badge?: string;
}

function useDebounce<T>(value: T, delay: number = 450): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function formatUserFriendlyDate(dateVal?: string | Date): string {
  if (!dateVal) return "Unlocked";
  if (typeof dateVal === "string" && dateVal === "Unlocked") return "Unlocked";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);

    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateFormatted;
    }

    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${dateFormatted} at ${timeFormatted}`;
  } catch (e) {
    return String(dateVal);
  }
}

export default function ProfilePage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const rawId = decodeURIComponent(resolvedParams.username || resolvedParams.id || "me");
  const cleanId = rawId.startsWith("@") ? rawId.slice(1) : rawId;

  const isMyProfile = cleanId === "me" || cleanId === "get-my-profile" || cleanId === "my-profile";

  // Auth & dynamic profile state
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any | null>(null);

  useEffect(() => {
    async function verifyAuthAndLoadProfile() {
      setIsLoadingAuth(true);
      try {
        // 1. Verify user authentication status via backend auth API
        const authRes = await authApi.getMe();
        if (!authRes || !authRes.success || !authRes.user) {
          setIsAuthenticated(false);
          router.push("/login");
          return;
        }

        if (authRes.authorizationType === "incomplete" || authRes.isProfileCompleted === false) {
          setIsAuthenticated(false);
          router.push("/onboarding");
          return;
        }

        setIsAuthenticated(true);

        // 2. Fetch target profile data
        let response;
        if (isMyProfile) {
          response = await profileApi.getMyProfile();
        } else {
          response = await profileApi.getProfileByUsername(cleanId);
        }

        if (response && response.success && response.user) {
          setProfileData(response);
          if (response.userRewards?.karmaBalance !== undefined) {
            setKarmaBalance(response.userRewards.karmaBalance);
          } else {
            setKarmaBalance(0);
          }
        }
      } catch (err) {
        console.warn("Could not verify auth or fetch profile:", err);
        setIsAuthenticated(false);
        router.push("/login");
      } finally {
        setIsLoadingAuth(false);
      }
    }
    verifyAuthAndLoadProfile();
  }, [cleanId, isMyProfile, router]);

  // User status and rewards statistics directly from backend response (getProfileByUsername / getMyProfile)
  const userStatus = profileData?.userStatus;
  const userRewards = profileData?.userRewards;

  const reportedSpots =
    userStatus?.reportedSpots ??
    userStatus?.markedSpotsList?.length ??
    userStatus?.totalSpots ??
    0;

  const cleanedSpots =
    (typeof userStatus?.completedSpots === "number" ? userStatus.completedSpots : userStatus?.completedSpotsList?.length) ??
    userRewards?.totalSpotsCompleted ??
    0;
  const activeSpots = userStatus?.activeSpots ?? 0;
  const streaksCount = userStatus?.streaks ?? userRewards?.currentStreak ?? 0;
  const longestStreak = userRewards?.longestStreak ?? streaksCount;
  const freezeShields = userRewards?.freezeShields ?? 1;
  const userLevel = userRewards?.rank || "Seedling";

  // Karma multiplier string based on streak
  const karmaMultiplier = streaksCount >= 7 ? "1.5x" : streaksCount >= 3 ? "1.25x" : streaksCount > 0 ? "1.1x" : "1.0x";

  // Fallback dynamic week calculation if weekDays isn't provided by backend
  const backendWeekDays = userRewards?.weekDays;
  const weekDays = Array.isArray(backendWeekDays) && backendWeekDays.length === 7
    ? backendWeekDays
    : (() => {
        const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
        const now = new Date();
        const currentDayOfWeek = now.getDay();
        const distanceToMonday = (currentDayOfWeek + 6) % 7;

        const monday = new Date(now);
        monday.setDate(now.getDate() - distanceToMonday);
        monday.setHours(0, 0, 0, 0);

        const todayStr = now.toISOString().split("T")[0];

        return dayNames.map((day, idx) => {
          const dayDate = new Date(monday);
          dayDate.setDate(monday.getDate() + idx);
          const dateStr = dayDate.toISOString().split("T")[0];
          const isToday = dateStr === todayStr;
          const isPast = dayDate < new Date(todayStr);
          const isActive = isPast || (isToday && streaksCount > 0);

          return { day, date: dateStr, isToday, isPast, isActive };
        });
      })();

  // Format display name and handle strictly from fetched backend user object
  const userObj = profileData?.user;
  const handle = userObj?.username ? `@${userObj.username}` : (rawId.startsWith("@") ? rawId : `@${rawId}`);
  const displayName =
    userObj?.name || userObj?.username ||
    rawId
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const userAvatar = userObj?.avatarUrl || userObj?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";
  const userRole = userObj?.role ? `${userObj.role.toUpperCase()} · CIVIC RANGER` : "CIVIC RANGER";

  // Interactive States
  const [karmaBalance, setKarmaBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "resolved">("all");
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);
  const [selectedSpotDetails, setSelectedSpotDetails] = useState<CaseItem | null>(null);
  const [isLoadingSpotDetails, setIsLoadingSpotDetails] = useState<boolean>(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [redeemedVouchers, setRedeemedVouchers] = useState<string[]>([]);
  const [localLedger, setLocalLedger] = useState<any[]>([]);

  // Edit Profile Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editUsername, setEditUsername] = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);

  // Username validation state
  const debouncedEditUsername = useDebounce(editUsername, 450);
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: "" });

  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEditModal = () => {
    const currentUsername = userObj?.username || "";
    const currentAvatar = typeof userObj?.avatarUrl === "string" && userObj?.avatarUrl
      ? userObj.avatarUrl
      : typeof userObj?.avatar === "string" && userObj?.avatar
      ? userObj.avatar
      : userObj?.avatar?.url || "";

    setEditUsername(currentUsername);
    setEditAvatarUrl(currentAvatar);
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    setUsernameStatus({ available: true, message: "" });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (!isEditModalOpen) return;

    const trimmed = debouncedEditUsername.trim().toLowerCase();
    const currentUsername = userObj?.username ? userObj.username.trim().toLowerCase() : "";

    if (trimmed === currentUsername) {
      setUsernameStatus({ available: true, message: "Current username" });
      setIsCheckingUsername(false);
      return;
    }

    if (!trimmed) {
      setUsernameStatus({ available: false, message: "Username is required." });
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 30) {
      setUsernameStatus({ available: false, message: "Username must be 3-30 characters." });
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus({ available: false, message: "Only letters, numbers, and underscores allowed." });
      setIsCheckingUsername(false);
      return;
    }

    async function checkUniqueness() {
      setIsCheckingUsername(true);
      try {
        const res = await authApi.checkUsername(trimmed);
        if (res && res.success) {
          setUsernameStatus({ available: true, message: "Username is available!" });
        } else {
          setUsernameStatus({ available: false, message: res?.message || "Username is already taken." });
        }
      } catch (err) {
        setUsernameStatus({ available: false, message: "Error checking username availability." });
      } finally {
        setIsCheckingUsername(false);
      }
    }

    checkUniqueness();
  }, [debouncedEditUsername, isEditModalOpen, userObj?.username]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setEditError("Avatar image size must be under 5MB.");
        return;
      }
      setEditAvatarFile(file);
      setEditError(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEdit) return;

    if (usernameStatus.available === false) {
      setEditError(usernameStatus.message || "Please choose a valid username.");
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      let res;
      if (editAvatarFile) {
        const formData = new FormData();
        formData.append("username", editUsername.trim());
        formData.append("avatar", editAvatarFile);
        res = await profileApi.editProfile(formData);
      } else {
        const payload: any = { username: editUsername.trim() };
        if (editAvatarPreview) {
          payload.avatarUrl = editAvatarPreview;
        } else if (editAvatarUrl) {
          payload.avatarUrl = editAvatarUrl;
        }
        res = await profileApi.editProfile(payload);
      }

      if (res && res.success) {
        triggerToast("Profile updated successfully!");
        setIsEditModalOpen(false);
        const updatedRes = await profileApi.getMyProfile();
        if (updatedRes && updatedRes.success) {
          setProfileData(updatedRes);
        }
      } else {
        setEditError(res?.message || "Failed to update profile.");
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      setEditError(err?.message || "An unexpected error occurred while updating profile.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Dynamically fetch full spot details via GET /api/v1/spots/:id route (getMarkedSpot)
  const handleOpenSpotDetails = async (item: CaseItem) => {
    setSelectedSpotDetails(item);
    setIsLoadingSpotDetails(true);

    try {
      const cleanSpotId = item.id.replace(/-(marked|assigned|completed)$/, "");
      const res = await spotsApi.getSpotById(cleanSpotId);

      if (res && res.success && res.spot) {
        const s = res.spot;
        setSelectedSpotDetails((prev) => {
          if (!prev) return null;
          const assignedObj = Array.isArray(s.isAssignedBy) && s.isAssignedBy.length > 0 ? s.isAssignedBy[s.isAssignedBy.length - 1] : null;
          const completedObj = Array.isArray(s.isCompletedBy) && s.isCompletedBy.length > 0 ? s.isCompletedBy[s.isCompletedBy.length - 1] : null;

          const assignedUser = assignedObj?.assignedBy;
          const completedUser = completedObj?.completedBy;
          const markedUser = s.markedBy;

          const assignedName = typeof assignedUser === "object" ? (assignedUser?.name || assignedUser?.username || `@${assignedUser?.username}`) : item.assignedTo;
          const completedName = typeof completedUser === "object" ? (completedUser?.name || completedUser?.username || `@${completedUser?.username}`) : item.completedBy;
          const markedName = typeof markedUser === "object" ? (markedUser?.name || markedUser?.username || `@${markedUser?.username}`) : item.markedBy;

          return {
            ...prev,
            title: s.description || s.address || prev.title,
            location: s.address || prev.location,
            status: s.isCompleted ? "resolved" : prev.status,
            image: typeof s.image === "string" && s.image ? s.image : prev.image,
            imageAfter: s.imageAfter || prev.imageAfter,
            description: s.description || s.address || prev.description,
            markedBy: markedName || "Civilian Reporter",
            assignedTo: assignedName || (s.isCompleted ? "Ward Coordinator" : undefined),
            completedBy: completedName || (s.isCompleted ? "Clean Ranger Team" : undefined),
            markedAt: s.markedAt || s.createdAt || prev.markedAt,
            assignedAt: assignedObj?.assignedAt || prev.assignedAt,
            completedAt: completedObj?.completedAt || s.updatedAt || prev.completedAt,
            critical: s.critcal || s.critical || prev.critical,
          };
        });
      }
    } catch (err) {
      console.warn("Could not fetch full spot details from route GET /api/v1/spots/:id", err);
    } finally {
      setIsLoadingSpotDetails(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleFreezeToggle = () => {
    if (freezeShields > 0) {
      triggerToast(`Streak Freeze Shield is Active (${freezeShields} available)! Your streak is protected if you miss a day.`);
    } else {
      triggerToast("No Streak Freeze Shields available. Complete 5 civic spots to earn your next shield!");
    }
  };

  const trophies: Trophy[] = [
    {
      id: "ward-guardian",
      name: "Ward Guardian",
      subtitle: "Ward Champion",
      levelTag: "LV. 3",
      isUnlocked: true,
      type: "gold",
      icon: "security",
      description: "Successfully resolved over 10 critical municipal alerts within Ward 14.",
      unlockedDate: "Aug 24, 2026",
      karmaBonus: 300,
    },
    {
      id: "first-responder",
      name: "First Responder",
      subtitle: "<6HR CLEAN",
      levelTag: "<6HR CLEAN",
      isUnlocked: true,
      type: "silver",
      icon: "bolt",
      description: "Reported and participated in a cleanup drive completed under 6 hours.",
      unlockedDate: "Aug 29, 2026",
      karmaBonus: 150,
    },
    {
      id: "eagle-eye",
      name: "Eagle Eye",
      subtitle: "5 Reports",
      levelTag: "5 REPORTS",
      isUnlocked: true,
      type: "bronze",
      icon: "visibility",
      description: "Submitted 5 consecutive AI-verified authentic trash reports.",
      unlockedDate: "Sep 01, 2026",
      karmaBonus: 100,
    },
    {
      id: "eco-warrior",
      name: "Eco Warrior",
      subtitle: "Segregation Champion",
      levelTag: "LV. 2",
      isUnlocked: true,
      type: "gold",
      icon: "spa",
      description: "Led 3 organic waste composting initiatives in the neighborhood.",
      unlockedDate: "Sep 03, 2026",
      karmaBonus: 200,
    },
  ];

  const cases: CaseItem[] = [
    {
      id: "case-1",
      title: "MG Road Drain Silt",
      location: "Ward 14, Ottapalam • Yesterday, 4:15 PM",
      status: "resolved",
      karmaChange: 200,
      badgeText: "Completed",
      badgeType: "green",
      image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=80",
      imageAfter: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80",
      markedBy: "Anil Kumar (Citizen)",
      assignedTo: "Rajesh K. (Coordinator)",
      completedBy: "Clean Ranger Unit 14",
      markedAt: "2026-09-08",
      completedAt: "2026-09-09",
      critical: "High",
      description: "Severe drain blockage cleared and cleared silt disposed.",
    },
    {
      id: "case-2",
      title: "Market Lane Plastic Pile",
      location: "Sep 1, 10:30 AM • Lv. 4 Critical",
      status: "in_progress",
      badgeText: "Pending",
      badgeType: "yellow",
      image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=80",
      markedBy: "Meera Nair",
      assignedTo: "Rajesh K.",
      markedAt: "2026-09-01",
      critical: "Very High",
      description: "Accumulated plastic waste pile near Market Lane vegetable stalls.",
    },
    {
      id: "case-[#3]",
      title: "High Street Overfilling Bin",
      location: "Ward 12, Main Sq • Today, 9:20 AM",
      status: "in_progress",
      badgeText: "Pending",
      badgeType: "yellow",
      image: "https://images.unsplash.com/photo-1604186837056-8e7c286756f2?w=300&auto=format&fit=crop&q=80",
      markedBy: "Suresh P.",
      assignedTo: "Ward 12 Inspector",
      markedAt: "2026-09-10",
      critical: "Medium",
      description: "Overfilling public bin at Main Square awaiting municipal pickup.",
    },
    {
      id: "case-4",
      title: "Park Avenue Plastic Dump",
      location: "Ward 14 • Aug 30, 2:10 PM",
      status: "resolved",
      karmaChange: 150,
      badgeText: "Completed",
      badgeType: "green",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=300&auto=format&fit=crop&q=80",
      imageAfter: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80",
      markedBy: "Pooja V.",
      assignedTo: "Ward 14 Volunteer Team",
      completedBy: "Rajesh K. & Team",
      markedAt: "2026-08-30",
      completedAt: "2026-08-31",
      critical: "Medium",
      description: "Plastic bottle dumping behind community park cleared completely.",
    },
  ];

  const vouchers: Voucher[] = [
    {
      id: "v-1",
      title: "BookMyShow ₹100 Discount Voucher",
      category: "ENTERTAINMENT",
      cost: 400,
      description: "Valid on any movie ticket or event booking. Instant coupon code.",
      icon: "local_activity",
      badge: "POPULAR",
    },
    {
      id: "v-2",
      title: "SafaiWatch Eco Cotton Tote Bag",
      category: "CIVIC SWAG",
      cost: 500,
      description: "Premium heavy-duty recycled cotton tote with embroidered Civic Ranger badge.",
      icon: "shopping_bag",
    },
    {
      id: "v-3",
      title: "Civic Ranger Embroidered Cap",
      category: "CIVIC SWAG",
      cost: 600,
      description: "Official dark-green breathable cotton cap with reflective emblem.",
      icon: "military_tech",
      badge: "LIMITED",
    },
    {
      id: "v-4",
      title: "Cafe Coffee Day ₹150 Beverage Pass",
      category: "FOOD & BEVERAGE",
      cost: 450,
      description: "Enjoy a hot cappuccino or beverage at any participating CCD outlet.",
      icon: "local_cafe",
    },
  ];

  const BADGE_CONFIG: Record<string, { icon: string; type: "gold" | "silver" | "bronze"; levelTag: string; subtitle: string; description: string }> = {
    "The Beginner": { icon: "spa", type: "bronze", levelTag: "LV. 1", subtitle: "First Step", description: "Submitted your first verified civic spot report to kick off your sanitation journey." },
    "The Explorer": { icon: "explore", type: "bronze", levelTag: "LV. 1", subtitle: "Spot Explorer", description: "Actively mapped and reported 10+ sanitation spots across your local ward." },
    "The Spy": { icon: "visibility", type: "silver", levelTag: "LV. 2", subtitle: "Civic Spotter", description: "Kept a vigilant eye on unassigned neighborhood sanitation spots." },
    "Eye of the eagle": { icon: "center_focus_strong", type: "silver", levelTag: "LV. 2", subtitle: "Precision Spotter", description: "Demonstrated high accuracy in spot location tagging and coordinator assignment." },
    "The Hero": { icon: "shield", type: "silver", levelTag: "LV. 3", subtitle: "Ward Defender", description: "Earned 100+ Karma points by taking active responsibility for ward cleanliness." },
    "The Icon": { icon: "workspace_premium", type: "gold", levelTag: "LV. 4", subtitle: "Community Leader", description: "A celebrated civic champion with 200+ Karma points in community service." },
    "The King": { icon: "military_tech", type: "gold", levelTag: "LV. 5", subtitle: "Sanitation King", description: "Crowned Ward Champion with over 400 Karma points and 100+ spot contributions." },
    "The Legend": { icon: "auto_awesome", type: "gold", levelTag: "MAX LV.", subtitle: "Civic Legend", description: "Achieved legendary status with 1000+ Karma points and supreme ward leadership." }
  };

  // Only map and display the badges that the user has actually earned
  const userEarnedBadges: any[] = Array.isArray(userRewards?.badges) ? userRewards.badges : [];

  const fetchedBadges: Trophy[] = userEarnedBadges.map((b: any, idx: number) => {
    const bName = typeof b === "string" ? b : (b?.name || b?.title || "Civic Badge");
    const cfg = BADGE_CONFIG[bName] || BADGE_CONFIG[bName.trim()] || {};

    return {
      id: b._id || b.id || `badge-${idx}`,
      name: bName,
      subtitle: b.subtitle || cfg.subtitle || "Achievement",
      levelTag: b.levelTag || cfg.levelTag || "LV. 1",
      isUnlocked: true,
      type: b.type || cfg.type || "gold",
      icon: b.icon || cfg.icon || "military_tech",
      description: b.description || cfg.description || "Earned for active participation in local ward cleanliness.",
      unlockedDate: b.dateEarned || b.dateUnlocked || b.unlockedDate || "Unlocked",
    };
  });

  const unlockedCount = fetchedBadges.length;

  const rawCases: CaseItem[] = (
    Array.isArray(userStatus?.cases)
      ? userStatus.cases
      : Array.isArray(userStatus?.markedSpotsList)
      ? userStatus.markedSpotsList
      : isMyProfile
      ? cases
      : []
  ).map((c: any, idx: number) => {
    if (!c || typeof c !== "object") return c;
    return {
      id: typeof c.id === "string" || typeof c.id === "number" ? String(c.id) : (c._id ? String(c._id) : `case-${idx}`),
      title: typeof c.title === "string" ? c.title : (typeof c.description === "string" ? c.description : (typeof c.address === "string" ? c.address : "Civic Spot Case")),
      location: typeof c.location === "string" ? c.location : (typeof c.address === "string" ? c.address : "Ward Locality"),
      status: c.status === "resolved" ? "resolved" : "in_progress",
      karmaChange: typeof c.karmaChange === "number" ? c.karmaChange : (c.status === "resolved" ? 150 : undefined),
      badgeText: c.isCompleted || c.status === "resolved" ? "Completed" : "Pending",
      badgeType: c.badgeType === "green" || c.badgeType === "yellow" || c.badgeType === "red" ? c.badgeType : (c.status === "resolved" ? "green" : "yellow"),
      image: typeof c.image === "string" && c.image ? c.image : "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=80",
      imageAfter: c.imageAfter,
      caseType: typeof c.caseType === "string" ? c.caseType : "marked",
      description: typeof c.description === "string" ? c.description : (typeof c.title === "string" ? c.title : c.location),
      markedBy: c.markedBy,
      assignedTo: c.assignedTo,
      completedBy: c.completedBy,
      markedAt: c.markedAt,
      completedAt: c.completedAt,
      assignedAt: c.assignedAt,
      critical: c.critical || c.critcal,
    };
  });

  // Backend controller already builds role-based userStatus.cases specifically for Civilian, Coordinator, or Hybrid role
  const backendCases: CaseItem[] = rawCases;

  const filteredCases = backendCases.filter((c: CaseItem) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const handleRedeem = (v: Voucher) => {
    if (redeemedVouchers.includes(v.id)) {
      triggerToast("You have already redeemed this voucher!");
      return;
    }
    if (karmaBalance < v.cost) {
      triggerToast(`Insufficient Karma! You need ${v.cost - karmaBalance} more points.`);
      return;
    }
    setKarmaBalance((prev) => prev - v.cost);
    setRedeemedVouchers((prev) => [...prev, v.id]);
    setLocalLedger((prev) => [
      {
        id: `reward-${Date.now()}`,
        title: v.title,
        time: "Just now",
        amount: -v.cost,
        icon: v.icon,
      },
      ...prev,
    ]);
    triggerToast(`Successfully redeemed "${v.title}"! -${v.cost} Karma`);
  };

  if (isLoadingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[24px] p-8 max-w-sm w-full text-center border border-[#E2E8F0] shadow-sm flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl animate-spin">lock</span>
          </div>
          <div>
            <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e]">Authenticating Profile</h3>
            <p className="text-xs text-[#6d7a72] mt-1 font-['JetBrains_Mono']">Verifying your civic session credentials...</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 1. TOP NAVIGATION (Desktop Web) */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between bg-[#faf8ff]/80 dark:bg-[#faf8ff]/80 backdrop-blur-md rounded-full mt-4 mx-6 border border-[#dae2fd] shadow-md h-16 px-6 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            className="w-8 h-8 rounded-full object-cover border border-[#006948]"
            alt={displayName}
            src={userAvatar}
          />
          <span className="font-['Hanken_Grotesk'] text-xl font-extrabold text-[#006948]">SafaiWatch</span>
        </Link>

        <div className="flex gap-2">
          <Link
            className="font-['JetBrains_Mono'] text-xs font-semibold text-[#3d4a42] hover:bg-[#00855d]/10 px-4 py-2 rounded-full transition-all duration-200"
            href="/"
          >
            Map
          </Link>

          <Link
            className="font-['JetBrains_Mono'] text-xs font-semibold text-[#3d4a42] hover:bg-[#00855d]/10 px-4 py-2 rounded-full transition-all duration-200"
            href="/feed"
          >
            Feed
          </Link>

          <Link
            className="font-['JetBrains_Mono'] text-xs font-semibold text-[#3d4a42] hover:bg-[#00855d]/10 px-4 py-2 rounded-full transition-all duration-200"
            href="/reward"
          >
            Rewards
          </Link>

          <Link
            className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] bg-[#85f8c4]/40 border border-[#006948]/20 px-4 py-2 rounded-full transition-all duration-200"
            href="/profile"
          >
            Profile
          </Link>
        </div>

        <div className="font-['Inter'] text-xs font-semibold text-[#3d4a42] bg-[#f2f3ff] px-3.5 py-1.5 rounded-full border border-[#dae2fd]">
          <span className="text-[#006948] font-bold">{karmaBalance} XP</span>
        </div>
      </div>

      {/* 2. MOBILE TOP APP BAR */}
      <div className="md:hidden sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-[#E2E8F0]">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E2E8F0] active:scale-95 transition-transform text-[#0F172A]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e]">
          {isMyProfile ? "My Profile" : "Civic Profile"}
        </h1>
        <Link
          href="/history"
          title="View Activity History"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#E2E8F0] active:scale-95 transition-transform text-[#0F172A]"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 md:pt-28 pt-4 flex flex-col gap-6">
        {/* 1. HERO IDENTITY CARD */}
        <section className="glow-card bg-white rounded-[24px] p-6 relative overflow-hidden flex flex-col items-center text-center shadow-sm">
          <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
            <span
              className="material-symbols-outlined text-[#006948] text-7xl rotate-12"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              military_tech
            </span>
          </div>

          <div className="relative mb-3">
            <img
              className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
              alt={displayName}
              src={userAvatar}
            />
            <div className="absolute -bottom-1 -right-1 bg-[#006948] text-white w-8 h-8 flex items-center justify-center rounded-full border-2 border-white shadow-xs">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>

          <h2 className="font-[#131b2e] font-['Hanken_Grotesk'] text-2xl md:text-3xl font-extrabold mb-0.5">
            {displayName}
          </h2>
          <p className="font-['Inter'] text-sm text-[#6d7a72] mb-3">{handle}</p>

          <div className="flex items-center gap-2 bg-[#F1F5F9] px-3.5 py-1.5 rounded-full mb-3 border border-[#E2E8F0]">
            <span className="material-symbols-outlined text-[#3B82F6] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#0F172A] tracking-wider">
              {userRole}
            </span>
          </div>

          {isMyProfile && (
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-1.5 bg-[#006948] hover:bg-[#00855d] text-white font-['Inter'] text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer shadow-xs active:scale-95 mb-4"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit Profile</span>
            </button>
          )}

          {/* Karma Progress Container */}
          <div className="w-full bg-[#F8FAFC] rounded-2xl p-4 mb-4 border border-[#E2E8F0]">
            <div className="flex justify-between items-end mb-1.5">
              <div className="text-left">
                <p className="font-['JetBrains_Mono'] text-[11px] font-semibold text-[#6d7a72] uppercase tracking-wider mb-1">
                  KARMA BALANCE
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-['Hanken_Grotesk'] text-2xl md:text-3xl font-extrabold text-[#131b2e]">
                    {karmaBalance}
                  </span>
                  <span
                    className="material-symbols-outlined text-[#8B5CF6] text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    diamond
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-['Inter'] text-xs font-bold text-[#006948]">
                  {userRewards?.rank ? `Rank: ${userRewards.rank}` : (isMyProfile ? "Ward Champion" : "Civic Member")}
                </p>
              </div>
            </div>

            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#006948] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (karmaBalance / 1000) * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between mt-1.5 text-xs text-[#6d7a72] font-semibold font-['JetBrains_Mono']">
              <span>{karmaBalance} XP</span>
              <span>1000 to Next Rank</span>
            </div>
          </div>

          {/* CTA Action */}
          {isMyProfile && (
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsRedeemModalOpen(true)}
                className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-['Inter'] text-sm font-semibold px-6 py-3.5 rounded-xl flex justify-center items-center gap-2 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                <span>Redeem Vouchers &amp; Swag</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              <Link
                href="/history"
                className="hidden md:flex w-full sm:w-auto bg-[#0F172A] hover:bg-[#1E293B] text-white font-['Inter'] text-sm font-semibold px-6 py-3.5 rounded-xl justify-center items-center gap-2 active:scale-[0.98] transition-all shadow-sm cursor-pointer border border-[#334155]"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  history
                </span>
                <span>View Activity History</span>
              </Link>
            </div>
          )}
        </section>

        {/* 2. TROPHY CASE SECTION */}
        <section className="bg-white rounded-[24px] p-6 border border-[#E2E8F0] premium-shadow">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Trophy Case</h3>
              <p className="text-xs text-[#6d7a72] font-['Inter'] mt-0.5">Click any medal to view accomplishment details</p>
            </div>
            <span className="bg-[#F1F5F9] text-[#475569] font-['JetBrains_Mono'] text-[11px] font-bold px-3 py-1 rounded-full border border-[#CBD5E1]">
              {fetchedBadges.length > 0 ? `${fetchedBadges.length} ${fetchedBadges.length === 1 ? "BADGE EARNED" : "BADGES EARNED"}` : "0 BADGES EARNED"}
            </span>
          </div>

          {fetchedBadges.length === 0 ? (
            <div className="bg-[#FAF8FF] rounded-[20px] border border-[#E2E8F0] p-6 text-center flex flex-col items-center justify-center animate-enter">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#6d7a72] mb-2.5 border border-[#E2E8F0] shadow-2xs">
                <span className="material-symbols-outlined text-2xl text-[#006948]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
              </div>
              <h4 className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e]">No Trophies Unlocked Yet</h4>
              <p className="text-xs text-[#6d7a72] max-w-xs mt-1 leading-relaxed">
                Participate in neighborhood cleanups, verify citizen reports, and complete ward quests to earn your first trophy!
              </p>
            </div>
          ) : (
            /* Medals Carousel Row */
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3 pt-1">
              {fetchedBadges.map((trophy) => (
                <div
                  key={trophy.id}
                  onClick={() => setSelectedTrophy(trophy)}
                  className="flex flex-col items-center min-w-[90px] cursor-pointer group transition-transform hover:-translate-y-1"
                >
                  {trophy.type === "gold" && (
                    <div className="w-16 h-16 rounded-full relative mb-2 shadow-[0_4px_14px_rgba(250,204,21,0.35)] bg-gradient-to-br from-[#FDE047] via-[#EAB308] to-[#A16207] flex items-center justify-center border-2 border-[#FEF08A] group-hover:scale-105 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {trophy.icon}
                        </span>
                      </div>
                    </div>
                  )}

                  {trophy.type === "silver" && (
                    <div className="w-16 h-16 rounded-full relative mb-2 shadow-[0_4px_14px_rgba(148,163,184,0.35)] bg-gradient-to-br from-[#F1F5F9] via-[#CBD5E1] to-[#64748B] flex items-center justify-center border-2 border-[#F8FAFC] group-hover:scale-105 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CBD5E1] to-[#94A3B8] flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {trophy.icon}
                        </span>
                      </div>
                    </div>
                  )}

                  {trophy.type === "bronze" && (
                    <div className="w-16 h-16 rounded-full relative mb-2 shadow-[0_4px_14px_rgba(217,119,6,0.3)] bg-gradient-to-br from-[#FCD34D] via-[#D97706] to-[#92400E] flex items-center justify-center border-2 border-[#FDE68A] group-hover:scale-105 transition-transform">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {trophy.icon}
                        </span>
                      </div>
                    </div>
                  )}

                  {trophy.type === "locked" && (
                    <div className="w-16 h-16 rounded-full relative mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" fill="none" r="30" stroke="#E2E8F0" strokeWidth="4"></circle>
                        <circle
                          cx="32"
                          cy="32"
                          fill="none"
                          r="30"
                          stroke="#059669"
                          strokeDasharray="188.5"
                          strokeDashoffset={188.5 - (188.5 * (trophy.progressPercent || 0)) / 100}
                          strokeLinecap="round"
                          strokeWidth="4"
                        ></circle>
                      </svg>
                      <div className="w-14 h-14 rounded-full bg-[#F1F5F9] border-2 border-white flex items-center justify-center z-10 opacity-75">
                        <span className="material-symbols-outlined text-[#94A3B8]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {trophy.icon}
                        </span>
                      </div>
                    </div>
                  )}

                  <span className="font-['Inter'] text-[11px] font-bold text-[#0F172A] text-center leading-tight">
                    {trophy.name}
                  </span>
                  <span
                    className={`font-['JetBrains_Mono'] text-[9px] font-bold mt-1 uppercase ${
                      trophy.isUnlocked ? "text-[#006948]" : "text-[#6d7a72]"
                    }`}
                  >
                    {trophy.levelTag}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. STREAK SANCTUARY SECTION (MY PROFILE ONLY) */}
        {isMyProfile && (
          <section className="bg-white rounded-[24px] p-6 border border-[#E2E8F0] premium-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#F97316] shadow-xs">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_fire_department
                  </span>
                </div>
                <div>
                  <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">
                    {streaksCount > 0 ? `${streaksCount}-Day Activity Streak` : "Daily Activity Streak"}
                  </h3>
                  <p className="font-['Inter'] text-xs text-[#F97316] font-semibold flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    {karmaMultiplier} Karma multiplier active
                  </p>
                </div>
              </div>

              <button
                onClick={handleFreezeToggle}
                className="bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#BFDBFE] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] font-bold">{freezeShields} FREEZE</span>
              </button>
            </div>

            <div className="flex justify-between items-center mb-5 px-2 overflow-x-auto py-1">
              {weekDays.map((item: any, idx: number) => {
                const isLast = idx === weekDays.length - 1;
                let circleClass = "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]";
                let icon = "remove";
                let labelColor = "text-[#6d7a72]";

                if (item.isToday) {
                  labelColor = "text-[#F97316] font-extrabold";
                  if (item.isActive) {
                    circleClass = "bg-[#F97316] text-white pulse-flame z-10 shadow-md";
                    icon = "local_fire_department";
                  } else {
                    circleClass = "bg-[#FFF7ED] text-[#F97316] border-2 border-[#F97316] pulse-flame z-10 shadow-xs";
                    icon = "local_fire_department";
                  }
                } else if (item.isActive) {
                  circleClass = "bg-[#10B981] text-white shadow-xs";
                  icon = "check";
                } else if (item.isPast) {
                  circleClass = "bg-[#F1F5F9] text-[#94A3B8] border border-[#CBD5E1]";
                  icon = "close";
                }

                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold transition-all ${circleClass}`}>
                        <span className="material-symbols-outlined text-base font-bold" style={item.isToday || icon === "local_fire_department" ? { fontVariationSettings: "'FILL' 1" } : {}}>
                          {icon}
                        </span>
                      </div>
                      <span className={`font-['JetBrains_Mono'] text-[10px] font-bold ${labelColor}`}>{item.day}</span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-[2px] mx-1 md:mx-2 min-w-[8px] ${item.isActive ? "bg-[#10B981]" : "bg-[#E2E8F0]"}`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="text-center pt-3 border-t border-[#E2E8F0]">
              <span className="font-['Inter'] text-xs text-[#6d7a72]">
                Longest Streak: <strong className="text-[#0F172A] font-bold">{longestStreak} {longestStreak === 1 ? "Day" : "Days"}</strong>
              </span>
            </div>
          </section>
        )}

        {/* 4. CIVIC IMPACT BENTO GRID */}
        <section className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="material-symbols-outlined text-[#059669] mb-1.5 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_location_alt
            </span>
            <span className="font-['Hanken_Grotesk'] text-2xl font-extrabold text-[#0F172A]">{reportedSpots}</span>
            <span className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] leading-tight mt-1">
              SPOTS
              <br />
              REPORTED
            </span>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="material-symbols-outlined text-[#4F46E5] mb-1.5 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              mop
            </span>
            <span className="font-['Hanken_Grotesk'] text-2xl font-extrabold text-[#0F172A]">{cleanedSpots}</span>
            <span className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] leading-tight mt-1">
              SPOTS
              <br />
              CLEANED
            </span>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xs">
            <span className="font-['Hanken_Grotesk'] text-2xl font-extrabold text-[#0F172A] mb-0.5">
              {userRewards?.rank ? userRewards.rank : (typeof userLevel === "number" ? `Lv. ${userLevel}` : userLevel)}
            </span>
            <span className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] leading-tight mb-2">
              {isMyProfile ? "ACTIVE LEVEL RATING" : "CIVIC RANK"}
            </span>
            <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-[#059669] text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <span className="text-[9px] font-bold text-[#0F172A] font-['JetBrains_Mono']">
                {isMyProfile ? `${userStatus?.activeSpots ?? 0} ACTIVE` : `${cleanedSpots} COMPLETED`}
              </span>
            </div>
          </div>
        </section>

        {/* 5. CASES / COMPLETED SPOTS CONDITIONAL SECTION */}
        {isMyProfile ? (
          /* MY PROFILE: MY CIVIC CASES (WITH TABS) */
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">My Civic Cases</h3>
              <span className="bg-[#E2E8F0] text-[#6d7a72] font-['JetBrains_Mono'] text-xs px-2.5 py-0.5 rounded-full font-bold">
                {backendCases.length > 0 ? `(${backendCases.length})` : "None"}
              </span>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`font-['Inter'] text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                    : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("in_progress")}
                className={`font-['Inter'] text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "in_progress"
                    ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                    : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`font-['Inter'] text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === "resolved"
                    ? "bg-[#0F172A] text-white border border-[#0F172A] shadow-xs"
                    : "bg-white text-[#6d7a72] border border-[#E2E8F0] hover:border-[#6d7a72]"
                }`}
              >
                Resolved
              </button>
            </div>

            {filteredCases.length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-8 text-center flex flex-col items-center justify-center shadow-xs animate-enter">
                <div className="w-12 h-12 rounded-full bg-[#FAF8FF] flex items-center justify-center text-[#6d7a72] mb-3 border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-2xl">folder_off</span>
                </div>
                <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e]">
                  {backendCases.length === 0 ? "None (No Civic Cases)" : `None (${activeTab === "in_progress" ? "In Progress" : activeTab === "resolved" ? "Resolved" : "Matching"} Cases)`}
                </h4>
                <p className="text-xs text-[#6d7a72] max-w-xs mt-1 leading-relaxed">
                  {backendCases.length === 0
                    ? "You haven't reported or participated in any civic cases yet. Keep your neighborhood clean by filing your first report!"
                    : `There are currently no ${activeTab === "in_progress" ? "in-progress" : activeTab === "resolved" ? "resolved" : ""} civic cases to display.`}
                </p>
                <Link
                  href="/"
                  className="mt-4 px-4 py-2 bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Report a Civic Issue
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredCases.map((item, idx) => (
                  <div
                    key={`${item.id}-${item.caseType || idx}`}
                    className="bg-white rounded-[20px] border border-[#E2E8F0] p-3.5 flex gap-4 hover:border-[#006948]/40 transition-all shadow-xs"
                  >
                    <img
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-[#F1F5F9] border border-[#E2E8F0]"
                      src={typeof item.image === "string" ? item.image : "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300&auto=format&fit=crop&q=80"}
                      alt={typeof item.title === "string" ? item.title : "Case Item"}
                    />
                    <div className="flex flex-col flex-grow justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-['Inter'] text-sm font-bold text-[#0F172A] line-clamp-1">
                          {typeof item.title === "string" ? item.title : String(item.title || "Civic Case")}
                        </h4>
                        <button
                          onClick={() => handleOpenSpotDetails(item)}
                          className="font-['Inter'] text-xs font-semibold text-[#006948] bg-[#006948]/10 hover:bg-[#006948]/20 px-3 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Details</span>
                        </button>
                      </div>
                      <p className="font-['Inter'] text-xs text-[#6d7a72]">
                        {typeof item.location === "string" ? item.location : String(item.location || "Ward Locality")}
                      </p>

                      <div
                        className={`flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-md text-[11px] font-semibold mt-2 ${
                          item.status === "resolved" || item.badgeType === "green"
                            ? "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20"
                            : "text-[#D97706] bg-[#FFFBEB] border border-[#FCD34D]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {item.status === "resolved" || item.badgeType === "green" ? "check_circle" : "engineering"}
                        </span>
                        <span>{item.status === "resolved" || item.badgeType === "green" ? "Completed" : "Pending"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          /* OTHER USER PROFILE (/profile/:username): COMPLETED SPOTS ONLY STRICTLY FROM GETPROFILEBYUSERNAME */
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Completed Spots</h3>
                <span className="bg-[#85f8c4]/40 text-[#006948] font-['JetBrains_Mono'] text-xs px-2.5 py-0.5 rounded-full font-bold border border-[#006948]/20">
                  {userStatus?.completedSpots ?? (Array.isArray(userStatus?.cases) ? userStatus.cases.length : 0)}
                </span>
              </div>
            </div>

            {(!Array.isArray(userStatus?.cases) || userStatus.cases.length === 0) ? (
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-8 text-center flex flex-col items-center justify-center shadow-xs animate-enter">
                <div className="w-12 h-12 rounded-full bg-[#FAF8FF] flex items-center justify-center text-[#6d7a72] mb-3 border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-2xl text-[#006948]">check_circle</span>
                </div>
                <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e]">No Completed Spots Yet</h4>
                <p className="text-xs text-[#6d7a72] max-w-xs mt-1 leading-relaxed">
                  Cleaned spots and resolved civic issues will appear here once verified by AI &amp; ward coordinators.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(Array.isArray(userStatus?.cases) ? userStatus.cases : []).map((item: any, idx: number) => (
                  <div
                    key={`${item?.id || idx}-completed-other`}
                    className="bg-white rounded-[20px] border border-[#E2E8F0] p-3.5 flex gap-4 hover:border-[#006948]/40 transition-all shadow-xs"
                  >
                    <img
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-[#F1F5F9] border border-[#E2E8F0]"
                      src={typeof item?.image === "string" ? item.image : "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=300&auto=format&fit=crop&q=80"}
                      alt={typeof item?.title === "string" ? item.title : "Completed Spot"}
                    />
                    <div className="flex flex-col flex-grow justify-center">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-['Inter'] text-sm font-bold text-[#0F172A] line-clamp-1">
                          {typeof item?.title === "string" ? item.title : String(item?.title || "Cleaned Spot")}
                        </h4>
                        <button
                          onClick={() => handleOpenSpotDetails(item)}
                          className="font-['Inter'] text-xs font-semibold text-[#006948] bg-[#006948]/10 hover:bg-[#006948]/20 px-3 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Details</span>
                        </button>
                      </div>
                      <p className="font-['Inter'] text-xs text-[#6d7a72] mb-2">
                        {typeof item?.location === "string" ? item.location : String(item?.location || "Ward Locality")}
                      </p>

                      <div className="flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        <span>{typeof item?.badgeText === "string" ? item.badgeText : String(item?.badgeText || "AI Verified Clean")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 6. KARMA LEDGER (MY PROFILE ONLY) */}
        {isMyProfile && (
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Karma Ledger</h3>
              <span className="bg-[#E2E8F0] text-[#6d7a72] font-['JetBrains_Mono'] text-xs px-2.5 py-0.5 rounded-full font-bold">
                {(localLedger.length > 0 ? localLedger : (userRewards?.ledger ?? [])).length > 0
                  ? `${(localLedger.length > 0 ? localLedger : (userRewards?.ledger ?? [])).length} TRANSACTIONS`
                  : "None"}
              </span>
            </div>

            {(localLedger.length > 0 ? localLedger : (userRewards?.ledger ?? [])).length === 0 ? (
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-8 text-center flex flex-col items-center justify-center shadow-xs animate-enter">
                <div className="w-12 h-12 rounded-full bg-[#FAF8FF] flex items-center justify-center text-[#6d7a72] mb-3 border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-2xl">history_toggle_off</span>
                </div>
                <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e]">None (No Transactions Yet)</h4>
                <p className="text-xs text-[#6d7a72] max-w-xs mt-1 leading-relaxed">
                  No Karma points or reward redemptions recorded yet. Participate in civic cleanups to earn Karma!
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden shadow-xs">
                {(localLedger.length > 0 ? localLedger : (userRewards?.ledger ?? [])).map((item: any, idx: number, arr: any[]) => (
                  <div
                    key={item.id || idx}
                    className={`flex items-center justify-between p-4 ${
                      idx !== arr.length - 1 ? "border-b border-[#E2E8F0]" : ""
                    } hover:bg-[#F8FAFC] transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.amount > 0 ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#F1F5F9] text-[#475569]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {item.icon || (item.amount > 0 ? "task_alt" : "local_activity")}
                        </span>
                      </div>
                      <div>
                        <p className="font-['Inter'] text-xs font-bold text-[#0F172A]">{item.title}</p>
                        <p className="font-['JetBrains_Mono'] text-[10px] text-[#6d7a72] font-semibold mt-0.5">
                          {item.time || "RECENT"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-['JetBrains_Mono'] text-sm font-extrabold ${
                        item.amount > 0 ? "text-[#10B981]" : "text-[#475569]"
                      }`}
                    >
                      {item.amount > 0 ? `+${item.amount}` : item.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* 7. TROPHY DETAIL MODAL */}
      {selectedTrophy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 border border-[#E2E8F0] shadow-2xl animate-enter">
            <div className="flex justify-between items-start mb-4">
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] bg-[#85f8c4]/30 px-3 py-1 rounded-full border border-[#006948]/20">
                TROPHY DETAILS
              </span>
              <button
                onClick={() => setSelectedTrophy(null)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#6d7a72] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center text-center my-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#006948] to-[#00855d] text-white flex items-center justify-center mb-3 shadow-lg">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {selectedTrophy.icon}
                </span>
              </div>
              <h3 className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#131b2e] mb-1">
                {selectedTrophy.name}
              </h3>
              <p className="font-['Inter'] text-xs text-[#6d7a72] mb-3">{selectedTrophy.subtitle}</p>

              <p className="font-['Inter'] text-sm text-[#0F172A] leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] w-full text-left">
                {selectedTrophy.description}
              </p>

              {selectedTrophy.isUnlocked ? (
                <div className="w-full mt-4 flex items-center justify-between text-xs font-['JetBrains_Mono'] bg-[#ECFDF5] text-[#10B981] p-3 rounded-xl border border-[#10B981]/30">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-base font-bold">verified</span>
                    UNLOCKED
                  </span>
                  <span>{formatUserFriendlyDate(selectedTrophy.unlockedDate)}</span>
                </div>
              ) : (
                <div className="w-full mt-4 text-left">
                  <div className="flex justify-between text-xs font-['JetBrains_Mono'] text-[#6d7a72] mb-1 font-bold">
                    <span>PROGRESS</span>
                    <span>{selectedTrophy.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006948] h-full rounded-full"
                      style={{ width: `${selectedTrophy.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTrophy(null)}
              className="w-full bg-[#0F172A] text-white font-['Inter'] text-sm font-semibold py-3 rounded-xl mt-2 cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* 8. REDEEM VOUCHERS MODAL */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 border border-[#E2E8F0] shadow-2xl max-h-[90vh] overflow-y-auto animate-enter">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Redeem Swag &amp; Perks</h3>
                <p className="font-['Inter'] text-xs text-[#6d7a72]">Your Karma Balance: <strong className="text-[#006948]">{karmaBalance} XP</strong></p>
              </div>
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#6d7a72] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 my-2">
              {vouchers.map((v) => {
                const isRedeemed = redeemedVouchers.includes(v.id);
                return (
                  <div
                    key={v.id}
                    className="border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-[#006948] transition-all bg-[#F8FAFC]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#006948]/10 text-[#006948] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {v.icon}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#006948] bg-[#85f8c4]/40 px-2 py-0.5 rounded">
                            {v.category}
                          </span>
                          {v.badge && (
                            <span className="font-['JetBrains_Mono'] text-[9px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FCD34D]">
                              {v.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="font-['Inter'] text-sm font-bold text-[#0F172A] mt-1">{v.title}</h4>
                        <p className="font-['Inter'] text-xs text-[#6d7a72] mt-0.5 line-clamp-1">{v.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-['JetBrains_Mono'] text-xs font-extrabold text-[#8B5CF6] mb-1">
                        {v.cost} XP
                      </span>
                      <button
                        disabled={isRedeemed}
                        onClick={() => handleRedeem(v)}
                        className={`font-['Inter'] text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          isRedeemed
                            ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                            : karmaBalance >= v.cost
                            ? "bg-[#006948] hover:bg-[#00855d] text-white"
                            : "bg-[#CBD5E1] text-[#94A3B8] cursor-not-allowed"
                        }`}
                      >
                        {isRedeemed ? "Redeemed" : "Claim"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsRedeemModalOpen(false)}
              className="w-full bg-[#0F172A] text-white font-['Inter'] text-sm font-semibold py-3 rounded-xl mt-4 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 9. SPOT DETAILS MODAL */}
      {selectedSpotDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 border border-[#E2E8F0] shadow-2xl max-h-[90vh] overflow-y-auto animate-enter">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] bg-[#85f8c4]/30 px-3 py-1 rounded-full border border-[#006948]/20 uppercase">
                  SPOT CASE DETAILS
                </span>
                {selectedSpotDetails.critical && (
                  <span className="font-['JetBrains_Mono'] text-[10px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded border border-[#FCD34D] uppercase">
                    {selectedSpotDetails.critical} CRITICAL
                  </span>
                )}
                {isLoadingSpotDetails && (
                  <span className="font-['JetBrains_Mono'] text-[10px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                    Loading API...
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedSpotDetails(null)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#6d7a72] hover:text-[#0F172A] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Images Section (Before & After if completed) */}
              {selectedSpotDetails.status === "resolved" || selectedSpotDetails.imageAfter ? (
                <div>
                  <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] uppercase tracking-wider mb-2">
                    SPOT PHOTOS (BEFORE &amp; AFTER CLEANUP)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
                      <img
                        src={typeof selectedSpotDetails.image === "string" ? selectedSpotDetails.image : "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80"}
                        alt="Before Cleanup"
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/70 text-white font-['JetBrains_Mono'] text-[9px] font-bold px-2 py-0.5 rounded">
                        BEFORE
                      </span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden border border-[#10B981]/30">
                      <img
                        src={typeof selectedSpotDetails.imageAfter === "string" ? selectedSpotDetails.imageAfter : "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=500&auto=format&fit=crop&q=80"}
                        alt="After Cleanup"
                        className="w-full h-36 object-cover"
                      />
                      <span className="absolute bottom-2 left-2 bg-[#10B981] text-white font-['JetBrains_Mono'] text-[9px] font-bold px-2 py-0.5 rounded">
                        AFTER (CLEANED)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] uppercase tracking-wider mb-2">
                    REPORTED SPOT PHOTO
                  </p>
                  <div className="relative rounded-2xl overflow-hidden border border-[#E2E8F0]">
                    <img
                      src={typeof selectedSpotDetails.image === "string" ? selectedSpotDetails.image : "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80"}
                      alt={selectedSpotDetails.title}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white font-['JetBrains_Mono'] text-[9px] font-bold px-2 py-0.5 rounded">
                      PENDING CLEANUP
                    </span>
                  </div>
                </div>
              )}

              {/* Title & Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">
                    {selectedSpotDetails.title}
                  </h3>
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold shrink-0 ${
                      selectedSpotDetails.status === "resolved" || selectedSpotDetails.badgeType === "green"
                        ? "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20"
                        : "text-[#D97706] bg-[#FFFBEB] border border-[#FCD34D]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {selectedSpotDetails.status === "resolved" || selectedSpotDetails.badgeType === "green" ? "check_circle" : "engineering"}
                    </span>
                    <span>{selectedSpotDetails.status === "resolved" || selectedSpotDetails.badgeType === "green" ? "Completed" : "Pending"}</span>
                  </div>
                </div>

                <p className="font-['Inter'] text-xs text-[#6d7a72] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-sm text-[#006948]">location_on</span>
                  {selectedSpotDetails.location}
                </p>
                {selectedSpotDetails.description && selectedSpotDetails.description !== selectedSpotDetails.title && (
                  <p className="font-['Inter'] text-xs text-[#0F172A] mt-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                    {selectedSpotDetails.description}
                  </p>
                )}
              </div>

              {/* People & Assignment Activity Timeline */}
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] flex flex-col gap-3 font-['Inter'] text-xs">
                <p className="font-['JetBrains_Mono'] text-[10px] font-bold text-[#6d7a72] uppercase tracking-wider">
                  CASE ACTIVITY &amp; ASSIGNMENT DETAILS
                </p>

                {/* Reported By */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">add_location_alt</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A]">Reported By</p>
                      <p className="text-[11px] text-[#6d7a72]">
                        {selectedSpotDetails.markedBy || "Civilian Ranger"}
                      </p>
                    </div>
                  </div>
                  {selectedSpotDetails.markedAt && (
                    <span className="font-mono text-[10px] text-[#6d7a72]">
                      {new Date(selectedSpotDetails.markedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Assigned To */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">assignment_ind</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A]">Assigned Coordinator / Ranger</p>
                      <p className="text-[11px] text-[#6d7a72]">
                        {selectedSpotDetails.assignedTo || (selectedSpotDetails.status === "resolved" ? "Ward 14 Cleanup Team" : "Pending Assignment")}
                      </p>
                    </div>
                  </div>
                  {selectedSpotDetails.assignedAt && (
                    <span className="font-mono text-[10px] text-[#6d7a72]">
                      {new Date(selectedSpotDetails.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Completed By */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      selectedSpotDetails.status === "resolved" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#94A3B8]"
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {selectedSpotDetails.status === "resolved" ? "task_alt" : "pending"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A]">Completed &amp; Verified By</p>
                      <p className="text-[11px] text-[#6d7a72]">
                        {selectedSpotDetails.completedBy || (selectedSpotDetails.status === "resolved" ? "AI & Municipal Inspector" : "In Progress")}
                      </p>
                    </div>
                  </div>
                  {selectedSpotDetails.completedAt && (
                    <span className="font-mono text-[10px] text-[#6d7a72]">
                      {new Date(selectedSpotDetails.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata details */}
              <div className="flex justify-between items-center px-1 text-[11px] font-mono text-[#6d7a72]">
                <span>CASE ID: {selectedSpotDetails.id}</span>
                <span className="uppercase">TYPE: {selectedSpotDetails.caseType || "Civic Spot"}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSpotDetails(null)}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-['Inter'] text-sm font-semibold py-3 rounded-xl mt-4 cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
      {/* 9. EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 border border-[#E2E8F0] shadow-2xl animate-enter">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006948] text-2xl">edit_note</span>
                <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e]">Edit Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#6d7a72] hover:text-[#0F172A] flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              {/* Avatar Selector Section */}
              <div className="flex flex-col items-center gap-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                <div className="relative group">
                  <img
                    src={editAvatarPreview || editAvatarUrl || userAvatar}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#006948] shadow-md"
                  />
                  <label
                    htmlFor="avatar-file-input"
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    <span className="material-symbols-outlined text-2xl">photo_camera</span>
                  </label>
                </div>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-file-input"
                  className="text-xs font-semibold text-[#006948] hover:text-[#00855d] cursor-pointer flex items-center gap-1 bg-[#85f8c4]/30 px-3 py-1.5 rounded-full border border-[#006948]/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  <span>Change Profile Photo</span>
                </label>
                <p className="text-[10px] text-[#6d7a72] font-['JetBrains_Mono']">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>

              {/* Username Input Section */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="font-['JetBrains_Mono'] text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d7a72] font-['JetBrains_Mono'] text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className="w-full pl-8 pr-10 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/20 outline-none text-sm font-['Inter'] transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {isCheckingUsername ? (
                      <div className="w-4 h-4 border-2 border-[#006948] border-t-transparent rounded-full animate-spin" />
                    ) : usernameStatus.available === true ? (
                      <span className="material-symbols-outlined text-[#10B981] text-lg">check_circle</span>
                    ) : usernameStatus.available === false ? (
                      <span className="material-symbols-outlined text-[#EF4444] text-lg">cancel</span>
                    ) : null}
                  </div>
                </div>
                {usernameStatus.message && (
                  <p
                    className={`text-[11px] font-['Inter'] mt-0.5 ${
                      usernameStatus.available ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {usernameStatus.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-['Inter'] text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || isCheckingUsername || usernameStatus.available === false}
                  className={`flex-1 font-['Inter'] text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmittingEdit || isCheckingUsername || usernameStatus.available === false
                      ? "bg-[#CBD5E1] text-[#94A3B8] cursor-not-allowed"
                      : "bg-[#006948] hover:bg-[#00855d] text-white shadow-xs active:scale-[0.98]"
                  }`}
                >
                  {isSubmittingEdit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-[#eaedff]/90 dark:bg-[#eaedff]/90 backdrop-blur-md rounded-t-2xl border-t border-[#dae2fd] shadow-lg">
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
          className="flex flex-col items-center justify-center text-[#3d4a42] hover:text-[#006948] transition-colors w-16"
          href="/reward"
        >
          <span className="material-symbols-outlined">military_tech</span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-semibold mt-0.5">Rewards</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center bg-[#00855d] text-white rounded-xl px-3 py-1.5 w-16 shadow-xs"
          href="/profile"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] font-bold mt-0.5">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
