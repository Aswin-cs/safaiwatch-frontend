"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafaiMap, { Report } from "@/components/map/SafaiMap";
import ReportWasteSpotModal from "@/components/ReportWasteSpotModal";
import CompleteWasteSpotModal from "@/components/CompleteWasteSpotModal";
import SplashLoader from "@/components/SplashLoader";
import SafaiWatchLogo from "@/components/SafaiWatchLogo";
import UnauthenticatedIntro from "@/components/landing/UnauthenticatedIntro";
import NotificationPopup from "@/components/NotificationPopup";
import { profileApi, authApi, spotsApi } from "@/lib/api";
import { socket } from "@/lib/socket";
import {
  Shield,
  Map as MapIcon,
  Flame,
  User,
  Sparkles,
  Bot,
  Navigation,
  CheckCircle,
  PlusCircle,
  Trophy,
  Compass,
  MapPin,
  X,
  Camera,
  Layers,
  LogOut,
  LogIn,
  ArrowRight,
  Calendar,
  HeartHandshake,
  Users,
  CheckCircle2,
  Lock,
  Upload,
  AlertCircle,
  Eye,
  Trash2,
  Zap,
  Filter,
  AlertTriangle,
  Clock,
  Activity,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  LocateFixed,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  // Authentication State: null = Checking session/cookies via API, true = Authenticated, false = Unauthenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Active Tab for Welcome Page feature showcase
  const [welcomeTab, setWelcomeTab] = useState<"reporting" | "drives" | "volunteers" | "maps">("reporting");

  // Authenticated User Profile State
  const [userProfile, setUserProfile] = useState<{
    _id?: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    role?: string;
  } | null>(null);

  // Active Navigation Tab for Authenticated Dashboard
  const [activeTab, setActiveTab] = useState<"map" | "explore" | "add" | "leaderboard" | "profile">("map");

  // Dynamic user reports list (loaded from backend API & live user inputs)
  const [reports, setReports] = useState<Report[]>([]);

  // Selected Report for Bottom Sheet Preview
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Selected Coordinates when user clicks on map to report a waste site
  const [droppedCoordinates, setDroppedCoordinates] = useState<[number, number] | null>(null);

  // Role Restriction Notice toast state (for restricted actions like Coordinator attempting to report spot)
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  // Real-time AI Verification Toast Notice state (targeted strictly for the user who marked the spot)
  const [aiNotice, setAiNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // New Waste Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [newReportTitle, setNewReportTitle] = useState<string>("");
  const [newReportAddress, setNewReportAddress] = useState<string>("");
  const [newReportCategory, setNewReportCategory] = useState<string>("Plastic Debris");
  const [newReportCritical, setNewReportCritical] = useState<string>("High");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Map Center, User GPS Location & Recenter Navigation State
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Google Maps-style Auto Navigate / Recenter to Current Location (Instant 0ms flyTo response)
  const handleNavigateToCurrentLocation = () => {
    // 1. Immediately fly to best known current coordinates (0ms lag!)
    const currentLoc =
      userLocation ||
      (userGpsCoords ? [userGpsCoords[1], userGpsCoords[0]] as [number, number] : null);

    if (currentLoc) {
      // Micro-jitter ensure React re-renders and MapController triggers flyTo every click even if coordinates are identical
      setMapCenter([currentLoc[0] + (Math.random() - 0.5) * 0.0000001, currentLoc[1]]);
    }

    // 2. Refresh/refine location in background with generous maximumAge to avoid cold GPS delay
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      if (!currentLoc) {
        setIsLocating(true);
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(coords);
          setUserGpsCoords([coords[1], coords[0]]);
          setMapCenter([coords[0] + (Math.random() - 0.5) * 0.0000001, coords[1]]);
          setIsLocating(false);
        },
        (error) => {
          console.warn("GPS navigation error:", error.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    }
  };

  // Auto-detect GPS location on initial load & continuously track live movement
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(coords);
          setMapCenter(coords);
        },
        (error) => {
          console.warn("Initial GPS auto-detect failed:", error.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );

      // Continuous live geolocation watch for moving route updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(coords);
        },
        (error) => {
          console.warn("Live GPS watch error:", error.message);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, []);

  // AI Assistant Chat Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Spot Detail Inspection Modal state
  const [isSpotDetailModalOpen, setIsSpotDetailModalOpen] = useState<boolean>(false);

  // Active Spot Navigation Route state [destinationLat, destinationLng]
  const [routingTarget, setRoutingTarget] = useState<[number, number] | null>(null);
  const [isDirectionsPopupOpen, setIsDirectionsPopupOpen] = useState<boolean>(false);
  const [routeSummary, setRouteSummary] = useState<{ timeStr: string; distKm: string; roadName: string } | null>(null);

  // Claim Spot (Assign) loading state
  const [isClaimingSpot, setIsClaimingSpot] = useState<boolean>(false);

  // Complete Spot Modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
  const [completeDescription, setCompleteDescription] = useState<string>("");
  const [completeImageFile, setCompleteImageFile] = useState<File | null>(null);
  const [completeImagePreview, setCompleteImagePreview] = useState<string | null>(null);
  const [isCompletingSpot, setIsCompletingSpot] = useState<boolean>(false);

  // Uber-style Map Filter state: "all" | "critical" | "assigned" | "resolved"
  const [activeFilter, setActiveFilter] = useState<"all" | "critical" | "assigned" | "resolved">("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Delete Spot Modal & Loading state
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
  const [isDeletingSpot, setIsDeletingSpot] = useState<boolean>(false);

  // Handle Delete Spot (delete API)
  const handleDeleteSpot = async () => {
    if (!selectedReport || isDeletingSpot) return;
    setIsDeletingSpot(true);
    try {
      const res = await spotsApi.deleteSpot(selectedReport.id, "markedSpot");
      if (res && res.success) {
        setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
        setSelectedReport(null);
        setIsSpotDetailModalOpen(false);
        setIsDeleteConfirmModalOpen(false);
      } else {
        const errorText = res?.message || "Failed to delete spot.";
        setAiNotice({
          type: "error",
          message: errorText,
        });
        setTimeout(() => setAiNotice(null), 6000);
        setIsDeleteConfirmModalOpen(false);
      }
    } catch (err: any) {
      console.error("Failed to delete spot:", err);
      const errorText = err?.message || "Failed to delete spot. Please try again.";
      setAiNotice({
        type: "error",
        message: errorText,
      });
      setTimeout(() => setAiNotice(null), 6000);
      setIsDeleteConfirmModalOpen(false);
    } finally {
      setIsDeletingSpot(false);
    }
  };

  const [isDeletingVerification, setIsDeletingVerification] = useState<boolean>(false);

  const handleDeleteVerification = async (spotIdOrRecordId: string) => {
    if (!spotIdOrRecordId) return;
    try {
      setIsDeletingVerification(true);
      const res = await spotsApi.deleteOneTimeVerification(spotIdOrRecordId);
      if (res && res.success) {
        setAiNotice({
          type: "success",
          message: "Failed verification removed! You can now take or upload a new cleanup photo.",
        });
        setTimeout(() => setAiNotice(null), 6000);

        setReports((prev) =>
          prev.map((r) =>
            r.id === spotIdOrRecordId || r.oneTimeVerificationId === spotIdOrRecordId
              ? {
                  ...r,
                  isPendingVerification: false,
                  verificationStatus: null,
                  oneTimeVerificationId: null,
                  pendingVerificationMsg: undefined,
                  pendingCleanupImage: undefined,
                }
              : r
          )
        );

        setSelectedReport((prev) =>
          prev && (prev.id === spotIdOrRecordId || prev.oneTimeVerificationId === spotIdOrRecordId)
            ? {
                ...prev,
                isPendingVerification: false,
                verificationStatus: null,
                oneTimeVerificationId: null,
                pendingVerificationMsg: undefined,
                pendingCleanupImage: undefined,
              }
            : prev
        );
      } else {
        alert(res?.message || "Failed to remove verification document.");
      }
    } catch (err: any) {
      console.error("Error deleting verification:", err);
      alert(err?.message || "Error deleting verification document.");
    } finally {
      setIsDeletingVerification(false);
    }
  };

  // Handle start/stop route navigation using leaflet-routing-machine
  const handleToggleNavigation = (report: Report) => {
    const isCurrentlyRouting =
      routingTarget &&
      routingTarget[0] === report.lat &&
      routingTarget[1] === report.lng;

    if (isCurrentlyRouting) {
      setRoutingTarget(null);
      setIsDirectionsPopupOpen(false);
      setRouteSummary(null);
    } else {
      setRoutingTarget([report.lat, report.lng]);
      setIsDirectionsPopupOpen(true);
    }
  };

  // Handle Claim Spot (assign API)
  const handleClaimSpot = async (report: Report) => {
    if (isClaimingSpot) return;
    setIsClaimingSpot(true);
    try {
      const res = await spotsApi.assignSpot(report.id);
      if (res && res.success) {
        // Use populated spot from response if available
        const returnedSpot = res.spot;
        const updatedIsAssignedBy = returnedSpot?.isAssignedBy || [
          ...(report.isAssignedBy || []),
          { assignedBy: { _id: userProfile?._id, username: userProfile?.username || userProfile?.name, avatar: userProfile?.avatarUrl, role: userProfile?.role }, assignedAt: new Date().toISOString() },
        ];
        const updatedReport: Report = {
          ...report,
          status: "claimed" as Report["status"],
          severity: "Claimed",
          isAssignedBy: updatedIsAssignedBy,
          critcal: returnedSpot?.critcal || report.critcal,
        };
        setSelectedReport(updatedReport);
        // Update reports list
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? updatedReport : r))
        );
      } else {
        alert(res?.message || "Failed to claim spot. You may not have the required role.");
      }
    } catch (err) {
      console.error("Failed to claim spot:", err);
      alert("Failed to claim spot. Please try again.");
    } finally {
      setIsClaimingSpot(false);
    }
  };

  // Handle Complete Spot (complete API)
  const handleCompleteSpot = async () => {
    if (!selectedReport || isCompletingSpot) return;
    setIsCompletingSpot(true);
    try {
      const formData = new FormData();
      if (completeDescription) {
        formData.append("description", completeDescription);
      }
      if (completeImageFile) {
        formData.append("imageAfter", completeImageFile);
      }
      const res = await spotsApi.completeSpot(selectedReport.id, formData);
      if (res && res.success) {
        setIsCompleteModalOpen(false);
        setCompleteDescription("");
        setCompleteImageFile(null);
        setCompleteImagePreview(null);
        setAiNotice({
          type: "success",
          message: res.message || "Cleanup photo uploaded! AI verification in progress...",
        });
        setTimeout(() => setAiNotice(null), 8000);
      } else {
        alert(res?.message || "Failed to complete spot.");
      }
    } catch (err) {
      console.error("Failed to complete spot:", err);
      alert("Failed to complete spot. Please try again.");
    } finally {
      setIsCompletingSpot(false);
    }
  };

  // Handle complete image file change
  const handleCompleteImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompleteImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCompleteImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Check Authentication Session via API & HTTP-only Cookie on Mount
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const meRes = await authApi.getMe();
        if (meRes && (meRes.authorizationType === "incomplete" || meRes.isProfileCompleted === false)) {
          router.push("/onboarding");
          return;
        }

        const res = await profileApi.getBasicInfo();
        if (res && res.success && res.user) {
          setIsAuthenticated(true);
          const u: any = res.user;
          const avatarSrc =
            typeof u.avatarUrl === "string" && u.avatarUrl
              ? u.avatarUrl
              : typeof u.avatar === "string" && u.avatar
                ? u.avatar
                : u.avatar?.url || u.avatarUrl?.url || "";

          setUserProfile({
            _id: u._id || u.id,
            name: u.name || u.username,
            username: u.username,
            avatarUrl: avatarSrc,
            role: u.role,
          });

          // Fetch full profile if basic info avatar or _id is empty
          if (!avatarSrc || !u._id) {
            profileApi.getMyProfile().then((fullRes) => {
              if (fullRes && fullRes.success && fullRes.user) {
                const fu: any = fullRes.user;
                const fullAvatar =
                  typeof fu.avatarUrl === "string" && fu.avatarUrl
                    ? fu.avatarUrl
                    : typeof fu.avatar === "string" && fu.avatar
                      ? fu.avatar
                      : fu.avatar?.url || fu.avatarUrl?.url || "";
                setUserProfile((prev) => (prev ? {
                  ...prev,
                  _id: fu._id || fu.id || prev._id,
                  avatarUrl: fullAvatar || prev.avatarUrl
                } : prev));
              }
            });
          }
          return;
        }

        if (meRes && meRes.success && meRes.user) {
          setIsAuthenticated(true);
          const meAvatar =
            typeof meRes.user.avatarUrl === "string" && meRes.user.avatarUrl
              ? meRes.user.avatarUrl
              : typeof meRes.user.avatar === "string" && meRes.user.avatar
                ? meRes.user.avatar
                : meRes.user.avatar?.url || meRes.user.avatarUrl?.url || "";

          setUserProfile({
            _id: meRes.user._id || meRes.user.id,
            name: meRes.user.username || meRes.user.name,
            username: meRes.user.username,
            avatarUrl: meAvatar,
            role: meRes.user.role,
          });
          return;
        }

        // Cookie is invalid or not logged in
        setIsAuthenticated(false);
      } catch (err) {
        console.warn("User is unauthenticated:", err);
        setIsAuthenticated(false);
      }
    }

    checkAuthSession();
  }, [router]);

  const deduplicateReports = (items: Report[]): Report[] => {
    const seen = new Set<string>();
    const result: Report[] = [];
    for (const item of items) {
      const key = String(item.id);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  };

  const mapSpotToReport = (spot: any): Report => {
    const hasAssignments = Array.isArray(spot.isAssignedBy) && spot.isAssignedBy.length > 0;
    let spotStatus: Report["status"] = "critical";
    if (spot.isCompleted) {
      spotStatus = "resolved";
    } else if (hasAssignments) {
      spotStatus = "claimed";
    }

    const rawCategory = spot.category || spot.wasteCategory || spot.wasteType;
    let computedWasteType = rawCategory;
    if (!computedWasteType || computedWasteType.startsWith("Lat ") || computedWasteType === "Waste Spot") {
      const desc = spot.description || "";
      const knownCategories = [
        "Plastics & Wraps",
        "Organic / Food Waste",
        "E-Waste & Batteries",
        "Construction Debris & Rubble",
        "Medical & Hazardous Residue",
        "Mixed Waste",
        "Plastic Debris",
      ];
      const found = knownCategories.find((cat) => desc.toLowerCase().includes(cat.toLowerCase()));
      computedWasteType = found || "Mixed Waste";
    }

    const spotAddress =
      spot.address ||
      (Array.isArray(spot.coordinates) && spot.coordinates.length === 2
        ? `Lat ${spot.coordinates[1].toFixed(6)}, Lng ${spot.coordinates[0].toFixed(6)}`
        : "Ward 14 Spot");

    return {
      id: spot._id || `spot-${Math.random()}`,
      lat: Array.isArray(spot.coordinates) && spot.coordinates.length === 2 ? spot.coordinates[1] : 28.6139,
      lng: Array.isArray(spot.coordinates) && spot.coordinates.length === 2 ? spot.coordinates[0] : 77.209,
      title: spot.description && !spot.description.startsWith("Lat ") ? spot.description : (computedWasteType || "Waste Spot"),
      status: spotStatus,
      severity: spot.isCompleted ? "Resolved" : hasAssignments ? "Claimed" : (spot.critcal || "High"),
      category: computedWasteType,
      wasteType: computedWasteType,
      address: spotAddress,
      distance: spotAddress,
      image: spot.image,
      completedImage: spot.completedImage,
      markedBy: spot.markedBy,
      markedAt: spot.markedAt,
      isCompleted: spot.isCompleted,
      isPendingVerification: spot.isPendingVerification,
      verificationStatus: spot.verificationStatus,
      oneTimeVerificationId: spot.oneTimeVerificationId,
      pendingVerificationMsg: spot.pendingVerificationMsg,
      pendingCleanupImage: spot.pendingCleanupImage,
      isAssignedBy: spot.isAssignedBy,
      isCompletedBy: spot.isCompletedBy,
      critcal: spot.critcal,
      isAiVerified: spot.isAiVerified,
      isVerified: spot.isVerified,
      isCompletedVerify: spot.isCompletedVerify,
      isCompletedVerifyAt: spot.isCompletedVerifyAt,
    };
  };

  // Fetch real spots from backend API on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadBackendSpots() {
      try {
        const res = await spotsApi.getAllSpots();
        if (res && res.success && Array.isArray(res.spots)) {
          const mappedReports: Report[] = res.spots.map((spot: any) => mapSpotToReport(spot));
          setReports(deduplicateReports(mappedReports));
        }
      } catch (err) {
        console.warn("Failed to load backend spots:", err);
      }
    }

    loadBackendSpots();
  }, [isAuthenticated]);

  // Socket.IO real-time event listeners for spots update across connected users
  useEffect(() => {
    if (!isAuthenticated) return;

    if (userProfile?._id) {
      socket.emit("joinUserRoom", { userId: String(userProfile._id) });
    }

    const onSpotCreated = (data: { spot: any }) => {
      if (!data?.spot?._id) return;
      const newReport = mapSpotToReport(data.spot);
      setReports((prev) => deduplicateReports([newReport, ...prev]));
    };

    const onSpotAssigned = (data: { spot: any }) => {
      if (!data?.spot?._id) return;
      const updatedReport = mapSpotToReport(data.spot);
      setReports((prev) => prev.map((r) => (String(r.id) === String(updatedReport.id) ? updatedReport : r)));
      setSelectedReport((prev) => (String(prev?.id) === String(updatedReport.id) ? updatedReport : prev));
    };

    const onSpotCompleted = (data: { spot: any }) => {
      if (!data?.spot?._id) return;
      const updatedReport = mapSpotToReport(data.spot);
      setReports((prev) => prev.map((r) => (String(r.id) === String(updatedReport.id) ? updatedReport : r)));
      setSelectedReport((prev) => (String(prev?.id) === String(updatedReport.id) ? updatedReport : prev));
    };

    const onSpotDeleted = (data: { spotId: string }) => {
      if (!data?.spotId) return;
      setReports((prev) => prev.filter((r) => String(r.id) !== String(data.spotId)));
      setSelectedReport((prev) => (String(prev?.id) === String(data.spotId) ? null : prev));
    };

    const onSpotAiVerified = (data: any) => {
      if (userProfile?._id && data?.userId && String(data.userId) === String(userProfile._id)) {
        const isVerified = Boolean(data.isVerified);
        const defaultSuccessMsg =
          data.action === "completed"
            ? "✨ AI Verification Complete: Spot cleanup has been verified authentic! +100 XP Earned ✓"
            : "✨ AI Verification Complete: Your spot report has passed AI photo audit and is now live! ✓";
        const defaultFailMsg = `⚠️ AI Verification Failed: Spot ${data.action === "completed" ? "cleanup" : "report"} photo was flagged (${data.fraudReason || "verification failed"}).`;

        const msg = data.message || (isVerified ? defaultSuccessMsg : defaultFailMsg);

        setAiNotice({
          type: isVerified ? "success" : "error",
          message: msg,
        });

        // Automatically hide notice after 8 seconds
        setTimeout(() => {
          setAiNotice(null);
        }, 8000);

        // Refetch spots dynamically so verified or failed status is immediately updated
        spotsApi.getAllSpots().then((res) => {
          if (res && res.success && Array.isArray(res.spots)) {
            const mappedReports: Report[] = res.spots.map((spot: any) => mapSpotToReport(spot));
            setReports(deduplicateReports(mappedReports));
          }
        }).catch((err) => console.warn("Failed to load spots after AI verification:", err));

        if (isVerified) {
          profileApi.getMyProfile().then((res) => {
            if (res && res.success && res.user) {
              setUserProfile((prev: any) => ({ ...prev, ...res.user }));
            }
          }).catch((err) => console.warn("Failed to reload profile after AI verification:", err));
        }

        setSelectedReport((prev) => {
          if (!prev || String(prev.id) !== String(data.spotId)) return prev;
          return {
            ...prev,
            isVerified: isVerified,
            isCompletedVerify: "completed",
            isCompletedVerifyAt: new Date().toISOString(),
            isAiVerified: data.aiVerified || prev.isAiVerified,
            isPendingVerification: false,
            verificationStatus: isVerified ? "verified" : "failed",
            pendingVerificationMsg: msg,
            oneTimeVerificationId: data.oneTimeRecordId || prev.oneTimeVerificationId,
          };
        });
      }
    };

    const onSpotAiVerifying = (data: any) => {
      if (userProfile?._id && data?.userId && String(data.userId) === String(userProfile._id)) {
        setAiNotice({
          type: "success",
          message: data.message || "Cleanup photo uploaded! AI verification in progress...",
        });
        setTimeout(() => {
          setAiNotice(null);
        }, 8000);
      }
    };

    socket.on("spot:created", onSpotCreated);
    socket.on("spot:assigned", onSpotAssigned);
    socket.on("spot:completed", onSpotCompleted);
    socket.on("spot:deleted", onSpotDeleted);
    socket.on("spot:ai-verified", onSpotAiVerified);
    socket.on("spot:ai-verifying", onSpotAiVerifying);

    return () => {
      socket.off("spot:created", onSpotCreated);
      socket.off("spot:assigned", onSpotAssigned);
      socket.off("spot:completed", onSpotCompleted);
      socket.off("spot:deleted", onSpotDeleted);
      socket.off("spot:ai-verified", onSpotAiVerified);
      socket.off("spot:ai-verifying", onSpotAiVerifying);
    };
  }, [isAuthenticated, userProfile?._id]);

  // Start spot reporting locked strictly to user's verified current GPS location (Civilians & Hybrid roles)
  const handleStartReportSpotAtCurrentLocation = () => {
    const isCoordinator = (userProfile?.role || "").trim().toLowerCase() === "coordinator";
    if (isCoordinator) {
      setRoleNotice(
        "Waste spot reporting is not available for Coordinators. Coordinators can view, claim, assign, and complete spots."
      );
      return;
    }

    setRoleNotice(null);

    // 1. Immediately lock best available coordinates (existing GPS or device coords)
    const existingCoords =
      userLocation ||
      (userGpsCoords ? [userGpsCoords[1], userGpsCoords[0]] as [number, number] : null);

    if (existingCoords) {
      setDroppedCoordinates(existingCoords);
      setMapCenter([existingCoords[0], existingCoords[1]]);
    }

    // 2. Open modal IMMEDIATELY on click (Instant 0ms response!)
    setSelectedReport(null);
    setIsReportModalOpen(true);

    // 3. Asynchronously refine / refresh high-accuracy GPS in the background without blocking the UI
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const freshCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(freshCoords);
          setUserGpsCoords([freshCoords[1], freshCoords[0]]);
          setDroppedCoordinates(freshCoords);
          setMapCenter([freshCoords[0], freshCoords[1]]);
          setIsLocating(false);
        },
        (error) => {
          console.warn("GPS background refinement:", error.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }
  };

  // Handle map coordinate click event (Location Lock: prevents arbitrary coordinate selection)
  const handleSelectCoordinates = (_coords: [number, number]) => {
    const isCoordinator = (userProfile?.role || "").trim().toLowerCase() === "coordinator";
    if (isCoordinator) {
      setRoleNotice(
        "Waste spot reporting is not available for Coordinators. Coordinators can view, claim, assign, and complete spots."
      );
      setSelectedReport(null);
      setDroppedCoordinates(null);
      return;
    }

    // Location Lock-up: Spot reporting is locked strictly to user's current GPS location
    setRoleNotice(
      "📍 Location Locked: Spot reporting is restricted to your verified current physical location. Tap the (+) button or 'Mark Spot Here' to report at your current location."
    );
    setSelectedReport(null);
  };

  // Handle report selection & fetch single spot details via GET /api/v1/spots/:id (getMarkedSpot)
  const handleSelectReport = async (report: Report) => {
    setSelectedReport(report);
    setDroppedCoordinates(null);

    if (report.id && !report.id.startsWith("rep-") && !report.id.startsWith("spot-0.")) {
      try {
        const res = await spotsApi.getSpotById(report.id);
        if (res && res.success && res.spot) {
          const fullSpot = res.spot;
          const hasAssignments = Array.isArray(fullSpot.isAssignedBy) && fullSpot.isAssignedBy.length > 0;
          let spotStatus: Report["status"] = "critical";
          if (fullSpot.isCompleted) spotStatus = "resolved";
          else if (hasAssignments) spotStatus = "claimed";
          const updatedReport: Report = {
            ...mapSpotToReport(fullSpot),
            volunteersNeeded: 3,
          };
          setSelectedReport(updatedReport);

          setReports((prev) =>
            prev.map((r) =>
              r.id === report.id
                ? {
                  ...r,
                  ...mapSpotToReport(fullSpot),
                }
                : r
            )
          );
        }
      } catch (err) {
        console.warn("Could not fetch detailed spot info:", err);
      }
    }
  };

  // Device GPS location state [longitude, latitude]
  const [userGpsCoords, setUserGpsCoords] = useState<[number, number] | null>(null);

  // Retrieve device GPS position on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGpsCoords([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => {
          console.warn("Geolocation permission or GPS unavailable:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Check if current user role is allowed to create spots (Civilian or Hybrid)
  const isSpotReportingRole = userProfile?.role
    ? ["civilian", "hybrid"].includes(userProfile.role.toLowerCase())
    : true;

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
  };

  // Create new spot submission handler with backend API call & image upload
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!droppedCoordinates || !newReportTitle) return;

    if (!isSpotReportingRole) {
      setSubmitError("Spot creation is restricted to Civilian and Hybrid user roles.");
      return;
    }

    if (!selectedImageFile) {
      setSubmitError("An image upload is required to mark a spot.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const formData = new FormData();
      formData.append("address", newReportAddress || "Ward 14 Locality");
      formData.append("description", newReportTitle);
      formData.append("critical", newReportCritical || "High");
      formData.append("image", selectedImageFile);
      // GeoJSON standard spot coordinates [longitude, latitude]
      formData.append(
        "coordinates",
        JSON.stringify([droppedCoordinates[1], droppedCoordinates[0]])
      );

      // Device GPS location [longitude, latitude] for UserStatus currentLocation validation
      const userLocationCoords = userGpsCoords || [droppedCoordinates[1], droppedCoordinates[0]];
      formData.append("userLocation", JSON.stringify(userLocationCoords));

      const res = await spotsApi.createSpot(formData);

      if (res && res.success) {
        const createdSpot = res.spot;
        const spotImage =
          createdSpot?.image ||
          imagePreviewUrl ||
          "";

        const spotMarkedBy =
          createdSpot?.markedBy ||
          (userProfile
            ? {
              _id: userProfile._id,
              username: userProfile.username || userProfile.name,
              avatar: userProfile.avatarUrl,
              role: userProfile.role,
            }
            : null);

        const newReport: Report = {
          id: createdSpot?._id || `rep-${Date.now()}`,
          lat: droppedCoordinates[0],
          lng: droppedCoordinates[1],
          title: newReportTitle,
          status: "critical",
          severity: newReportCritical || "High",
          category: newReportAddress || newReportCategory,
          image: spotImage,
          markedBy: spotMarkedBy,
          markedAt: createdSpot?.markedAt || new Date().toISOString(),
          volunteersNeeded: 3,
          distance: "Just pinned",
        };

        setReports((prev) => deduplicateReports([newReport, ...prev]));
        setSelectedReport(newReport);
        setSubmitSuccess("Spot marked successfully with uploaded image!");

        setTimeout(() => {
          setIsReportModalOpen(false);
          setNewReportTitle("");
          setNewReportAddress("");
          setSelectedImageFile(null);
          setImagePreviewUrl(null);
          setSubmitSuccess(null);
          setSubmitError(null);
          setDroppedCoordinates(null);
        }, 1200);
      } else {
        setSubmitError(res.message || "Failed to mark spot. Please check your inputs.");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Network error while submitting spot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. LOADING STATE (Checking HTTP-only cookies / API auth status)
  if (isAuthenticated === null) {
    return (
      <SplashLoader
        title="SafaiWatch"
        subtitle="Verifying your civic session credentials…"
        showProgress
      />
    );
  }

  // 2. UNAUTHENTICATED STATE: SHOW REDESIGNED CIVIC INTRO / LANDING PAGE
  if (!isAuthenticated) {
    return <UnauthenticatedIntro />;
  }
  // Helper to extract markedBy user ID string
  const getMarkedByUserId = (markedBy: any): string | null => {
    if (!markedBy) return null;
    if (typeof markedBy === "string") return markedBy;
    if (typeof markedBy === "object") {
      return markedBy._id || markedBy.id || null;
    }
    return null;
  };

  // Helper to extract markedBy details (username, avatar, role)
  const getMarkedByDetails = (markedBy: any) => {
    if (!markedBy) {
      return {
        _id: userProfile?._id || "",
        username: userProfile?.username || userProfile?.name || "Civic User",
        avatarUrl: userProfile?.avatarUrl || "",
        role: userProfile?.role || "Civilian",
      };
    }
    if (typeof markedBy === "string") {
      const isMe = userProfile && (userProfile._id === markedBy || userProfile.username === markedBy);
      return {
        _id: markedBy,
        username: isMe ? (userProfile?.username || userProfile?.name || "Civic User") : (userProfile?.username || "Civic User"),
        avatarUrl: isMe ? (userProfile?.avatarUrl || "") : (userProfile?.avatarUrl || ""),
        role: isMe ? (userProfile?.role || "Civilian") : "Civilian",
      };
    }
    const avatarUrl =
      typeof markedBy.avatar === "string"
        ? markedBy.avatar
        : markedBy.avatar?.url || markedBy.avatarUrl || "";

    const userDisplayName =
      markedBy.username ||
      markedBy.name ||
      (userProfile && userProfile._id === (markedBy._id || markedBy.id) ? (userProfile.username || userProfile.name) : "Civic User");

    return {
      _id: markedBy._id || markedBy.id || "",
      username: userDisplayName,
      avatarUrl: avatarUrl || (userProfile && userProfile._id === (markedBy._id || markedBy.id) ? userProfile.avatarUrl : ""),
      role: markedBy.role || "Civilian",
      email: markedBy.email || "",
    };
  };

  // Helper to extract completedBy details (username, avatar, role, completedAt)
  const getCompletedByDetails = (isCompletedByArr?: any[]) => {
    if (!isCompletedByArr || !Array.isArray(isCompletedByArr) || isCompletedByArr.length === 0) {
      return null;
    }
    const lastEntry = isCompletedByArr[isCompletedByArr.length - 1];
    if (!lastEntry) return null;

    const userObj = lastEntry.completedBy || lastEntry;
    const completedAt = lastEntry.completedAt || null;

    if (!userObj) return null;

    if (typeof userObj === "string") {
      return {
        _id: userObj,
        username: "Civic Hero",
        avatarUrl: "",
        role: "Coordinator",
        completedAt,
      };
    }

    const avatarUrl =
      typeof userObj.avatar === "string"
        ? userObj.avatar
        : userObj.avatar?.url || userObj.avatarUrl || userObj.avatarUrl?.url || "";

    return {
      _id: userObj._id || userObj.id || "",
      username: userObj.username || userObj.name || "Civic Hero",
      avatarUrl,
      role: userObj.role || "Coordinator",
      email: userObj.email || "",
      completedAt,
    };
  };

  // Helper: max assignments allowed based on criticality level
  const getMaxAssignmentsByLevel = (critcal?: string): number => {
    switch (critcal) {
      case 'Very High': return 4;
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low':
      default: return 1;
    }
  };

  // Helper: extract assigned user details from isAssignedBy array
  const getAssignedByDetails = (isAssignedByArr?: any[]) => {
    if (!isAssignedByArr || !Array.isArray(isAssignedByArr) || isAssignedByArr.length === 0) {
      return null;
    }
    return isAssignedByArr.map((entry: any) => {
      const userObj = entry.assignedBy || entry;
      const assignedAt = entry.assignedAt || null;
      if (!userObj) return null;
      if (typeof userObj === "string") {
        return { _id: userObj, username: "Civic Ranger", avatarUrl: "", role: "Coordinator", assignedAt };
      }
      const avatarUrl =
        typeof userObj.avatar === "string"
          ? userObj.avatar
          : userObj.avatar?.url || userObj.avatarUrl || "";
      return {
        _id: userObj._id || userObj.id || "",
        username: userObj.username || userObj.name || "Civic Ranger",
        avatarUrl,
        role: userObj.role || "Coordinator",
        email: userObj.email || "",
        assignedAt,
      };
    }).filter(Boolean);
  };

  // Helper: Parse comprehensive AI forensic audit breakdown
  const parseSpotAiAudit = (report: Report | null) => {
    if (!report) return null;

    const isPending = report.isCompletedVerify === "pending";
    const isVerified = report.isCompletedVerify === "completed" && report.isVerified === true;
    const isFlagged = report.isCompletedVerify !== "pending" && report.isVerified === false;

    if (!isPending && !isVerified && !isFlagged && !report.isAiVerified) {
      return null;
    }

    const ai = report.isAiVerified || {};
    const rawReason = ai.fraudReason || (report.pendingVerificationMsg && report.pendingVerificationMsg.includes("(") ? report.pendingVerificationMsg.match(/\((.*?)\)/)?.[1] : "") || "";
    const rawManipulation = ai.detectedManipulationType || (ai.isAiOrEdited ? "AI_GENERATED" : isVerified ? "AUTHENTIC_PHOTO" : "");
    const confidence = ai.forensicConfidence !== undefined && ai.forensicConfidence > 0 ? Math.round(ai.forensicConfidence * 100) : isVerified ? 98 : isFlagged ? 92 : 0;
    const forensicDetails = ai.forensicDetails || ai.summary || (rawReason ? `Automated visual inspection verdict: ${rawReason}` : "");

    // Map reason code to human readable title & description
    let reasonTitle = "Photo Authenticity Check Failed";
    let reasonDesc = "The submitted photo failed AI authenticity and municipal cleanliness verification.";

    if (rawReason === "NO_WASTE_DETECTED" || (!ai.isValidWasteReport && isFlagged && !ai.isAiOrEdited && !rawReason.includes("GESTURE") && !rawReason.includes("CODE"))) {
      reasonTitle = "No Municipal Waste Detected";
      reasonDesc = "The uploaded photo does not show identifiable outdoor garbage, litter, or municipal waste in a public area.";
    } else if (rawReason === "AI_GENERATED_OR_EDITED" || rawManipulation === "AI_GENERATED" || ai.isAiOrEdited) {
      reasonTitle = "Synthetic / AI-Generated Photo Detected";
      reasonDesc = "Digital forensic analysis detected generative AI patterns, pixel tampering, or synthetic texture artifacts.";
    } else if (rawReason === "SCREENSHOT" || rawManipulation === "SCREENSHOT") {
      reasonTitle = "Screen Capture / Moiré Pattern Detected";
      reasonDesc = "The image appears to be a photo taken of a digital screen or monitor rather than a direct camera capture.";
    } else if (rawReason === "GESTURE_MISMATCH") {
      reasonTitle = "Verification Gesture Mismatch";
      reasonDesc = "The hand gesture shown does not match the assigned verification gesture pose required for this report.";
    } else if (rawReason === "CODE_MISMATCH") {
      reasonTitle = "Verification Code Mismatch";
      reasonDesc = "The security verification code written in the scene is missing or did not match the required code.";
    }

    // Checkpoint 1: Digital Authenticity
    const authenticityStatus = ai.isAiOrEdited || rawManipulation === "AI_GENERATED" || rawManipulation === "SCREENSHOT" || rawReason === "AI_GENERATED_OR_EDITED" || rawReason === "SCREENSHOT"
      ? "fail"
      : isVerified
      ? "pass"
      : isPending
      ? "pending"
      : "fail";

    const authenticityLabel = authenticityStatus === "pass" ? "Authentic Camera Photo" : authenticityStatus === "pending" ? "Analyzing Pixels" : "Synthetic / Tampered";

    // Checkpoint 2: Security Pose / Code
    const hasGestureCheck = ai.gestureMatched !== undefined || rawReason.includes("GESTURE");
    const hasCodeCheck = ai.detectedCode !== undefined || rawReason.includes("CODE");
    const securityStatus = (hasGestureCheck && ai.gestureMatched === false) || (hasCodeCheck && rawReason.includes("CODE")) || rawReason === "GESTURE_MISMATCH" || rawReason === "CODE_MISMATCH"
      ? "fail"
      : isVerified
      ? "pass"
      : isPending
      ? "pending"
      : (ai.gestureMatched ? "pass" : "pass");

    const securityLabel = securityStatus === "pass" ? "Security Pose Matched" : securityStatus === "pending" ? "Checking Pose" : securityStatus === "fail" ? "Pose Mismatched" : "Standard Verification";

    // Checkpoint 3: Outdoor Waste Content
    const wasteStatus = ai.isValidWasteReport === false || rawReason === "NO_WASTE_DETECTED"
      ? "fail"
      : (ai.isValidWasteReport === true || isVerified)
      ? "pass"
      : isPending
      ? "pending"
      : "fail";

    const wasteLabel = wasteStatus === "pass" ? "Outdoor Waste Verified" : wasteStatus === "pending" ? "Evaluating Waste" : "No Waste Detected";

    return {
      status: isPending ? "pending" : isVerified ? "verified" : "flagged",
      confidence,
      manipulationType: rawManipulation,
      reasonTitle,
      reasonDesc,
      forensicDetails,
      authenticityStatus,
      authenticityLabel,
      securityStatus,
      securityLabel,
      wasteStatus,
      wasteLabel,
      verifiedAt: report.isCompletedVerifyAt,
    };
  };

  const currentUserId = userProfile?._id;
  const markedByUserId = selectedReport ? getMarkedByUserId(selectedReport.markedBy) : null;
  const isReportedByCurrentUser = Boolean(
    currentUserId && markedByUserId && String(currentUserId) === String(markedByUserId)
  );
  const isClaimableRole = ["Coordinator", "Hybrid"].includes(userProfile?.role || "");
  const markedByDetails = selectedReport ? getMarkedByDetails(selectedReport.markedBy) : null;
  const completedByDetails = selectedReport ? getCompletedByDetails(selectedReport.isCompletedBy) : null;
  const assignedByDetailsList = selectedReport ? getAssignedByDetails(selectedReport.isAssignedBy) : null;
  const isCurrentUserAssigned = Boolean(
    currentUserId && assignedByDetailsList && assignedByDetailsList.some((a: any) => String(a._id) === String(currentUserId))
  );
  const maxAssignments = selectedReport ? getMaxAssignmentsByLevel((selectedReport as any).critcal) : 1;
  const currentAssignmentCount = assignedByDetailsList ? assignedByDetailsList.length : 0;
  const isSlotsAvailable = currentAssignmentCount < maxAssignments;
  const parsedAudit = parseSpotAiAudit(selectedReport);

  // Filter reports according to activeFilter chip selection
  const filteredReports = reports.filter((r) => {
    if (activeFilter === "critical") return r.status === "critical" || r.severity === "High" || r.critcal === "Very High" || r.critcal === "High";
    if (activeFilter === "assigned") return r.status === "claimed" || (r.isAssignedBy && r.isAssignedBy.length > 0);
    if (activeFilter === "resolved") return r.status === "resolved" || r.isCompleted;
    return true;
  });

  const criticalCount = reports.filter((r) => r.status === "critical" || r.severity === "High" || r.critcal === "Very High" || r.critcal === "High").length;
  const assignedCount = reports.filter((r) => r.status === "claimed" || (r.isAssignedBy && r.isAssignedBy.length > 0)).length;
  const resolvedCount = reports.filter((r) => r.status === "resolved" || r.isCompleted).length;

  // 3. AUTHENTICATED STATE: SHOW STITCH MAP DASHBOARD FOR AUTHENTICATED USERS
  return (
    <div className="h-screen w-full overflow-hidden relative bg-[#faf8ff] text-[#131b2e] font-sans antialiased select-none">
      {/* Dynamic Leaflet & OpenStreetMap Background Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <SafaiMap
          reports={filteredReports}
          selectedCoordinates={droppedCoordinates}
          routingTarget={routingTarget}
          userLocation={userLocation}
          onSelectCoordinates={handleSelectCoordinates}
          onSelectReport={handleSelectReport}
          onClearRouting={() => {
            setRoutingTarget(null);
            setIsDirectionsPopupOpen(false);
            setRouteSummary(null);
          }}
          center={mapCenter}
          zoom={14}
          isDirectionsPopupOpen={isDirectionsPopupOpen}
          onToggleDirectionsPopup={(open) => setIsDirectionsPopupOpen(typeof open === "boolean" ? open : !isDirectionsPopupOpen)}
          onRouteSummaryChange={setRouteSummary}
        />
      </div>

      {/* Ultra-Stylish Floating Command Bar (Uber/Apple Style) */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-full shadow-[0_12px_40px_rgba(15,23,42,0.1)] transition-all hover:shadow-[0_16px_45px_rgba(15,23,42,0.14)]">
        {/* Left Brand & Live Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link href="/" className="cursor-pointer shrink-0 flex items-center" title="SafaiWatch Home">
            <SafaiWatchLogo variant="icon" size="xs" animated={true} />
          </Link>
          <span className="font-['Hanken_Grotesk'] font-extrabold text-xs sm:text-sm text-[#131b2e] tracking-wider uppercase">
            SafaiWatch Dispatch
          </span>
          <span className="bg-emerald-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs tracking-wider">
            <Radio className="w-2.5 h-2.5 animate-pulse text-white" />
            LIVE
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Premium Filter Spots Pill Button in Navbar (matching Stitch Design) */}
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-[#131b2e] border shadow-xs font-['Hanken_Grotesk'] text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 cursor-pointer group ${
              isFilterModalOpen
                ? "bg-emerald-50 border-[#006948] ring-2 ring-[#006948]/20"
                : "bg-slate-50 hover:bg-emerald-50/70 border-slate-200/90 hover:border-[#006948]/40"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#006948] transition-transform group-hover:rotate-12" />
            <span className="hidden xs:inline font-bold text-xs text-[#131b2e]">Filter Spots</span>
            <span className="bg-[#006948]/10 text-[#006948] font-mono text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-[#006948]/20 whitespace-nowrap">
              {activeFilter === "all"
                ? `All (${reports.length})`
                : activeFilter === "critical"
                  ? `Critical (${criticalCount})`
                  : activeFilter === "assigned"
                    ? `Assigned (${assignedCount})`
                    : `Resolved (${resolvedCount})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${
                isFilterModalOpen ? "rotate-180 text-[#006948]" : ""
              }`}
            />
          </button>

          {/* User Profile Avatar */}
          <Link
            href="/profile"
            title={userProfile?.name ? `Profile of ${userProfile.name}` : "View Profile"}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-[#006948]/30 shadow-sm hover:ring-[#006948] transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name || "Civic Ranger"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                }}
              />
            ) : (
              <User className="w-4 h-4 text-[#006948]" />
            )}
            <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
          </Link>
        </div>
      </header>

      {/* Premium Filter Options Dropdown Popup (Positioned right below Navbar) */}
      {isFilterModalOpen && (
        <>
          {/* Backdrop overlay to close on click outside */}
          <div
            onClick={() => setIsFilterModalOpen(false)}
            className="fixed inset-0 z-45 bg-black/20 backdrop-blur-[2px] animate-enter"
          />

          <div className="fixed top-17 sm:top-18 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.18)] p-3.5 sm:p-4 flex flex-col gap-2.5 transition-all duration-200 animate-enter origin-top">
            {/* Header */}
            <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#006948]/10 flex items-center justify-center text-[#006948]">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <span className="font-['Hanken_Grotesk'] text-xs font-extrabold text-[#131b2e]">
                  Filter Waste Reports
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close Filter Menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter Category Buttons */}
            <div className="flex flex-col gap-1.5">
              {/* All Spots */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  setIsFilterModalOpen(false);
                }}
                className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                  activeFilter === "all"
                    ? "bg-[#131b2e] text-white border-[#131b2e] shadow-md scale-[1.01]"
                    : "bg-slate-50 hover:bg-slate-100/90 text-slate-800 border-slate-200/70"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeFilter === "all" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#006948]"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-extrabold leading-tight ${activeFilter === "all" ? "text-white" : "text-slate-900"}`}>
                      All Waste Sites
                    </p>
                    <p className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${activeFilter === "all" ? "text-slate-300" : "text-slate-500"}`}>
                      Display all marked locations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {reports.length}
                  </span>
                  {activeFilter === "all" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              </button>

              {/* Critical */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("critical");
                  setIsFilterModalOpen(false);
                }}
                className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                  activeFilter === "critical"
                    ? "bg-red-600 text-white border-red-600 shadow-md scale-[1.01]"
                    : "bg-red-50/50 hover:bg-red-50 text-red-900 border-red-200/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeFilter === "critical" ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-extrabold leading-tight ${activeFilter === "critical" ? "text-white" : "text-red-900"}`}>
                      Critical Severity
                    </p>
                    <p className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${activeFilter === "critical" ? "text-red-200" : "text-red-600/80"}`}>
                      Urgent high-hazard spots
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeFilter === "critical" ? "bg-white/20 text-white" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {criticalCount}
                  </span>
                  {activeFilter === "critical" && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                </div>
              </button>

              {/* Assigned */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("assigned");
                  setIsFilterModalOpen(false);
                }}
                className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                  activeFilter === "assigned"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]"
                    : "bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 border-indigo-200/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeFilter === "assigned" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-extrabold leading-tight ${activeFilter === "assigned" ? "text-white" : "text-indigo-900"}`}>
                      Assigned / In Progress
                    </p>
                    <p className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${activeFilter === "assigned" ? "text-indigo-200" : "text-indigo-600/80"}`}>
                      Rangers currently dispatched
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeFilter === "assigned" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {assignedCount}
                  </span>
                  {activeFilter === "assigned" && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                </div>
              </button>

              {/* Resolved */}
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("resolved");
                  setIsFilterModalOpen(false);
                }}
                className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                  activeFilter === "resolved"
                    ? "bg-[#006948] text-white border-[#006948] shadow-md scale-[1.01]"
                    : "bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 border-emerald-200/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      activeFilter === "resolved" ? "bg-white/20 text-white" : "bg-emerald-100 text-[#006948]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-extrabold leading-tight ${activeFilter === "resolved" ? "text-white" : "text-emerald-900"}`}>
                      Cleaned / Resolved
                    </p>
                    <p className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${activeFilter === "resolved" ? "text-emerald-200" : "text-emerald-700/80"}`}>
                      AI verified completed spots
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeFilter === "resolved" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {resolvedCount}
                  </span>
                  {activeFilter === "resolved" && <CheckCircle2 className="w-4 h-4 text-[#85f8c4] shrink-0" />}
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Real-time AI Verification Premium Toast Notification */}
      {aiNotice && (
        <NotificationPopup
          type={aiNotice.type === "success" ? "ai_audit" : "error"}
          title="AI Audit Notification"
          message={aiNotice.message}
          duration={7000}
          onClose={() => setAiNotice(null)}
          position="top-center"
        />
      )}

      {/* Role Restriction Premium Toast Notification */}
      {roleNotice && (
        <NotificationPopup
          type="warning"
          title="Access Restricted"
          message={roleNotice}
          duration={5000}
          onClose={() => setRoleNotice(null)}
          position="top-center"
        />
      )}

      {/* Interactive Current Location Lock Banner (White Theme) */}
      {droppedCoordinates && (userProfile?.role || "").trim().toLowerCase() !== "coordinator" && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-white/95 backdrop-blur-xl text-[#131b2e] rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-enter border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 text-[#006948]">
              <LocateFixed className="w-5 h-5 animate-pulse text-[#006948]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-xs text-[#131b2e]">Current Location Locked</p>
                <span className="text-[9px] bg-emerald-100 text-[#006948] px-1.5 py-0.5 rounded font-mono font-bold">GPS Verified</span>
              </div>
              <p className="text-[11px] font-mono text-[#006948] font-bold mt-0.5">
                {droppedCoordinates[0].toFixed(5)}, {droppedCoordinates[1].toFixed(5)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-[#006948] text-white font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-[#00855d] transition-colors cursor-pointer shadow-md"
            >
              Report Site
            </button>
            <button
              onClick={() => setDroppedCoordinates(null)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uber Style Bottom Sheet Selected Spot Container + Live Navigation Strip */}
      {(selectedReport || routingTarget) && !droppedCoordinates && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-35 w-[calc(100%-1.5rem)] max-w-lg flex flex-col gap-2.5 transition-all">
          {/* 1st: Route & Direction Bar ABOVE the spot container */}
          {routingTarget && (
            <div className="bg-gradient-to-r from-[#137333] to-[#0F9D58] text-white rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xl border border-emerald-600/40 flex items-center justify-between gap-2.5 transition-all animate-enter">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
                  <Navigation className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider font-mono whitespace-nowrap shrink-0">
                      Live Route
                    </span>
                    {routeSummary?.timeStr && (
                      <span className="text-[11px] font-extrabold text-white bg-black/30 px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap shrink-0">
                        {routeSummary.timeStr} • {routeSummary.distKm} km
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-50 font-medium truncate mt-0.5">
                    {routeSummary?.roadName ? `via ${routeSummary.roadName}` : "Calculating route..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDirectionsPopupOpen((prev) => !prev)}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-white text-[#137333] hover:bg-emerald-50 font-['Hanken_Grotesk'] text-[11px] sm:text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-emerald-100 whitespace-nowrap shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[17px]">turn_sharp_right</span>
                  <span>{isDirectionsPopupOpen ? "Hide Steps" : "Directions"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoutingTarget(null);
                    setIsDirectionsPopupOpen(false);
                    setRouteSummary(null);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close Route Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Selected Spot Card */}
          {selectedReport && (
            <div className="w-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-[28px] shadow-[0_20px_50px_rgba(15,23,42,0.12)] p-4 sm:p-5 flex flex-col gap-3.5 animate-enter">
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto -mt-1 mb-1"></div>

              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 border ${selectedReport.status === "critical"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : selectedReport.status === "claimed"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                  >
                    {selectedReport.status === "critical" ? (
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                    ) : selectedReport.status === "claimed" ? (
                      <Clock className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>{selectedReport.severity || selectedReport.status}</span>
                  </span>

                  {/* AI Verification Status Badge */}
                  {selectedReport.isCompletedVerify === "completed" && selectedReport.isVerified === true && (
                    <span className="text-[10px] font-mono font-extrabold px-2 py-1 rounded-lg uppercase flex items-center gap-1 border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>AI Verified</span>
                    </span>
                  )}
                  {isReportedByCurrentUser && selectedReport.isCompletedVerify !== "pending" && selectedReport.isVerified === false && (
                    <span className="text-[10px] font-mono font-extrabold px-2 py-1 rounded-lg uppercase flex items-center gap-1 border bg-rose-50 text-rose-700 border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>AI Flagged</span>
                    </span>
                  )}
                  {isReportedByCurrentUser && selectedReport.isCompletedVerify === "pending" && (
                    <span className="text-[10px] font-mono font-extrabold px-2 py-1 rounded-lg uppercase flex items-center gap-1 border bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                      <span>AI Pending</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card Media & Details */}
              <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
                {selectedReport.image ? (
                  <div className="relative sm:w-36 h-32 sm:h-auto rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0 shadow-xs">
                    <img
                      src={selectedReport.image}
                      alt={selectedReport.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80";
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md text-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30">
                      <Camera className="w-3 h-3 text-emerald-400" />
                      <span>Geotagged</span>
                    </div>
                  </div>
                ) : (
                  <div className="sm:w-36 h-28 sm:h-auto rounded-2xl bg-emerald-950 flex flex-col items-center justify-center p-3 text-white text-center shrink-0 border border-emerald-900">
                    <Camera className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      No Image
                    </span>
                  </div>
                )}

                <div className="flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="font-['Hanken_Grotesk'] text-base font-extrabold text-[#131b2e] leading-snug">
                      {selectedReport.title}
                    </h3>
                    {selectedReport.category && (
                      <p className="text-xs text-[#006948] font-semibold mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#006948]"></span>
                        <span>Waste Type: <strong>{selectedReport.wasteType || selectedReport.category}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Marked By Summary */}
                  {markedByDetails && (
                    <Link
                      href={`/profile/${encodeURIComponent(markedByDetails.username)}`}
                      className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-200/80 transition-colors cursor-pointer"
                      title={`View profile of @${markedByDetails.username}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-400/40">
                        {markedByDetails.avatarUrl ? (
                          <img
                            src={markedByDetails.avatarUrl}
                            alt={markedByDetails.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                            }}
                          />
                        ) : (
                          <User className="w-3 h-3 text-[#006948]" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-800 text-[11px] truncate">
                        Marked by @{markedByDetails.username}
                      </span>
                      {isReportedByCurrentUser && (
                        <span className="ml-auto text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                          You
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Assigned Rangers */}
                  {assignedByDetailsList && assignedByDetailsList.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {assignedByDetailsList.map((assignedUser: any, idx: number) => (
                        <Link
                          key={assignedUser._id || idx}
                          href={`/profile/${encodeURIComponent(assignedUser.username)}`}
                          className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-200/60 hover:bg-indigo-100/80 transition-colors cursor-pointer"
                          title={`View profile of @${assignedUser.username}`}
                        >
                          <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-400/30">
                            {assignedUser.avatarUrl ? (
                              <img
                                src={assignedUser.avatarUrl}
                                alt={assignedUser.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                                }}
                              />
                            ) : (
                              <User className="w-3 h-3 text-indigo-600" />
                            )}
                          </div>
                          <span className="font-semibold text-indigo-900 text-[11px] truncate">
                            Assigned to @{assignedUser.username}
                          </span>
                          {String(assignedUser._id) === String(currentUserId) && (
                            <span className="ml-auto text-[9px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                              You
                            </span>
                          )}
                        </Link>
                      ))}
                      <span className="font-mono text-[10px] font-semibold text-indigo-600 px-1">
                        📋 {currentAssignmentCount}/{maxAssignments} slot{maxAssignments > 1 ? 's' : ''} filled
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Verification Failure Banner */}
              {selectedReport.verificationStatus === "failed" && (
                <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">error</span>
                    <p className="text-[11px] text-rose-800 font-medium truncate">
                      {selectedReport.pendingVerificationMsg || "AI Verification failed. Please re-upload proof."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteVerification(selectedReport.oneTimeVerificationId || selectedReport.id)}
                    disabled={isDeletingVerification}
                    className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded-lg border border-rose-300 shrink-0 transition-colors cursor-pointer"
                  >
                    {isDeletingVerification ? "..." : "Reset"}
                  </button>
                </div>
              )}

              {/* Marked Spot AI Verification Failure Alert for Reporter */}
              {isReportedByCurrentUser && selectedReport.isCompletedVerify !== "pending" && selectedReport.isVerified === false && (
                <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">gpp_bad</span>
                    <p className="text-[11px] text-rose-800 font-medium truncate">
                      {selectedReport.isAiVerified?.fraudReason || "Your marked photo failed AI verification."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSpotDetailModalOpen(true)}
                    className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded-lg border border-rose-300 shrink-0 transition-colors cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              )}

              {/* Action Dispatch Buttons */}
              <div className="flex gap-2 sm:gap-3 pt-1">
                <button
                  onClick={() => setIsSpotDetailModalOpen(true)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-700" />
                  <span>Details</span>
                </button>

                {routingTarget &&
                  routingTarget[0] === selectedReport.lat &&
                  routingTarget[1] === selectedReport.lng ? (
                  <button
                    onClick={() => {
                      setRoutingTarget(null);
                      setIsDirectionsPopupOpen(false);
                      setRouteSummary(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl border border-red-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <X className="w-4 h-4 text-white" />
                    <span>Close Route</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleNavigation(selectedReport)}
                    className="flex-1 bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md group"
                  >
                    <Navigation className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    <span>Navigate</span>
                  </button>
                )}

            {!selectedReport.isCompleted && (() => {
              const hasAssignments = selectedReport.isAssignedBy && selectedReport.isAssignedBy.length > 0;

              if (isCurrentUserAssigned) {
                if (selectedReport.isPendingVerification) {
                  return (
                    <div className="flex-1 bg-amber-50 border border-amber-200 text-amber-800 font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2 px-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] animate-spin text-amber-600">sync</span>
                      <span className="truncate">AI Verifying...</span>
                    </div>
                  );
                }
                if (selectedReport.verificationStatus === "failed") {
                  return (
                    <button
                      onClick={() => handleDeleteVerification(selectedReport.oneTimeVerificationId || selectedReport.id)}
                      disabled={isDeletingVerification}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                      title={selectedReport.pendingVerificationMsg || "Verification failed"}
                    >
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      <span>{isDeletingVerification ? "Resetting..." : "Retry Cleanup"}</span>
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Complete Spot</span>
                  </button>
                );
              }

              if (hasAssignments && !isCurrentUserAssigned) {
                if (isSlotsAvailable && isClaimableRole && !isReportedByCurrentUser) {
                  return (
                    <button
                      onClick={() => handleClaimSpot(selectedReport)}
                      disabled={isClaimingSpot}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
                    >
                      {isClaimingSpot ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-indigo-200" />
                          <span>Join ({currentAssignmentCount}/{maxAssignments})</span>
                        </>
                      )}
                    </button>
                  );
                }
                return (
                  <span className="flex-1 bg-indigo-50 text-indigo-700 font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Assigned ({currentAssignmentCount}/{maxAssignments})</span>
                  </span>
                );
              }

              if (!isReportedByCurrentUser && isClaimableRole) {
                return (
                  <button
                    onClick={() => handleClaimSpot(selectedReport)}
                    disabled={isClaimingSpot}
                    className="flex-1 bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
                  >
                    {isClaimingSpot ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Claiming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-[#85f8c4]" />
                        <span>Claim Dispatch</span>
                      </>
                    )}
                  </button>
                );
              }

              return null;
            })()}

            {isReportedByCurrentUser && !selectedReport.isCompleted && (
              <button
                onClick={() => setIsDeleteConfirmModalOpen(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl border border-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Delete Spot"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )}



      {/* Floating Google Maps-Style Auto Navigate / Recenter Current Location FAB Button */}
      <button
        type="button"
        onClick={handleNavigateToCurrentLocation}
        disabled={isLocating}
        className="fixed bottom-20 right-4 z-30 w-12 h-12 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 rounded-full shadow-[0_10px_25px_rgba(15,23,42,0.18)] flex items-center justify-center transition-all cursor-pointer border border-slate-200/90 group"
        title="Auto Navigate to Current Location (GPS)"
        aria-label="Auto navigate to current location"
      >
        <LocateFixed
          className={`w-6 h-6 text-[#006948] transition-all ${
            isLocating ? "animate-spin text-emerald-600" : "group-hover:scale-110"
          }`}
        />
        <div
          className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors ${
            isLocating ? "bg-emerald-400 animate-ping" : "bg-emerald-500"
          }`}
        ></div>
      </button>

      {/* Floating Uber Style Bottom Dock Navigation Bar (White Theme) */}
      <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-40 flex justify-around items-center px-4 py-2 bg-white/95 backdrop-blur-xl rounded-full border border-slate-200/90 shadow-[0_12px_35px_rgba(15,23,42,0.12)] transition-all">
        {/* Map Tab */}
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${activeTab === "map" ? "text-[#006948] scale-110 font-extrabold" : "text-slate-500 hover:text-[#006948]"
            }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Map</span>
        </button>

        {/* Explore Tab */}
        <Link
          href="/feed"
          className="flex flex-col items-center justify-center text-slate-500 hover:text-[#006948] transition-all cursor-pointer"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Explore</span>
        </Link>

        {/* Plus Action Dispatch Button (Hidden for Coordinators) */}
        {(userProfile?.role || "").trim().toLowerCase() !== "coordinator" && (
          <button
            onClick={handleStartReportSpotAtCurrentLocation}
            className="relative -top-3 w-12 h-12 rounded-full bg-[#006948] hover:bg-[#00855d] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,105,72,0.35)] transition-transform hover:scale-105 cursor-pointer border-2 border-white"
            title="Report Spot at Current Location (Location Locked)"
          >
            <PlusCircle className="w-7 h-7 text-[#85f8c4]" />
          </button>
        )}

        {/* Ranks Tab */}
        <Link
          href="/rewards"
          className="flex flex-col items-center justify-center text-slate-500 hover:text-[#006948] transition-all cursor-pointer"
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Ranks</span>
        </Link>

        {/* Profile Tab */}
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center text-slate-500 hover:text-[#006948] transition-all cursor-pointer"
        >
          <User className="w-5 h-5" />
        </Link>
      </nav>

      {/* New Waste Site Reporting Modal */}
      <ReportWasteSpotModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setDroppedCoordinates(null);
        }}
        droppedCoordinates={droppedCoordinates}
        userRole={userProfile?.role}
        onSuccess={(createdSpot) => {
          if (createdSpot) {
            const newReport: Report = mapSpotToReport(createdSpot);
            setReports((prev) => deduplicateReports([newReport, ...prev]));
            setSelectedReport(newReport);
          }
          setIsReportModalOpen(false);
          setDroppedCoordinates(null);
        }}
      />

      {/* AI Assistant Chat Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-enter">
          <div className="bg-[#faf8ff] rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#4b41e1] text-white rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-slate-900">
                  SafaiWatch AI Assistant
                </h3>
                <p className="text-xs text-indigo-700 font-mono">
                  Smart Sanitation & Route Analysis
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4 text-xs text-slate-700 space-y-2 max-h-60 overflow-y-auto">
              <p className="bg-indigo-50 text-indigo-900 p-2.5 rounded-xl border border-indigo-100">
                🤖 Hello Civic Ranger! I analyzed Ward 14. Drop a pin anywhere on the map to file a geotagged waste report!
              </p>
            </div>

            <button
              onClick={() => setIsAiModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#4b41e1] text-white font-bold text-sm hover:bg-indigo-700 shadow-md"
            >
              Got it, Thanks!
            </button>
          </div>
        </div>
      )}

      {/* Spot Details & Inspection Modal */}
      {isSpotDetailModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-enter">
          <div className="bg-[#faf8ff] rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col p-4 sm:p-6 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsSpotDetailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
              <div className="w-9 h-9 bg-[#4b41e1]/10 text-[#4b41e1] rounded-xl flex items-center justify-center shrink-0">
                <Eye className="w-4.5 h-4.5 text-[#4b41e1]" />
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  Spot Details &amp; Inspection
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ID: {selectedReport.id}
                </p>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="overflow-y-auto pr-1 space-y-3 flex-1 custom-scrollbar">
              {/* AI Verification Failure Box for Cleanup Submissions */}
              {selectedReport.verificationStatus === "failed" && selectedReport.oneTimeVerificationId && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 shrink-0">
                  <span className="material-symbols-outlined text-rose-600 shrink-0 text-[20px] mt-0.5">error</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">AI Verification Failed</h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteVerification(selectedReport.oneTimeVerificationId || selectedReport.id)}
                        disabled={isDeletingVerification}
                        className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-lg border border-rose-300 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        <span>{isDeletingVerification ? "..." : "Reset"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1 leading-snug">
                      {selectedReport.pendingVerificationMsg || "The submitted cleanup proof failed AI verification."}
                    </p>
                  </div>
                </div>
              )}

              {/* Large Image Preview (Compact & Responsive) */}
              {selectedReport.image ? (
                <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-xs group shrink-0">
                  <img
                    src={selectedReport.image}
                    alt={selectedReport.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-emerald-300 font-mono text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                    <Camera className="w-3 h-3 text-emerald-400" />
                    <span>Geotagged</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-24 rounded-2xl bg-gradient-to-br from-[#006948] to-slate-900 flex flex-col items-center justify-center p-2.5 text-white text-center border border-emerald-800/30 shadow-xs shrink-0">
                  <Camera className="w-5 h-5 text-[#85f8c4] mb-0.5" />
                  <span className="text-[10px] font-mono text-[#85f8c4] font-bold uppercase tracking-wider">
                    No Photo Uploaded
                  </span>
                </div>
              )}

              {/* Status & Coordinates Summary */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2 shrink-0">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">Status &amp; Severity</span>
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase border ${selectedReport.status === "critical"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : selectedReport.status === "moderate"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : selectedReport.status === "claimed"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                  >
                    {selectedReport.severity || selectedReport.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-500 block">Coordinates</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                    📍 {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* AI Forensic Verification Audit Section */}
              {parsedAudit && (
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-xs flex flex-col gap-2.5 transition-all shrink-0">
                  {/* Card Header: Status Badge & Confidence in a Single Line */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        parsedAudit.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : parsedAudit.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {parsedAudit.status === "verified" ? "verified" : parsedAudit.status === "pending" ? "sync" : "gpp_bad"}
                        </span>
                      </div>
                      <div>
                        <p className="font-['Hanken_Grotesk'] text-xs font-extrabold text-slate-900 leading-none">
                          AI Forensic Audit
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                          {parsedAudit.status === "verified" ? "Authenticity Verified" : parsedAudit.status === "pending" ? "Analysis in Progress" : "Verification Flagged"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {parsedAudit.confidence > 0 && (
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {parsedAudit.confidence}% Conf.
                        </span>
                      )}
                      {parsedAudit.status === "pending" ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px] animate-spin">sync</span>
                          Pending
                        </span>
                      ) : parsedAudit.status === "verified" ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">verified</span>
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">gpp_bad</span>
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact 3-Phase Verification Inspection Matrix */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Checkpoint 1: Forensics / Authenticity */}
                    <div className={`p-2 rounded-xl border flex flex-col justify-between gap-1 ${
                      parsedAudit.authenticityStatus === "pass"
                        ? "bg-emerald-50/70 border-emerald-200/90 text-emerald-900"
                        : parsedAudit.authenticityStatus === "pending"
                        ? "bg-amber-50/70 border-amber-200/90 text-amber-900"
                        : "bg-rose-50/70 border-rose-200/90 text-rose-900"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider">Auth</span>
                        <span className="material-symbols-outlined text-[13px]">
                          {parsedAudit.authenticityStatus === "pass" ? "check_circle" : parsedAudit.authenticityStatus === "pending" ? "schedule" : "cancel"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold truncate leading-tight">
                        {parsedAudit.authenticityLabel}
                      </p>
                    </div>

                    {/* Checkpoint 2: Security Pose / Code */}
                    <div className={`p-2 rounded-xl border flex flex-col justify-between gap-1 ${
                      parsedAudit.securityStatus === "pass"
                        ? "bg-emerald-50/70 border-emerald-200/90 text-emerald-900"
                        : parsedAudit.securityStatus === "pending"
                        ? "bg-amber-50/70 border-amber-200/90 text-amber-900"
                        : parsedAudit.securityStatus === "fail"
                        ? "bg-rose-50/70 border-rose-200/90 text-rose-900"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider">Gesture</span>
                        <span className="material-symbols-outlined text-[13px]">
                          {parsedAudit.securityStatus === "pass" ? "check_circle" : parsedAudit.securityStatus === "pending" ? "schedule" : parsedAudit.securityStatus === "fail" ? "cancel" : "help"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold truncate leading-tight">
                        {parsedAudit.securityLabel}
                      </p>
                    </div>

                    {/* Checkpoint 3: Outdoor Waste Content */}
                    <div className={`p-2 rounded-xl border flex flex-col justify-between gap-1 ${
                      parsedAudit.wasteStatus === "pass"
                        ? "bg-emerald-50/70 border-emerald-200/90 text-emerald-900"
                        : parsedAudit.wasteStatus === "pending"
                        ? "bg-amber-50/70 border-amber-200/90 text-amber-900"
                        : "bg-rose-50/70 border-rose-200/90 text-rose-900"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider">Waste</span>
                        <span className="material-symbols-outlined text-[13px]">
                          {parsedAudit.wasteStatus === "pass" ? "check_circle" : parsedAudit.wasteStatus === "pending" ? "schedule" : "cancel"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold truncate leading-tight">
                        {parsedAudit.wasteLabel}
                      </p>
                    </div>
                  </div>

                  {/* Primary Verdict & Diagnosis Box for Flagged Spot (Reporter View) */}
                  {parsedAudit.status === "flagged" && isReportedByCurrentUser && (
                    <div className="bg-rose-50/90 rounded-xl p-2.5 sm:p-3 border border-rose-200/90 flex flex-col gap-2 text-rose-950">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-rose-600 text-[17px] shrink-0 mt-0.5">report_problem</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-['Hanken_Grotesk'] text-[11px] font-bold text-rose-900 uppercase tracking-wide">
                            {parsedAudit.reasonTitle}
                          </h4>
                          <p className="text-[11px] text-rose-800 leading-snug mt-0.5">
                            {parsedAudit.reasonDesc}
                          </p>
                        </div>
                      </div>

                      {/* Forensic Vision Analysis Details Quote */}
                      {parsedAudit.forensicDetails && (
                        <div className="bg-white/90 rounded-lg p-2 border border-rose-200 text-[10px] text-slate-800 leading-relaxed font-mono">
                          <span className="font-bold text-rose-700 uppercase block mb-0.5">
                            🔍 AI Vision Note:
                          </span>
                          {parsedAudit.forensicDetails}
                        </div>
                      )}

                      {/* Reporter Action & Guidance */}
                      <div className="flex items-center justify-between gap-2 border-t border-rose-200/70 pt-1.5">
                        <span className="text-[10px] text-rose-700 italic">
                          🔒 Only visible to you
                        </span>

                        <button
                          type="button"
                          onClick={() => setIsDeleteConfirmModalOpen(true)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete &amp; Re-Mark</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Flagged Spot Non-Reporter Fallback */}
                  {parsedAudit.status === "flagged" && !isReportedByCurrentUser && (
                    <div className="bg-rose-50 rounded-xl p-2 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-rose-600 text-[15px]">gpp_bad</span>
                      <span>This spot did not pass AI photo validation.</span>
                    </div>
                  )}

                  {/* Verified Confirmation Box */}
                  {parsedAudit.status === "verified" && (
                    <div className="bg-emerald-50/90 rounded-xl p-2.5 border border-emerald-200/90 flex items-start gap-2 text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-emerald-900 leading-tight">
                          Live Photo Authenticated &amp; Verified
                        </p>
                        <p className="text-[10px] text-emerald-800 leading-snug mt-0.5">
                          Authentic municipal waste confirmed without digital tampering.
                        </p>
                        {parsedAudit.verifiedAt && (
                          <p className="text-[9px] text-emerald-700 font-mono mt-0.5">
                            Verified on {new Date(parsedAudit.verifiedAt).toLocaleString("en-US", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending Audit Notice */}
                  {parsedAudit.status === "pending" && (
                    <div className="bg-amber-50/90 rounded-xl p-2.5 border border-amber-200/90 flex items-start gap-2 text-amber-950">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-amber-900 leading-tight">
                          AI Forensic Evaluation in Progress
                        </p>
                        <p className="text-[10px] text-amber-800 leading-snug mt-0.5">
                          Evaluating pixel authenticity, security pose alignment, and waste content...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Marked By / Reporter Card */}
              {markedByDetails && (() => {
                const cardInner = (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 border-2 border-[#006948]/40 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        {markedByDetails.avatarUrl ? (
                          <img
                            src={markedByDetails.avatarUrl}
                            alt={markedByDetails.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                            }}
                          />
                        ) : (
                          <User className="w-5 h-5 text-[#006948]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-['Hanken_Grotesk'] text-sm font-extrabold text-slate-900 group-hover:text-[#006948] transition-colors">
                            {markedByDetails.username}
                          </span>
                          <span className="text-[10px] font-mono font-extrabold bg-[#006948]/15 text-[#006948] px-2 py-0.5 rounded-full uppercase border border-[#006948]/25">
                            {markedByDetails.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                          {selectedReport.markedAt
                            ? `Marked on ${new Date(selectedReport.markedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                            : "Reported Spot Creator"}
                        </span>
                      </div>
                    </div>

                    {isReportedByCurrentUser ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shrink-0 shadow-xs">
                        Your Spot
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#006948] bg-[#006948]/10 group-hover:bg-[#006948]/20 px-3 py-1.5 rounded-xl border border-[#006948]/30 shrink-0 shadow-xs flex items-center gap-1 transition-colors">
                        View Profile &rarr;
                      </span>
                    )}
                  </>
                );

                return !isReportedByCurrentUser ? (
                  <Link
                    href={`/profile/${encodeURIComponent(markedByDetails.username)}`}
                    className="group bg-[#006948]/5 hover:bg-[#006948]/10 border border-[#006948]/20 hover:border-[#006948]/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer"
                    title={`View profile of @${markedByDetails.username}`}
                  >
                    {cardInner}
                  </Link>
                ) : (
                  <div className="bg-[#006948]/5 border border-[#006948]/20 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    {cardInner}
                  </div>
                );
              })()}

              {/* Completed By Card (shown if spot is completed) */}
              {(selectedReport.isCompleted || completedByDetails) && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 border-2 border-emerald-500/50 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      {completedByDetails?.avatarUrl ? (
                        <img
                          src={completedByDetails.avatarUrl}
                          alt={completedByDetails.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                          }}
                        />
                      ) : (
                        <User className="w-5 h-5 text-emerald-700" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Hanken_Grotesk'] text-sm font-extrabold text-slate-900">
                          {completedByDetails?.username || "Civic Hero"}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                          {completedByDetails?.role || "Coordinator"}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-mono block mt-0.5">
                        {completedByDetails?.completedAt
                          ? `Completed on ${new Date(completedByDetails.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                          : "Resolved Spot Hero"}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0 shadow-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Completed By
                  </span>
                </div>
              )}

              {/* Assigned Users Section in Detail Modal */}
              {assignedByDetailsList && assignedByDetailsList.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Assigned Users ({currentAssignmentCount}/{maxAssignments} slots)
                    </span>
                    {isSlotsAvailable && (
                      <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                        {maxAssignments - currentAssignmentCount} slot{(maxAssignments - currentAssignmentCount) > 1 ? 's' : ''} open
                      </span>
                    )}
                  </div>
                  {assignedByDetailsList.map((assignedUser: any, idx: number) => (
                    <Link
                      key={assignedUser._id || idx}
                      href={`/profile/${encodeURIComponent(assignedUser._id || assignedUser.username)}`}
                      className="flex items-center gap-3 hover:bg-indigo-100/60 rounded-xl p-1.5 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-400/40 overflow-hidden flex items-center justify-center shrink-0">
                        {assignedUser.avatarUrl ? (
                          <img
                            src={assignedUser.avatarUrl}
                            alt={assignedUser.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                            }}
                          />
                        ) : (
                          <User className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-['Hanken_Grotesk'] text-sm font-extrabold text-slate-900">
                            {assignedUser.username}
                          </span>
                          <span className="text-[10px] font-mono font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase border border-indigo-200">
                            {assignedUser.role}
                          </span>
                          {String(assignedUser._id) === String(currentUserId) && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                              You
                            </span>
                          )}
                        </div>
                        {assignedUser.assignedAt && (
                          <span className="text-[11px] text-indigo-600 font-mono block mt-0.5">
                            Assigned on {new Date(assignedUser.assignedAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Waste Type / Category</span>
                <div className="flex items-center gap-2 bg-[#006948]/10 border border-[#006948]/25 p-3 rounded-xl text-[#006948] font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006948]"></span>
                  <span>{selectedReport.wasteType || selectedReport.category || "Mixed Waste"}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Address / Location</span>
                <p className="font-bold text-slate-900 text-sm bg-white p-3 rounded-xl border border-slate-200">
                  {selectedReport.address || selectedReport.distance || "Ward 14 Locality"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Incident Description</span>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedReport.title}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsSpotDetailModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {routingTarget &&
                routingTarget[0] === selectedReport.lat &&
                routingTarget[1] === selectedReport.lng ? (
                <button
                  type="button"
                  onClick={() => {
                    setRoutingTarget(null);
                    setIsSpotDetailModalOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4 text-white" />
                  <span>Close Route</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleNavigation(selectedReport);
                    setIsSpotDetailModalOpen(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#4b41e1] hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-white" />
                  <span>Navigate</span>
                </button>
              )}

              {!selectedReport.isCompleted && (() => {
                const hasAssignments = selectedReport.isAssignedBy && selectedReport.isAssignedBy.length > 0;

                if (isCurrentUserAssigned) {
                  if (selectedReport.isPendingVerification) {
                    return (
                      <div className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs">
                        <span className="material-symbols-outlined text-[18px] animate-spin text-amber-600">sync</span>
                        <span>AI Verification Pending</span>
                      </div>
                    );
                  }
                  if (selectedReport.verificationStatus === "failed") {
                    return (
                      <button
                        type="button"
                        onClick={() => handleDeleteVerification(selectedReport.oneTimeVerificationId || selectedReport.id)}
                        disabled={isDeletingVerification}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                        <span>{isDeletingVerification ? "Resetting..." : "Delete Proof & Re-upload"}</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSpotDetailModalOpen(false);
                        setIsCompleteModalOpen(true);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Complete Spot</span>
                    </button>
                  );
                }

                if (hasAssignments && !isCurrentUserAssigned) {
                  if (isSlotsAvailable && isClaimableRole && !isReportedByCurrentUser) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleClaimSpot(selectedReport)}
                        disabled={isClaimingSpot}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
                      >
                        {isClaimingSpot ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-indigo-200" />
                            <span>Join ({currentAssignmentCount}/{maxAssignments})</span>
                          </>
                        )}
                      </button>
                    );
                  }
                  return (
                    <span className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-200 flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>Assigned ({currentAssignmentCount}/{maxAssignments})</span>
                    </span>
                  );
                }

                if (!isReportedByCurrentUser && isClaimableRole) {
                  return (
                    <button
                      type="button"
                      onClick={() => handleClaimSpot(selectedReport)}
                      disabled={isClaimingSpot}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
                    >
                      {isClaimingSpot ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-[#85f8c4]" />
                          <span>Claim Spot</span>
                        </>
                      )}
                    </button>
                  );
                }

                return null;
              })()}

              {isReportedByCurrentUser && !selectedReport.isCompleted && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm border border-red-200 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Delete Spot"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Spot Confirmation Modal */}
      {isDeleteConfirmModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-enter">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl relative text-center">
            <button
              onClick={() => setIsDeleteConfirmModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-['Hanken_Grotesk'] text-lg font-extrabold text-slate-900 mb-1">
              Delete This Spot?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete this marked spot? This action will remove the spot permanently and update your user profile.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSpot}
                disabled={isDeletingSpot}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isDeletingSpot ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Spot Form Modal (Google Stitch Design) */}
      <CompleteWasteSpotModal
        isOpen={isCompleteModalOpen && !!selectedReport}
        onClose={() => {
          setIsCompleteModalOpen(false);
          setCompleteDescription("");
          setCompleteImageFile(null);
          setCompleteImagePreview(null);
        }}
        spot={selectedReport}
        userRole={userProfile?.role || "Civilian"}
        onSuccess={(returnedSpot) => {
          if (!selectedReport) return;
          setIsCompleteModalOpen(false);
          setAiNotice({
            type: "success",
            message: "✨ Cleanup proof submitted! AI verification in progress...",
          });
          setTimeout(() => {
            setAiNotice(null);
          }, 8000);
        }}
      />
    </div>
  );
}
