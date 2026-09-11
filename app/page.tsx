"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SafaiMap, { Report } from "@/components/map/SafaiMap";
import { profileApi, authApi, spotsApi } from "@/lib/api";
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

  // AI Assistant Chat Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Spot Detail Inspection Modal state
  const [isSpotDetailModalOpen, setIsSpotDetailModalOpen] = useState<boolean>(false);

  // Active Spot Navigation Route state [destinationLat, destinationLng]
  const [routingTarget, setRoutingTarget] = useState<[number, number] | null>(null);

  // Claim Spot (Assign) loading state
  const [isClaimingSpot, setIsClaimingSpot] = useState<boolean>(false);

  // Complete Spot Modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
  const [completeDescription, setCompleteDescription] = useState<string>("");
  const [completeImageFile, setCompleteImageFile] = useState<File | null>(null);
  const [completeImagePreview, setCompleteImagePreview] = useState<string | null>(null);
  const [isCompletingSpot, setIsCompletingSpot] = useState<boolean>(false);

  // Delete Spot Modal & Loading state
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
  const [isDeletingSpot, setIsDeletingSpot] = useState<boolean>(false);

  // Handle Delete Spot (delete API)
  const handleDeleteSpot = async () => {
    if (!selectedReport || isDeletingSpot) return;
    setIsDeletingSpot(true);
    try {
      const res = await spotsApi.deleteSpot(selectedReport.id);
      if (res && res.success) {
        setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
        setSelectedReport(null);
        setIsSpotDetailModalOpen(false);
        setIsDeleteConfirmModalOpen(false);
      } else {
        alert(res?.message || "Failed to delete spot.");
      }
    } catch (err: any) {
      console.error("Failed to delete spot:", err);
      alert(err?.message || "Failed to delete spot. Please try again.");
    } finally {
      setIsDeletingSpot(false);
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
    } else {
      setRoutingTarget([report.lat, report.lng]);
    }
  };

  // Handle Claim Spot (assign API)
  const handleClaimSpot = async (report: Report) => {
    if (isClaimingSpot) return;
    setIsClaimingSpot(true);
    try {
      const res = await spotsApi.assignSpot(report.id);
      if (res && res.success) {
        // Update selected report to reflect assignment
        const updatedReport: Report = {
          ...report,
          status: "claimed" as Report["status"],
          severity: "Claimed",
          isAssignedBy: [...(report.isAssignedBy || []), { assignedBy: userProfile?._id, assignedAt: new Date().toISOString() }],
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
        const returnedSpot = res.spot;
        const updatedIsCompletedBy = returnedSpot?.isCompletedBy || selectedReport.isCompletedBy || [
          {
            completedBy: {
              _id: userProfile?._id,
              username: userProfile?.username || userProfile?.name || "Civic Hero",
              avatar: userProfile?.avatarUrl,
              role: userProfile?.role || "Coordinator",
            },
            completedAt: new Date(),
          },
        ];
        // Update the report to reflect completion
        const updatedReport: Report = {
          ...selectedReport,
          status: "resolved" as Report["status"],
          severity: "Resolved",
          isCompleted: true,
          isCompletedBy: updatedIsCompletedBy,
          image: returnedSpot?.image || selectedReport.image,
        };
        setSelectedReport(updatedReport);
        setReports((prev) =>
          prev.map((r) => (r.id === selectedReport.id ? updatedReport : r))
        );
        setIsCompleteModalOpen(false);
        setCompleteDescription("");
        setCompleteImageFile(null);
        setCompleteImagePreview(null);
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

  // Fetch real spots from backend API on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadBackendSpots() {
      try {
        const res = await spotsApi.getAllSpots();
        if (res && res.success && Array.isArray(res.spots)) {
          const mappedReports: Report[] = res.spots.map((spot: any) => ({
            id: spot._id || `spot-${Math.random()}`,
            lat: Array.isArray(spot.coordinates) && spot.coordinates.length === 2 ? spot.coordinates[1] : 28.6139,
            lng: Array.isArray(spot.coordinates) && spot.coordinates.length === 2 ? spot.coordinates[0] : 77.209,
            title: spot.description || spot.address || "Marked Spot",
            status: spot.isCompleted ? "resolved" : "critical",
            severity: spot.critcal || "High",
            category: spot.address || "Waste Spot",
            distance: spot.address || "Reported Spot",
            image: spot.image,
            markedBy: spot.markedBy,
            markedAt: spot.markedAt,
            isCompleted: spot.isCompleted,
            isAssignedBy: spot.isAssignedBy,
            isCompletedBy: spot.isCompletedBy,
          }));
          setReports(mappedReports);
        }
      } catch (err) {
        console.warn("Failed to load backend spots:", err);
      }
    }

    loadBackendSpots();
  }, [isAuthenticated]);

  // Handle map coordinate selection from Leaflet click event
  const handleSelectCoordinates = (coords: [number, number]) => {
    setDroppedCoordinates(coords);
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
          const updatedReport: Report = {
            ...report,
            id: fullSpot._id || report.id,
            lat: Array.isArray(fullSpot.coordinates) && fullSpot.coordinates.length === 2 ? fullSpot.coordinates[1] : report.lat,
            lng: Array.isArray(fullSpot.coordinates) && fullSpot.coordinates.length === 2 ? fullSpot.coordinates[0] : report.lng,
            title: fullSpot.description || fullSpot.address || report.title,
            status: fullSpot.isCompleted ? "resolved" : "critical",
            severity: fullSpot.critcal || report.severity || "High",
            category: fullSpot.address || report.category,
            image: fullSpot.image || report.image,
            markedBy: fullSpot.markedBy || report.markedBy,
            markedAt: fullSpot.markedAt || report.markedAt,
            isCompleted: fullSpot.isCompleted ?? report.isCompleted,
            isAssignedBy: fullSpot.isAssignedBy || report.isAssignedBy,
            isCompletedBy: fullSpot.isCompletedBy || report.isCompletedBy,
            volunteersNeeded: 3,
          };
          setSelectedReport(updatedReport);

          setReports((prev) =>
            prev.map((r) =>
              r.id === report.id
                ? {
                    ...r,
                    image: fullSpot.image || r.image,
                    title: fullSpot.description || r.title,
                    markedBy: fullSpot.markedBy || r.markedBy,
                    markedAt: fullSpot.markedAt || r.markedAt,
                    isCompleted: fullSpot.isCompleted ?? r.isCompleted,
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

        setReports((prev) => [newReport, ...prev]);
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
      <div className="h-screen w-full bg-[#FAF8FF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#006948] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e]">
          Verifying SafaiWatch Session...
        </p>
        <p className="text-xs font-mono text-[#6d7a72] mt-1">
          Authenticating JWT Cookie Credentials
        </p>
      </div>
    );
  }

  // 2. UNAUTHENTICATED STATE: SHOW WELCOME LANDING SCREEN WITH APP DETAILS
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8FF] text-[#131b2e] antialiased selection:bg-[#85f8c4] selection:text-[#002114] overflow-x-hidden">
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E7FF] px-4 md:px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-[#006948] rounded-xl flex items-center justify-center shield-glow relative overflow-hidden shadow-md">
                <Shield className="w-5 h-5 text-[#85f8c4] z-10 drop-shadow-[0_0_6px_rgba(133,248,196,0.8)]" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Hanken_Grotesk'] text-xl font-extrabold tracking-tight text-[#131b2e] leading-none">
                  SafaiWatch
                </span>
                <span className="font-mono text-[10px] text-[#006948] font-bold uppercase tracking-widest mt-0.5">
                  Civic Action &amp; Cleanliness Network
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3d4a42]">
              <a href="#pillars" className="hover:text-[#006948] transition-colors">
                Platform Modules
              </a>
              <a href="#map-demo" className="hover:text-[#006948] transition-colors">
                Locality Maps
              </a>
              <a href="#coordination" className="hover:text-[#006948] transition-colors">
                Clean-Up Drives
              </a>
            </nav>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-[#006948] hover:text-[#00855d] hover:bg-[#006948]/10 rounded-xl transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="btn-shimmer-hover diffuse-shadow px-4 py-2.5 bg-[#006948] hover:bg-[#00855d] text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Welcome Content */}
        <main className="flex-grow">
          {/* HERO SECTION */}
          <section className="relative pt-12 md:pt-20 pb-16 px-4 md:px-8 max-w-6xl mx-auto text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#85f8c4]/20 blur-3xl rounded-full -z-10 pointer-events-none"></div>

            <div className="animate-enter inline-flex items-center gap-2 bg-[#85f8c4]/30 px-3.5 py-1.5 rounded-full mb-6 border border-[#006948]/20 text-[#006948] font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#006948]" />
              <span>Civic Platform for Cleaner Localities</span>
            </div>

            <h1 className="animate-enter delay-1 font-['Hanken_Grotesk'] text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#131b2e] max-w-4xl mx-auto leading-[1.15] mb-6">
              Citizen Reporting, Volunteer Drives &amp;{" "}
              <span className="text-[#006948] relative inline-block">
                Real-Time Cleanliness Maps
              </span>
            </h1>

            <p className="animate-enter delay-2 text-base md:text-lg text-[#3d4a42] max-w-3xl mx-auto leading-relaxed mb-8">
              SafaiWatch brings together <strong>geotagged citizen reporting tools</strong>, <strong>clean-up drive coordinators</strong>, <strong>volunteer platforms</strong>, and <strong>real-time locality cleanliness maps</strong> to transform neighborhoods into clean, accountable ecosystems.
            </p>

            <div className="animate-enter delay-3 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mb-10">
              <span className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#006948]" />
                <span>Geotagged Citizen Reporting</span>
              </span>
              <span className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#006948]" />
                <span>Clean-Up Drive Coordinators</span>
              </span>
              <span className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[#006948]" />
                <span>Volunteer Karma Platform</span>
              </span>
              <span className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                <MapIcon className="w-3.5 h-3.5 text-[#006948]" />
                <span>OpenStreetMap Live Heatmaps</span>
              </span>
            </div>

            <div className="animate-enter delay-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link
                href="/login"
                className="btn-shimmer-hover diffuse-shadow w-full sm:w-auto px-8 py-4 bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] text-base font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Login to Auth Portal</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#f2f3ff] text-[#131b2e] font-['Hanken_Grotesk'] text-base font-bold rounded-2xl border border-[#bccac0]/60 flex items-center justify-center gap-2.5 transition-all hover:shadow-sm cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-[#006948]" />
                <span>Set Up Ward Territory</span>
              </Link>
            </div>

            {/* Impact Metrics Bar */}
            <div className="animate-enter delay-5 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#E2E7FF] shadow-sm">
              <div className="flex flex-col items-center p-3">
                <div className="flex items-center gap-1 text-[#006948] font-['Hanken_Grotesk'] text-2xl md:text-3xl font-extrabold">
                  <CheckCircle2 className="w-6 h-6 text-[#006948]" />
                  <span>12,400+</span>
                </div>
                <span className="text-xs text-[#6d7a72] font-semibold mt-1">Citizen Reports Filed</span>
              </div>

              <div className="flex flex-col items-center p-3 border-l border-[#E2E7FF]/80">
                <div className="flex items-center gap-1 text-[#006948] font-['Hanken_Grotesk'] text-2xl md:text-3xl font-extrabold">
                  <Calendar className="w-6 h-6 text-[#006948]" />
                  <span>850+</span>
                </div>
                <span className="text-xs text-[#6d7a72] font-semibold mt-1">Clean-Up Drives Organised</span>
              </div>

              <div className="flex flex-col items-center p-3 border-l border-[#E2E7FF]/80">
                <div className="flex items-center gap-1 text-[#006948] font-['Hanken_Grotesk'] text-2xl md:text-3xl font-extrabold">
                  <Users className="w-6 h-6 text-[#006948]" />
                  <span>35,000+</span>
                </div>
                <span className="text-xs text-[#6d7a72] font-semibold mt-1">Active Ward Volunteers</span>
              </div>

              <div className="flex flex-col items-center p-3 border-l border-[#E2E7FF]/80">
                <div className="flex items-center gap-1 text-[#006948] font-['Hanken_Grotesk'] text-2xl md:text-3xl font-extrabold">
                  <MapIcon className="w-6 h-6 text-[#006948]" />
                  <span>100%</span>
                </div>
                <span className="text-xs text-[#6d7a72] font-semibold mt-1">Real-Time Geotagged Maps</span>
              </div>
            </div>
          </section>

          {/* APP PILLARS SHOWCASE */}
          <section id="pillars" className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
                Platform Architecture
              </span>
              <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-extrabold text-[#131b2e] mt-4 mb-3">
                Four Modules for Ward Cleanliness
              </h2>
              <p className="text-sm text-[#3d4a42]">
                Connecting residents, drive coordinators, volunteer crews, and city sanitation dashboards in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Module 1 */}
              <div className="bg-white rounded-3xl p-6 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mb-2">
                    Geotagged Reporting
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-relaxed">
                    Snap photos of waste accumulation or overflowing bins. Precise GPS tags your exact ward automatically.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948]">
                  1-TAP GEOTAG DISPATCH
                </div>
              </div>

              {/* Module 2 */}
              <div className="bg-white rounded-3xl p-6 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mb-2">
                    Drive Coordination
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-relaxed">
                    Schedule cleanup drives, organize volunteer toolkits, rally residents, and verify before/after proof.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948]">
                  CLEANUP SCHEDULE & SQUADS
                </div>
              </div>

              {/* Module 3 */}
              <div className="bg-white rounded-3xl p-6 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mb-2">
                    Volunteer Platform
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-relaxed">
                    Join neighborhood squads, claim open waste spots, earn civic karma points, and unlock Civic Ranger badges.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948]">
                  BADGES & KARMA RANKS
                </div>
              </div>

              {/* Module 4 */}
              <div className="bg-white rounded-3xl p-6 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-md flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mb-2">
                    Real-Time Locality Maps
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-relaxed">
                    Explore interactive Leaflet OpenStreetMap heatmaps showing ward cleanliness scores and active cleanup routes.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948]">
                  LIVE LEAFLET HEATMAP
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM CTA BANNER */}
          <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-[#006948] to-[#004d34] rounded-[36px] p-8 md:p-14 text-white text-center relative overflow-hidden shadow-xl">
              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="font-mono text-xs text-[#85f8c4] font-bold uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
                  Protected Civic Portal
                </span>
                <h2 className="font-['Hanken_Grotesk'] text-3xl md:text-4xl font-extrabold mt-5 mb-4">
                  Sign In to Access Your Ward Dashboard
                </h2>
                <p className="text-sm md:text-base text-[#85f8c4]/90 leading-relaxed mb-8">
                  Authentication is required to view live interactive locality maps, drop geotagged waste report pins, and claim cleanup spots.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-8 py-4 bg-[#85f8c4] hover:bg-white text-[#002114] font-['Hanken_Grotesk'] text-base font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Login to Auth Portal
                  </Link>

                  <Link
                    href="/onboarding"
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-['Hanken_Grotesk'] text-base font-bold rounded-2xl border border-white/20 transition-all cursor-pointer"
                  >
                    Set Up Territory Profile
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E2E7FF] py-8 px-4 text-center text-xs text-[#6d7a72]">
          <p>© 2026 SafaiWatch Civic Hub. All rights reserved.</p>
        </footer>
      </div>
    );
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

  const currentUserId = userProfile?._id;
  const markedByUserId = selectedReport ? getMarkedByUserId(selectedReport.markedBy) : null;
  const isReportedByCurrentUser = Boolean(
    currentUserId && markedByUserId && String(currentUserId) === String(markedByUserId)
  );
  const isClaimableRole = ["Coordinator", "Hybrid"].includes(userProfile?.role || "");
  const markedByDetails = selectedReport ? getMarkedByDetails(selectedReport.markedBy) : null;
  const completedByDetails = selectedReport ? getCompletedByDetails(selectedReport.isCompletedBy) : null;

  // 3. AUTHENTICATED STATE: SHOW STITCH MAP DASHBOARD FOR AUTHENTICATED USERS
  return (
    <div className="h-screen w-full overflow-hidden relative bg-[#faf8ff] text-[#131b2e] font-sans antialiased select-none">
      {/* Dynamic Leaflet & OpenStreetMap Background Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <SafaiMap
          reports={reports}
          selectedCoordinates={droppedCoordinates}
          routingTarget={routingTarget}
          onSelectCoordinates={handleSelectCoordinates}
          onSelectReport={handleSelectReport}
          onClearRouting={() => setRoutingTarget(null)}
          zoom={14}
        />
      </div>

      {/* Floating Top App Bar (Stitch Specification - Centered with max-width on wider screens) */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl flex justify-between items-center rounded-full mt-4 h-14 px-4 bg-[#faf8ff]/85 backdrop-blur-md border border-[#bccac0]/30 shadow-md transition-transform hover:scale-[0.99]">
        {/* Left Brand & Location Info */}
        <div className="flex items-center gap-2 text-[#006948]">
          <MapPin className="w-5 h-5 text-[#006948]" />
          <div className="flex flex-col">
            <span className="font-['Hanken_Grotesk'] font-bold text-sm text-[#131b2e] leading-tight">
              Ward 14 · Central Sector
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-medium">
              Geotagged & Live
            </span>
          </div>
        </div>

        {/* Right Citizen Profile Avatar */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            title={userProfile?.name ? `View profile of ${userProfile.name}` : "View Profile"}
            className="relative w-10 h-10 rounded-full bg-emerald-100 overflow-hidden border-2 border-[#006948]/30 shadow-sm cursor-pointer hover:ring-2 hover:ring-[#006948] transition-all flex items-center justify-center shrink-0"
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name || "Civic Ranger Profile"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80";
                }}
              />
            ) : (
              <User className="w-5 h-5 text-[#006948]" />
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Active Civic Ranger"></div>
          </Link>
        </div>
      </header>



      {/* Interactive Pin Drop Instruction Banner */}
      {droppedCoordinates && (
        <div className="absolute top-[170px] left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-[#006948] text-white rounded-2xl p-4 shadow-xl flex items-center justify-between animate-enter border border-[#85f8c4]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#85f8c4]" />
            </div>
            <div>
              <p className="font-bold text-xs">Pin Dropped on Map!</p>
              <p className="text-[11px] font-mono text-[#85f8c4]">
                {droppedCoordinates[0].toFixed(4)}, {droppedCoordinates[1].toFixed(4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-[#85f8c4] text-[#002114] font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-white transition-colors cursor-pointer"
            >
              Report Site
            </button>
            <button
              onClick={() => setDroppedCoordinates(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Spot Preview / Bottom Sheet Card */}
      {selectedReport && !droppedCoordinates && (
        <div className="absolute bottom-[96px] left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-lg bg-[#faf8ff] border border-[#bccac0]/40 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] p-4 sm:p-5 flex flex-col gap-3.5 transition-all animate-enter">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  selectedReport.status === "critical"
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
              <span className="text-xs text-[#6d7a72] font-mono font-medium">
                📍 {selectedReport.distance || "Ward 14 Spot"}
              </span>
            </div>

            <button
              onClick={() => setSelectedReport(null)}
              className="text-[#6d7a72] hover:text-[#131b2e] p-1 rounded-full hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Card Content with Garbage Photo */}
          <div className="flex flex-col sm:flex-row gap-3.5 items-stretch">
            {selectedReport.image ? (
              <div className="relative sm:w-36 h-32 sm:h-auto rounded-2xl overflow-hidden border border-slate-300/80 bg-slate-900 shrink-0 shadow-sm group">
                <img
                  src={selectedReport.image}
                  alt={selectedReport.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30">
                  <Camera className="w-3 h-3 text-emerald-400" />
                  <span>Geotag Photo</span>
                </div>
              </div>
            ) : (
              <div className="sm:w-36 h-28 sm:h-auto rounded-2xl bg-gradient-to-br from-[#006948] to-slate-900 flex flex-col items-center justify-center p-3 text-white text-center shrink-0 border border-emerald-800/30">
                <Camera className="w-6 h-6 text-[#85f8c4] mb-1" />
                <span className="text-[10px] font-mono text-[#85f8c4] font-bold uppercase tracking-wider">
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
                  <p className="text-xs text-[#6d7a72] mt-1 flex items-center gap-1">
                    <span className="font-semibold">Category:</span> {selectedReport.category}
                  </p>
                )}
              </div>

              {/* Marked By Summary */}
              {markedByDetails && (
                <Link
                  href={`/profile/${encodeURIComponent(markedByDetails._id || markedByDetails.username)}`}
                  className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-200/60 hover:bg-emerald-100/80 hover:border-emerald-300 transition-colors cursor-pointer"
                  title={`View profile of @${markedByDetails.username}`}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center overflow-hidden shrink-0 border border-[#006948]/30">
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

              <div className="flex gap-2 flex-wrap text-xs">
                {selectedReport.volunteersNeeded ? (
                  <span className="font-mono text-[11px] font-semibold bg-[#006948]/10 text-[#006948] px-2.5 py-0.5 rounded-full border border-[#006948]/20">
                    👥 Needs {selectedReport.volunteersNeeded} Helpers
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-1">
            <button
              onClick={() => setIsSpotDetailModalOpen(true)}
              className="flex-1 bg-[#4b41e1]/10 hover:bg-[#4b41e1]/20 text-[#4b41e1] font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl border border-[#4b41e1]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#4b41e1]" />
              <span>View Details</span>
            </button>

            {routingTarget &&
            routingTarget[0] === selectedReport.lat &&
            routingTarget[1] === selectedReport.lng ? (
              <button
                onClick={() => setRoutingTarget(null)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl border border-red-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <X className="w-4 h-4 text-white" />
                <span>Close Route</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleNavigation(selectedReport)}
                className="flex-1 bg-[#dae2fd]/60 hover:bg-[#006948] text-[#131b2e] hover:text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl border border-[#bccac0]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs group"
              >
                <Navigation className="w-4 h-4 text-[#4b41e1] group-hover:text-white transition-colors" />
                <span>Navigate</span>
              </button>
            )}

            {!isReportedByCurrentUser && !selectedReport.isCompleted && isClaimableRole && (() => {
              const isAssigned = selectedReport.isAssignedBy && selectedReport.isAssignedBy.length > 0;
              if (isAssigned) {
                // Spot has been assigned → show "Complete Spot"
                return (
                  <button
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Complete Spot</span>
                  </button>
                );
              }
              // Spot is unassigned → show "Claim Spot"
              return (
                <button
                  onClick={() => handleClaimSpot(selectedReport)}
                  disabled={isClaimingSpot}
                  className="flex-1 bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] text-xs sm:text-sm font-bold py-2.5 px-2 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
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

      {/* Floating AI Assistant FAB Button */}
      <button
        onClick={() => setIsAiModalOpen(true)}
        className="absolute bottom-[96px] right-4 z-30 w-13 h-13 bg-[#4b41e1] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border-2 border-white"
        title="Ask SafaiWatch AI Assistant"
      >
        <Bot className="w-6 h-6 text-white" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#4b41e1]"></div>
      </button>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 sm:bottom-4 left-1/2 -translate-x-1/2 w-full sm:w-[calc(100%-2rem)] max-w-lg z-40 flex justify-around items-center px-6 pb-safe sm:pb-0 bg-[#faf8ff]/95 backdrop-blur-md h-16 sm:rounded-full rounded-t-3xl border-t sm:border border-[#bccac0]/30 shadow-[0_8px_30px_rgba(15,23,42,0.12)] transition-all">
        {/* Map Tab */}
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "map"
              ? "text-[#006948] scale-110 font-bold"
              : "text-[#6d7a72] hover:text-[#006948]"
          }`}
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Map</span>
        </button>

        {/* Explore / Feed Tab */}
        <Link
          href="/feed"
          className="flex flex-col items-center justify-center text-[#6d7a72] hover:text-[#006948] transition-all cursor-pointer"
        >
          <Compass className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Explore</span>
        </Link>

        {/* Add Report Pin Button */}
        <button
          onClick={() => {
            setActiveTab("add");
            alert("Click anywhere on the map to drop a pin and report waste!");
          }}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "add"
              ? "text-[#006948] scale-110 font-bold"
              : "text-[#6d7a72] hover:text-[#006948]"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#006948] text-white flex items-center justify-center shadow-md">
            <PlusCircle className="w-6 h-6 text-[#85f8c4]" />
          </div>
        </button>

        {/* Leaderboard / Rewards Tab */}
        <Link
          href="/rewards"
          className="flex flex-col items-center justify-center text-[#6d7a72] hover:text-[#006948] transition-all cursor-pointer"
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Ranks</span>
        </Link>

        {/* Profile Tab */}
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center text-[#6d7a72] hover:text-[#006948] transition-all cursor-pointer"
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </Link>
      </nav>

      {/* New Waste Site Reporting Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-enter overflow-y-auto">
          <div className="bg-[#faf8ff] rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setIsReportModalOpen(false);
                setSubmitError(null);
                setSubmitSuccess(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#006948]/10 text-[#006948] rounded-xl flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-extrabold text-slate-900 leading-tight">
                  Report Waste Location
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Coordinates: {droppedCoordinates ? `${droppedCoordinates[0].toFixed(5)}, ${droppedCoordinates[1].toFixed(5)}` : "Select pin on map"}
                </p>
              </div>
            </div>

            {!isSpotReportingRole && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Role Access Restriction</p>
                  <p className="mt-0.5 text-amber-800">
                    Spot reporting is only available for <strong>Civilian</strong> and <strong>Hybrid</strong> user roles. Coordinator accounts manage and resolve reported spots.
                  </p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateReport} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location Address / Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Near Sector 14 Public Park Gate"
                  value={newReportAddress}
                  onChange={(e) => setNewReportAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006948] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Incident Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the waste type, accumulation size, or hazard level..."
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006948] bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waste Category
                  </label>
                  <select
                    value={newReportCategory}
                    onChange={(e) => setNewReportCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#006948] bg-white font-medium"
                  >
                    <option value="Plastic Debris">Plastic Debris</option>
                    <option value="Organic Waste & Trash">Organic Waste &amp; Trash</option>
                    <option value="Drain & Sewage Silt">Drain &amp; Sewage Silt</option>
                    <option value="Construction Debris">Construction Debris</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Criticality Level
                  </label>
                  <select
                    value={newReportCritical}
                    onChange={(e) => setNewReportCritical(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#006948] bg-white font-medium"
                  >
                    <option value="Low">Low Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="High">High Severity</option>
                    <option value="Very High">Very High Severity</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Component */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Spot Photo <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  id="spot-image-upload"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {imagePreviewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 group h-36 flex items-center justify-center">
                    <img
                      src={imagePreviewUrl}
                      alt="Selected waste spot preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label
                        htmlFor="spot-image-upload"
                        className="bg-white/90 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white transition-colors"
                      >
                        Change Photo
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagePreviewUrl(null);
                        }}
                        className="bg-red-600 text-[#ffffff] font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="spot-image-upload"
                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-[#006948] rounded-2xl bg-white hover:bg-[#006948]/5 transition-all cursor-pointer text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to upload spot photo
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      JPG, PNG or WEBP (Max 5MB)
                    </span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !isSpotReportingRole}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-bold text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Submit Spot Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-enter overflow-y-auto">
          <div className="bg-[#faf8ff] rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => setIsSpotDetailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#4b41e1]/10 text-[#4b41e1] rounded-xl flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-extrabold text-slate-900 leading-tight">
                  Spot Details &amp; Inspection
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {selectedReport.id}
                </p>
              </div>
            </div>

            {/* Large Image Preview */}
            {selectedReport.image ? (
              <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 mb-4 shadow-sm group">
                <img
                  src={selectedReport.image}
                  alt={selectedReport.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-emerald-300 font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/30 shadow-sm">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Geotagged Photo</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-[#006948] to-slate-900 flex flex-col items-center justify-center p-4 text-white text-center mb-4 border border-emerald-800/30 shadow-sm">
                <Camera className="w-8 h-8 text-[#85f8c4] mb-2" />
                <span className="text-xs font-mono text-[#85f8c4] font-bold uppercase tracking-wider">
                  No Photo Uploaded
                </span>
              </div>
            )}

            {/* Details Content */}
            <div className="space-y-3.5 mb-6 text-sm text-slate-800">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-0.5">Status &amp; Severity</span>
                  <span
                    className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full uppercase border ${
                      selectedReport.status === "critical"
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
                  <span className="text-xs font-semibold text-slate-500 block mb-0.5">Coordinates</span>
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    📍 {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Marked By / Reporter Card */}
              {markedByDetails && (
                <div className="bg-[#006948]/5 border border-[#006948]/20 rounded-2xl p-3.5 flex items-center justify-between gap-3">
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
                        <span className="font-['Hanken_Grotesk'] text-sm font-extrabold text-slate-900">
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

                  {isReportedByCurrentUser && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shrink-0 shadow-xs">
                      Your Spot
                    </span>
                  )}
                </div>
              )}

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

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Address / Location</span>
                <p className="font-bold text-slate-900 text-sm bg-white p-3 rounded-xl border border-slate-200">
                  {selectedReport.category || selectedReport.distance || "Ward 14 Locality"}
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

              {!isReportedByCurrentUser && !selectedReport.isCompleted && isClaimableRole && (() => {
                const isAssigned = selectedReport.isAssignedBy && selectedReport.isAssignedBy.length > 0;
                if (isAssigned) {
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

      {/* Complete Spot Form Modal */}
      {isCompleteModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-enter overflow-y-auto">
          <div className="bg-[#faf8ff] rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setIsCompleteModalOpen(false);
                setCompleteDescription("");
                setCompleteImageFile(null);
                setCompleteImagePreview(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-500/15 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-extrabold text-slate-900 leading-tight">
                  Complete Spot Cleanup
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedReport.title}
                </p>
              </div>
            </div>

            {/* Spot Before Image */}
            {selectedReport.image && (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 mb-4 shadow-sm">
                <img
                  src={selectedReport.image}
                  alt="Before cleanup"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-red-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-500/30">
                  📸 Before
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCompleteSpot();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cleanup Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe what was cleaned up, methods used..."
                  value={completeDescription}
                  onChange={(e) => setCompleteDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  After Photo (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="complete-image-upload"
                  onChange={handleCompleteImageChange}
                  className="hidden"
                />

                {completeImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 group h-36 flex items-center justify-center">
                    <img
                      src={completeImagePreview}
                      alt="After cleanup preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-emerald-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                      📸 After
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label
                        htmlFor="complete-image-upload"
                        className="bg-white/90 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white transition-colors"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCompleteImageFile(null);
                          setCompleteImagePreview(null);
                        }}
                        className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="complete-image-upload"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl bg-white hover:bg-amber-50/50 transition-all cursor-pointer text-center group"
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                      <Camera className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Upload after-cleanup photo
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      JPG, PNG or WEBP (Max 5MB)
                    </span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompleteModalOpen(false);
                    setCompleteDescription("");
                    setCompleteImageFile(null);
                    setCompleteImagePreview(null);
                  }}
                  disabled={isCompletingSpot}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCompletingSpot}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isCompletingSpot ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Mark as Completed</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
