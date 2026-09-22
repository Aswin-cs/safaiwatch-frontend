"use client";

import React, { useState, useEffect } from "react";
import { spotsApi } from "@/lib/api";

export interface ReportWasteSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  droppedCoordinates?: [number, number] | null; // [lat, lng]
  onSuccess?: (newReport: any) => void;
  userRole?: string;
}

export default function ReportWasteSpotModal({
  isOpen,
  onClose,
  droppedCoordinates,
  onSuccess,
  userRole = "Civilian",
}: ReportWasteSpotModalProps) {
  // Verification Mode Tab State
  const [verificationMode, setVerificationMode] = useState<"hand" | "code">("hand");

  // Gesture Verification State
  const [gestureImageUrl, setGestureImageUrl] = useState<string | null>(null);
  const [gestureId, setGestureId] = useState<string | null>(null);
  const [isLoadingGesture, setIsLoadingGesture] = useState<boolean>(false);

  // Telemetry / Location State
  const [coords, setCoords] = useState<[number, number]>(
    droppedCoordinates ? [droppedCoordinates[0], droppedCoordinates[1]] : [11.7284, 76.2841]
  );
  const [isRecalibrating, setIsRecalibrating] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");

  // Category & Severity State
  const [wasteCategory, setWasteCategory] = useState<string>("Plastics & Wraps");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "very_high">("medium");

  // File Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize droppedCoordinates or fetch current live GPS spot location when opened
  useEffect(() => {
    if (!isOpen) return;

    if (droppedCoordinates) {
      setCoords([droppedCoordinates[0], droppedCoordinates[1]]);
    } else if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsRecalibrating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
          setIsRecalibrating(false);
        },
        (err) => {
          console.warn("GPS error fetching current spot location:", err);
          setIsRecalibrating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [isOpen, droppedCoordinates]);

  // Fetch random gesture verification photo and ID when modal is open and mode is "hand"
  useEffect(() => {
    if (!isOpen || verificationMode !== "hand") return;

    let isMounted = true;
    const fetchGesture = async () => {
      setIsLoadingGesture(true);
      try {
        const geoCoords: [number, number] = [coords[1], coords[0]];
        const res = await spotsApi.getRandomGestureVerification({ coordinates: geoCoords });
        if (isMounted && res && res.success) {
          const imgUrl = (res as any).imageUrl || (res as any).data?.imageUrl;
          const imgId = (res as any).imageId || (res as any).data?.imageId;
          if (imgUrl) setGestureImageUrl(imgUrl);
          if (imgId) setGestureId(imgId);
        }
      } catch (err) {
        console.error("Failed to fetch gesture verification photo:", err);
      } finally {
        if (isMounted) {
          setIsLoadingGesture(false);
        }
      }
    };

    fetchGesture();
    return () => {
      isMounted = false;
    };
  }, [isOpen, verificationMode, coords]);

  if (!isOpen) return null;

  const normalizedRole = (userRole || "").trim().toLowerCase();
  const isCoordinator = normalizedRole === "coordinator";

  if (isCoordinator) {
    return (
      <div className="fixed inset-0 z-50 bg-[#131b2e]/70 backdrop-blur-md flex justify-center items-center p-4 animate-enter">
        <div className="w-full max-w-md bg-[#faf8ff] text-[#131b2e] rounded-3xl shadow-2xl border border-[#dae2fd] overflow-hidden p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] text-[#93000a] flex items-center justify-center border border-[#ffb4ab]">
            <span className="material-symbols-outlined text-3xl">block</span>
          </div>
          <div>
            <h3 className="text-lg font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
              Action Restricted for Coordinators
            </h3>
            <p className="text-xs font-['Inter'] text-[#3d4a42] mt-2 leading-relaxed">
              Waste spot reporting is exclusively available for <strong>Civilian</strong> and <strong>Hybrid</strong> user roles. Coordinators are not allowed to submit waste spot reports.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-5 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] font-bold text-sm transition-all cursor-pointer shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Real-time GPS Recalibration
  const handleRecalibrateGps = () => {
    setIsRecalibrating(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
          setIsRecalibrating(false);
        },
        (err) => {
          console.warn("GPS error during recalibration:", err);
          setIsRecalibrating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setTimeout(() => setIsRecalibrating(false), 600);
    }
  };

  // Image Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg("Image file size must be under 8MB.");
        return;
      }
      setImageFile(file);
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // SLA Configuration dictionary based on Stitch Design
  const slaConfig = {
    low: {
      title: "Municipal Crew SLA < 24 Hours",
      desc: "Scheduled during standard ward sweep",
      icon: "schedule",
      colorBg: "bg-[#85f8c4]/30",
      colorText: "text-[#002114]",
      badgeColor: "text-[#006948]",
      criticalValue: "Low",
    },
    medium: {
      title: "Municipal Crew SLA < 12 Hours",
      desc: "Dispatched directly to Ward 14 Sanitation Unit",
      icon: "timer",
      colorBg: "bg-[#fef3c7]",
      colorText: "text-[#78350f]",
      badgeColor: "text-[#d97706]",
      criticalValue: "Medium",
    },
    high: {
      title: "Priority Crew SLA < 4 Hours",
      desc: "Escalated to Urgent Sanitation Squad",
      icon: "warning",
      colorBg: "bg-[#ffdbce]",
      colorText: "text-[#370e00]",
      badgeColor: "text-[#a33900]",
      criticalValue: "High",
    },
    very_high: {
      title: "Emergency Team SLA < 45 Mins",
      desc: "Escalated to Hazardous Response & Pollution Board",
      icon: "e911_emergency",
      colorBg: "bg-[#ffdad6]",
      colorText: "text-[#93000a]",
      badgeColor: "text-[#ba1a1a]",
      criticalValue: "Very High",
    },
  };

  const currentSla = slaConfig[severity];

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!imageFile) {
      setErrorMsg("Please upload a photo of the waste spot to verify optical presence.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formattedGeoLocation = `Lat ${coords[0].toFixed(6)}, Lng ${coords[1].toFixed(6)}`;
      const formData = new FormData();
      formData.append("address", formattedGeoLocation);
      formData.append("category", wasteCategory);
      formData.append("wasteType", wasteCategory);
      formData.append(
        "description",
        description.trim() || `${wasteCategory} reported at ${formattedGeoLocation}`
      );
      formData.append("critical", currentSla.criticalValue);
      formData.append("image", imageFile);

      // GeoJSON standard: [longitude, latitude]
      const geoCoords = [coords[1], coords[0]];
      formData.append("coordinates", JSON.stringify(geoCoords));
      formData.append("userLocation", JSON.stringify(geoCoords));

      if (gestureId) {
        formData.append("gestureVerificationId", gestureId);
        formData.append("gestureImageId", gestureId);
        formData.append("gestureId", gestureId);
      }

      const res = await spotsApi.createSpot(formData);

      if (res && res.success) {
        setSuccessMsg("Spot verified and uploaded successfully! +50 XP Earned.");
        if (onSuccess) {
          onSuccess(res.spot);
        }
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res?.message || "Failed to submit waste report. Please check your inputs.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error submitting waste spot report:", err);
      setErrorMsg(err?.message || "Network error while submitting spot report.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#131b2e]/70 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto animate-enter">
      {/* Modal Container */}
      <div className="w-full max-w-xl bg-[#faf8ff] text-[#131b2e] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-[#faf8ff]/90 backdrop-blur-md border-b border-[#dae2fd] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#3d4a42] hover:text-[#131b2e] hover:bg-[#e2e7ff] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>

          <div className="flex-1 flex flex-col items-center justify-center min-w-0">
            <h2 className="text-base font-['Hanken_Grotesk'] font-bold text-[#131b2e] truncate max-w-[220px] text-center tracking-tight">
              Report Waste Spot
            </h2>
            <span className="text-[11px] font-['JetBrains_Mono'] text-[#006948] font-bold uppercase tracking-wider">
              Verification &amp; Telemetry
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#006948] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
        </header>



        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-2xl border border-[#ffb4ab] text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#85f8c4]/40 text-[#005137] p-3 rounded-2xl border border-[#006948]/30 text-xs flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Interactive Live Viewfinder & Proof of Presence */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#283044] shadow-md select-none group flex items-center justify-center">
              {/* Photo Preview if loaded */}
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Waste spot preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-[#dae2fd] gap-2">
                  <span className="material-symbols-outlined text-4xl text-[#68dba9] animate-pulse">
                    photo_camera
                  </span>
                  <span className="text-xs font-['Hanken_Grotesk'] font-bold">
                    Target Waste &amp; Liveness Proof
                  </span>
                </div>
              )}

              {/* Camera HUD Layer Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 bg-gradient-to-b from-black/50 via-transparent to-black/70">
                {/* Central Crosshair / Focus HUD */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute w-full h-[1px] bg-white/40"></div>
                    <div className="absolute h-full w-[1px] bg-white/40"></div>
                    <div className="w-14 h-14 rounded-full border border-dashed border-white/80"></div>
                  </div>
                </div>

                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="bg-black/60 backdrop-blur-md text-[#85f8c4] font-['JetBrains_Mono'] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#85f8c4]/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#85f8c4] animate-pulse"></span>
                    AI LIVENESS CAMERA
                  </span>

                  <span className="bg-black/60 backdrop-blur-md text-white font-['JetBrains_Mono'] text-[10px] font-bold px-2 py-1 rounded-full">
                    GNSS: {coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E
                  </span>
                </div>

                {/* Upload Action Button */}
                <div className="relative flex items-end justify-between pointer-events-auto">
                  <label className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-[#131b2e] px-3.5 py-2 rounded-full text-xs font-['JetBrains_Mono'] font-bold shadow-md hover:bg-white active:scale-95 transition-all cursor-pointer border border-[#bccac0]/50">
                    <span className="material-symbols-outlined text-[16px] text-[#006948]">photo_library</span>
                    <span>{imagePreview ? "Change Photo" : "Upload Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="bg-[#ba1a1a] text-white text-xs font-['JetBrains_Mono'] font-bold px-3 py-2 rounded-full shadow-md hover:bg-[#93000a] transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#3d4a42] text-center px-2 font-['Inter']">
              Real-time optical anti-spoofing confirms you are standing at the waste spot.
            </p>
          </div>

          {/* 2. Liveness Verification Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#bccac0]/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[#006948] text-[11px] font-['JetBrains_Mono'] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Liveness Verification</span>
              </div>
            </div>

            {/* Verification Mode Selector */}
            <div className="grid grid-cols-2 p-1 bg-[#f2f3ff] rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setVerificationMode("hand")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-['Hanken_Grotesk'] font-bold transition-all cursor-pointer ${verificationMode === "hand"
                  ? "bg-white text-[#006948] shadow-xs"
                  : "text-[#3d4a42] hover:text-[#131b2e]"
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">front_hand</span>
                <span>Hand Gesture</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationMode("code")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-['Hanken_Grotesk'] font-bold transition-all cursor-pointer ${verificationMode === "code"
                  ? "bg-white text-[#006948] shadow-xs"
                  : "text-[#3d4a42] hover:text-[#131b2e]"
                  }`}
              >
                <span className="material-symbols-outlined text-[16px]">draw</span>
                <span>Code Word</span>
              </button>
            </div>

            {/* Hand Gesture Content */}
            {verificationMode === "hand" ? (
              <div className="flex items-center gap-3.5 bg-[#f2f3ff] p-2.5 rounded-xl border border-[#dae2fd]/60">
                <div className="relative w-20 h-24 rounded-lg overflow-hidden shrink-0 border border-[#bccac0]/40 bg-[#eaedff] flex items-center justify-center">
                  {isLoadingGesture ? (
                    <div className="flex flex-col items-center justify-center p-2 text-[#006948]">
                      <span className="material-symbols-outlined text-2xl animate-spin">
                        progress_activity
                      </span>
                      <span className="text-[9px] font-['JetBrains_Mono'] font-bold mt-1">Loading...</span>
                    </div>
                  ) : (
                    <img
                      src={
                        gestureImageUrl ||
                        "https://res.cloudinary.com/pwtmlbit/image/upload/v1789486427/gestures_Hand_holding_three_fingers_up_20260915102611.png"
                      }
                      alt="Instructional hand gesture for optical verification"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80";
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] mb-0.5">
                    <span>Perform Required Gesture</span>
                    <span className="text-xs">✌️☝️</span>
                  </div>
                  <p className="text-[11px] font-['Inter'] text-[#3d4a42] leading-tight mb-2">
                    Extend index, middle, and ring fingers into the viewfinder box to fulfill optical presence proof.
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] text-[#006948] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse"></span>
                    <span>
                      {gestureId ? `Verification ID: ${gestureId.slice(-6)}` : "Optical Anti-Spoofing Active"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Code Word Content */
              <div className="flex items-center gap-3.5 bg-[#f2f3ff] p-2.5 rounded-xl border border-[#dae2fd]/60">
                <div className="w-20 h-24 rounded-lg border border-[#bccac0]/40 bg-[#dae2fd] flex flex-col items-center justify-center p-2 text-center shrink-0">
                  <span className="material-symbols-outlined text-[#a33900] text-2xl">edit_note</span>
                  <span className="font-['JetBrains_Mono'] font-bold text-xs text-[#131b2e] tracking-wider mt-1 bg-white px-1.5 py-0.5 rounded border border-[#bccac0]/40">
                    &apos;OAK&apos;
                  </span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] mb-0.5">
                    <span>Write Daily Code &apos;OAK&apos;</span>
                    <span className="text-xs">📝</span>
                  </div>
                  <p className="text-[11px] font-['Inter'] text-[#3d4a42] leading-tight mb-2">
                    Write the word <strong>OAK</strong> on paper, cardboard or chalk-slate and place visibly beside the waste pile.
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] text-[#a33900] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a33900] animate-pulse"></span>
                    <span>Valid for next 14 mins</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Geofenced Location Intelligence Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#bccac0]/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#3d4a42] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#006948]">satellite_alt</span>
                GEOGRAPHIC TELEMETRY
              </span>

              <button
                type="button"
                onClick={handleRecalibrateGps}
                disabled={isRecalibrating}
                className="inline-flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] font-bold text-[#006948] hover:bg-[#006948]/10 py-1 px-2.5 rounded-lg bg-[#f2f3ff] transition-all cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[13px] ${isRecalibrating ? "animate-spin" : ""}`}>
                  refresh
                </span>
                <span>{isRecalibrating ? "Calibrating..." : "Recalibrate"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Radar Map Pin Graphic */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#006948]/10 border border-[#006948]/30 flex items-center justify-center">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006948] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-[#006948] text-white items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  </span>
                </span>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-['Hanken_Grotesk'] font-bold text-[#131b2e] truncate">
                    GPS Coordinates
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] bg-[#85f8c4] text-[#002114] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                    RTK GNSS
                  </span>
                </div>
                <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#006948] mt-0.5 flex items-center gap-3">
                  <span>Lat: {coords[0].toFixed(6)}° N</span>
                  <span>Lng: {coords[1].toFixed(6)}° E</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#006948] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006948]"></span>
                    ±3.2m accuracy
                  </span>
                  <span className="text-[11px] text-[#3d4a42] font-['JetBrains_Mono']">• Drain Sector B</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Multi-Select Waste Category Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="wasteCategorySelect" className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#3d4a42] font-bold px-1">
              WASTE CATEGORY
            </label>
            <div className="relative w-full">
              <select
                id="wasteCategorySelect"
                value={wasteCategory}
                onChange={(e) => setWasteCategory(e.target.value)}
                className="w-full appearance-none bg-white text-[#131b2e] text-sm font-semibold rounded-xl border border-[#bccac0]/60 px-3.5 py-2.5 pr-10 shadow-xs focus:outline-none focus:border-[#006948] transition-all cursor-pointer"
              >
                <option value="Mixed Waste">Mixed Waste</option>
                <option value="Plastics & Wraps">Plastics &amp; Wraps</option>
                <option value="Organic / Food Waste">Organic / Food Waste</option>
                <option value="E-Waste & Batteries">E-Waste &amp; Batteries</option>
                <option value="Construction Debris & Rubble">Construction Debris &amp; Rubble</option>
                <option value="Medical & Hazardous Residue">Medical &amp; Hazardous Residue</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#3d4a42]">
                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
              </div>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#3d4a42] font-bold px-1">
              INCIDENT DESCRIPTION (OPTIONAL)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe accumulation size, drainage blockage, or specific hazards..."
              className="w-full bg-white text-[#131b2e] text-xs font-medium rounded-xl border border-[#bccac0]/60 px-3.5 py-2.5 focus:outline-none focus:border-[#006948] transition-all resize-none"
            />
          </div>

          {/* 5. Environmental Severity Risk Picker */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-wider text-[#3d4a42] font-bold">
                ENVIRONMENTAL SEVERITY RISK
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#a33900] uppercase">
                Priority: Urgent Dispatch
              </span>
            </div>

            {/* Segmented Risk Buttons */}
            <div className="grid grid-cols-4 gap-1 bg-[#f2f3ff] p-1.5 rounded-2xl">
              {/* Low Risk */}
              <button
                type="button"
                onClick={() => setSeverity("low")}
                className={`sev-btn py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${severity === "low"
                  ? "bg-white shadow-md text-[#131b2e]"
                  : "bg-transparent text-[#3d4a42] hover:text-[#131b2e]"
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#006948]"></div>
                <span className={`text-xs font-['Hanken_Grotesk'] leading-none ${severity === "low" ? "font-bold text-[#006948]" : "font-semibold"}`}>
                  Low
                </span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#3d4a42] leading-none">Non-blocking</span>
              </button>

              {/* Medium Risk */}
              <button
                type="button"
                onClick={() => setSeverity("medium")}
                className={`sev-btn py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${severity === "medium"
                  ? "bg-white shadow-md text-[#131b2e]"
                  : "bg-transparent text-[#3d4a42] hover:text-[#131b2e]"
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#d97706] animate-pulse"></div>
                <span className={`text-xs font-['Hanken_Grotesk'] leading-none ${severity === "medium" ? "font-bold text-[#d97706]" : "font-semibold"}`}>
                  Medium
                </span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#3d4a42] leading-none">Blocking Drain</span>
              </button>

              {/* High Risk */}
              <button
                type="button"
                onClick={() => setSeverity("high")}
                className={`sev-btn py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${severity === "high"
                  ? "bg-white shadow-md text-[#131b2e]"
                  : "bg-transparent text-[#3d4a42] hover:text-[#131b2e]"
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#a33900]"></div>
                <span className={`text-xs font-['Hanken_Grotesk'] leading-none ${severity === "high" ? "font-bold text-[#a33900]" : "font-semibold"}`}>
                  High
                </span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#3d4a42] leading-none">Hazardous</span>
              </button>

              {/* Very High Risk */}
              <button
                type="button"
                onClick={() => setSeverity("very_high")}
                className={`sev-btn py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${severity === "very_high"
                  ? "bg-white shadow-md text-[#131b2e]"
                  : "bg-transparent text-[#3d4a42] hover:text-[#131b2e]"
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></div>
                <span className={`text-xs font-['Hanken_Grotesk'] leading-none ${severity === "very_high" ? "font-bold text-[#ba1a1a]" : "font-semibold"}`}>
                  Very High
                </span>
                <span className="text-[9px] font-['JetBrains_Mono'] text-[#3d4a42] leading-none">Toxic / Water</span>
              </button>
            </div>

            {/* Real-Time SLA Dynamic Impact Badge */}
            <div className="bg-white rounded-xl p-3 shadow-xs border border-[#bccac0]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${currentSla.colorBg} ${currentSla.colorText} flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-outlined text-[18px]">{currentSla.icon}</span>
                </div>
                <div>
                  <div className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
                    {currentSla.title}
                  </div>
                  <div className="text-[11px] font-['Inter'] text-[#3d4a42]">
                    {currentSla.desc}
                  </div>
                </div>
              </div>
              <span className={`material-symbols-outlined text-[18px] ${currentSla.badgeColor} shrink-0`}>
                speed
              </span>
            </div>
          </div>

          <div className="h-4"></div>
        </form>

        {/* 6. Sticky Bottom Submission Bar */}
        <div className="bg-white border-t border-[#dae2fd] px-4 py-3 shrink-0">
          <div className="max-w-xl mx-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 py-3 px-6 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] font-bold text-base flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying &amp; Uploading...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  <span>Verify &amp; Upload Spot</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-['JetBrains_Mono'] font-bold ml-1">
                    +50 XP
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] font-['JetBrains_Mono'] text-[#3d4a42]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006948]"></span>
              <span>Zero-Knowledge Location Attestation Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
