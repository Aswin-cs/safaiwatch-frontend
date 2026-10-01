"use client";

import React, { useState, useEffect, useRef } from "react";
import { spotsApi } from "@/lib/api";

export interface CompleteWasteSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: any;
  onSuccess?: (updatedSpot: any) => void;
  userRole?: string;
}

export default function CompleteWasteSpotModal({
  isOpen,
  onClose,
  spot,
  onSuccess,
  userRole = "Civilian",
}: CompleteWasteSpotModalProps) {
  // Verification Mode Tab State ("hand" gesture or "code")
  const [verificationMode, setVerificationMode] = useState<"hand" | "code">("hand");

  // Gesture Verification State
  const [gestureImageUrl, setGestureImageUrl] = useState<string | null>(null);
  const [gestureId, setGestureId] = useState<string | null>(null);
  const [isLoadingGesture, setIsLoadingGesture] = useState<boolean>(false);

  // Code Verification State
  const [codeText, setCodeText] = useState<string | null>(null);
  const [codeId, setCodeId] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);

  // Verification Countdown Expiry State (180s for gesture, 300s for code)
  const [gestureExpiresAt, setGestureExpiresAt] = useState<number | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Active time left in seconds computed dynamically from current timestamp
  const activeExpiresAt = verificationMode === "hand" ? gestureExpiresAt : codeExpiresAt;
  const timeLeft = activeExpiresAt !== null ? Math.max(0, Math.ceil((activeExpiresAt - currentTime) / 1000)) : null;

  // Mode Switch Lock State (max 4 switches per session)
  const [switchCount, setSwitchCount] = useState<number>(0);

  // Refresh Quota State
  const [refreshCountBeforeExpiry, setRefreshCountBeforeExpiry] = useState<number>(0);
  const [refreshCountAfterExpiry, setRefreshCountAfterExpiry] = useState<number>(0);

  // Cleanup Description
  const [description, setDescription] = useState<string>("");

  // After Photo State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isFetchingGestureRef = useRef<boolean>(false);
  const isFetchingCodeRef = useRef<boolean>(false);

  // Formatter for MM:SS timer display
  const formatTimeLeft = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Reset form helper
  const resetFormState = () => {
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGestureImageUrl(null);
    setGestureId(null);
    setCodeText(null);
    setCodeId(null);
    setGestureExpiresAt(null);
    setCodeExpiresAt(null);
    setVerificationMode("hand");
    setRefreshTrigger(0);
    setSwitchCount(0);
    setRefreshCountBeforeExpiry(0);
    setRefreshCountAfterExpiry(0);
    isFetchingGestureRef.current = false;
    isFetchingCodeRef.current = false;
  };

  // Mode Switch Handler
  const handleSelectMode = (newMode: "hand" | "code") => {
    if (newMode === verificationMode) return;

    if (switchCount >= 4) {
      setErrorMsg("Maximum verification mode switches reached (4/4). Mode selection is locked.");
      return;
    }

    setSwitchCount((prev) => prev + 1);
    setVerificationMode(newMode);
    setCurrentTime(Date.now());
    setErrorMsg(null);
  };

  // Refresh Verification handler
  const handleRefreshVerification = () => {
    if (timeLeft === 0) {
      if (refreshCountAfterExpiry >= 2) {
        setErrorMsg("Maximum post-expiry refreshes reached (2/2). Please reopen the modal to restart verification.");
        return;
      }
      setRefreshCountAfterExpiry((prev) => prev + 1);
    } else {
      if (refreshCountBeforeExpiry >= 3) {
        setErrorMsg("Maximum pre-expiry refreshes reached (3/3). Please wait for timer to expire or submit resolution.");
        return;
      }
      setRefreshCountBeforeExpiry((prev) => prev + 1);
    }

    setGestureExpiresAt(null);
    setCodeExpiresAt(null);
    setGestureId(null);
    setGestureImageUrl(null);
    setCodeId(null);
    setCodeText(null);
    setErrorMsg(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    }
  }, [isOpen]);

  // Coordinates & target ID helper
  const targetSpotId = spot?._id || spot?.id;
  const spotCoordinates: [number, number] = spot?.coordinates?.length === 2
    ? [spot.coordinates[1], spot.coordinates[0]] // [lat, lng]
    : [11.7284, 76.2841];

  // Fetch Gesture Verification when mode is "hand"
  useEffect(() => {
    if (!isOpen || verificationMode !== "hand") return;
    if (gestureId || isFetchingGestureRef.current) return;

    isFetchingGestureRef.current = true;
    let isMounted = true;
    const fetchGesture = async () => {
      setIsLoadingGesture(true);
      try {
        const res = await spotsApi.getRandomGestureVerification({
          spotId: targetSpotId,
          markspotid: targetSpotId,
          coordinates: [spotCoordinates[1], spotCoordinates[0]], // [lng, lat]
          action: "complete",
        });
        if (isMounted && res && res.success) {
          const imgUrl = (res as any).imageUrl || (res as any).data?.imageUrl;
          const imgId = (res as any).imageId || (res as any).data?.imageId;
          if (imgUrl) setGestureImageUrl(imgUrl);
          if (imgId) setGestureId(imgId);
          setGestureExpiresAt(Date.now() + 180 * 1000); // 3 minutes for loaded gesture
        }
      } catch (err) {
        console.error("Failed to fetch completion gesture verification:", err);
      } finally {
        if (isMounted) {
          setIsLoadingGesture(false);
        }
        isFetchingGestureRef.current = false;
      }
    };

    fetchGesture();
    return () => {
      isMounted = false;
    };
  }, [isOpen, verificationMode, gestureId, refreshTrigger, targetSpotId]);

  // Fetch Code Verification when mode is "code"
  useEffect(() => {
    if (!isOpen || verificationMode !== "code") return;
    if (codeId || isFetchingCodeRef.current) return;

    isFetchingCodeRef.current = true;
    let isMounted = true;
    const fetchCode = async () => {
      setIsLoadingCode(true);
      try {
        const res = await spotsApi.getRandomCodeVerification({
          spotId: targetSpotId,
          markspotid: targetSpotId,
          coordinates: [spotCoordinates[1], spotCoordinates[0]], // [lng, lat]
          action: "complete",
        });
        if (isMounted && res && res.success) {
          const cVal = (res as any).code || (res as any).data?.code;
          const cId = (res as any).verificationId || (res as any).data?.verificationId;
          if (cVal) setCodeText(cVal);
          if (cId) setCodeId(cId);
          setCodeExpiresAt(Date.now() + 300 * 1000); // 5 minutes for loaded code
        }
      } catch (err) {
        console.error("Failed to fetch completion code verification:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCode(false);
        }
        isFetchingCodeRef.current = false;
      }
    };

    fetchCode();
    return () => {
      isMounted = false;
    };
  }, [isOpen, verificationMode, codeId, refreshTrigger, targetSpotId]);

  if (!isOpen || !spot) return null;

  // Handle file change
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

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const activeVerificationId = verificationMode === "hand" ? gestureId : (codeId || gestureId);

    if (!imageFile) {
      setErrorMsg("Please upload an after-cleanup photo to verify spot remediation.");
      return;
    }

    if (!activeVerificationId) {
      setErrorMsg("Valid liveness verification ID is required. Please wait for verification to load.");
      return;
    }

    if (timeLeft !== null && timeLeft <= 0) {
      setErrorMsg("Verification token has expired (00:00). Please click 'Refresh' to generate a new verification token.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      formData.append("imageAfter", imageFile);

      if (activeVerificationId) {
        formData.append("verificationId", activeVerificationId);
        formData.append("gestureVerificationId", activeVerificationId);
        formData.append("gestureImageId", activeVerificationId);
        formData.append("gestureId", activeVerificationId);
        formData.append("codeId", activeVerificationId);
        formData.append("type", verificationMode === "hand" ? "gesture" : "code");
        formData.append("action", "complete");
      }

      const res = await spotsApi.completeSpot(spot._id || spot.id, formData);

      if (res && res.success) {
        setSuccessMsg(res.message || "Cleanup photo uploaded! AI verification in progress...");
        if (onSuccess) {
          onSuccess((res as any)?.spot || (res as any)?.data || spot);
        }
        setTimeout(() => {
          setIsSubmitting(false);
          resetFormState();
          onClose();
        }, 1400);
      } else {
        setErrorMsg(res?.message || "Failed to complete spot cleanup. Please check your inputs.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error submitting spot completion:", err);
      setErrorMsg(err?.message || "Network error while completing spot.");
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
            <h2 className="text-base font-['Hanken_Grotesk'] font-bold text-[#131b2e] truncate max-w-[240px] text-center tracking-tight">
              Complete Spot Cleanup
            </h2>
            <span className="text-[11px] font-['JetBrains_Mono'] text-[#006948] font-bold uppercase tracking-wider">
              Verification &amp; Remediation Proof
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#006948] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
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

          {/* Spot Before Reference Card */}
          {spot.image && (
            <div className="bg-[#f2f3ff] rounded-2xl p-3 border border-[#dae2fd]/70 flex items-center gap-3 shadow-xs">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-[#bccac0]/40 bg-[#283044]">
                <img
                  src={spot.image}
                  alt="Original spot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-rose-300 font-['JetBrains_Mono'] text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-rose-500/30">
                  BEFORE
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#006948]/10 text-[#006948] text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded-md">
                    {spot.category || spot.wasteCategory || "Waste Spot"}
                  </span>
                  <span className="text-[10px] text-[#535f70] font-['JetBrains_Mono']">
                    ID: {(spot._id || spot.id || "").slice(-6)}
                  </span>
                </div>
                <h4 className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] truncate mt-1">
                  {spot.title || spot.address || "Reported Location"}
                </h4>
                <p className="text-[11px] text-[#3d4a42] line-clamp-1 mt-0.5">
                  {spot.description || "Reported waste area awaiting cleanup resolution"}
                </p>
              </div>
            </div>
          )}

          {/* 1. Interactive Live Viewfinder & Cleanup Proof (After Photo) */}
          <div className="flex flex-col gap-2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#283044] shadow-md select-none group flex items-center justify-center">
              {/* Photo Preview if loaded */}
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Remediated spot cleanup preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-[#dae2fd] gap-2">
                  <span className="material-symbols-outlined text-4xl text-[#68dba9] animate-pulse">
                    photo_camera
                  </span>
                  <span className="text-xs font-['Hanken_Grotesk'] font-bold">
                    Cleaned Spot &amp; Optical Proof
                  </span>
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#85f8c4]/80">
                    Capture the fully cleaned area
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
                    AI CLEANUP RESOLUTION
                  </span>

                  <span className="bg-black/60 backdrop-blur-md text-white font-['JetBrains_Mono'] text-[10px] font-bold px-2 py-1 rounded-full">
                    AFTER PHOTO
                  </span>
                </div>

                {/* Upload Action Button */}
                <div className="relative flex items-end justify-between pointer-events-auto">
                  <label className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-[#131b2e] px-3.5 py-2 rounded-full text-xs font-['JetBrains_Mono'] font-bold shadow-md hover:bg-white active:scale-95 transition-all cursor-pointer border border-[#bccac0]/50">
                    <span className="material-symbols-outlined text-[16px] text-[#006948]">photo_library</span>
                    <span>{imagePreview ? "Change Photo" : "Upload After Photo"}</span>
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
              Optical verification confirms the spot is completely cleared of waste and litter.
            </p>
          </div>

          {/* 2. Liveness Verification Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#bccac0]/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[#006948] text-[11px] font-['JetBrains_Mono'] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Liveness Verification</span>
              </div>

              <button
                type="button"
                onClick={handleRefreshVerification}
                disabled={isLoadingGesture || isLoadingCode || (timeLeft === 0 && refreshCountAfterExpiry >= 2) || (timeLeft !== 0 && refreshCountBeforeExpiry >= 3)}
                className={`inline-flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] font-bold py-1 px-2.5 rounded-lg transition-all ${
                  (timeLeft === 0 && refreshCountAfterExpiry >= 2) || (timeLeft !== 0 && refreshCountBeforeExpiry >= 3)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                    : "bg-[#f2f3ff] text-[#006948] hover:bg-[#006948]/10 cursor-pointer disabled:opacity-50"
                }`}
                title={
                  timeLeft === 0
                    ? `Post-expiry refreshes used: ${refreshCountAfterExpiry}/2`
                    : `Pre-expiry refreshes used: ${refreshCountBeforeExpiry}/3`
                }
              >
                <span className={`material-symbols-outlined text-[13px] ${isLoadingGesture || isLoadingCode ? "animate-spin" : ""}`}>
                  {(timeLeft === 0 && refreshCountAfterExpiry >= 2) || (timeLeft !== 0 && refreshCountBeforeExpiry >= 3) ? "lock" : "autorenew"}
                </span>
                <span>
                  {isLoadingGesture || isLoadingCode
                    ? "Refreshing..."
                    : timeLeft === 0
                    ? refreshCountAfterExpiry >= 2
                      ? "Limit (2/2)"
                      : `Refresh (${refreshCountAfterExpiry}/2)`
                    : refreshCountBeforeExpiry >= 3
                    ? "Locked (3/3)"
                    : `Refresh (${refreshCountBeforeExpiry}/3)`}
                </span>
              </button>
            </div>

            {/* Verification Mode Selector */}
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 p-1 bg-[#f2f3ff] rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectMode("hand")}
                  disabled={switchCount >= 4 && verificationMode !== "hand"}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-['Hanken_Grotesk'] font-bold transition-all ${verificationMode === "hand"
                    ? "bg-white text-[#006948] shadow-xs"
                    : switchCount >= 4
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : "text-[#3d4a42] hover:text-[#131b2e] cursor-pointer"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">back_hand</span>
                  <span>Hand Gesture</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode("code")}
                  disabled={switchCount >= 4 && verificationMode !== "code"}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-['Hanken_Grotesk'] font-bold transition-all ${verificationMode === "code"
                    ? "bg-white text-[#006948] shadow-xs"
                    : switchCount >= 4
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : "text-[#3d4a42] hover:text-[#131b2e] cursor-pointer"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">pin</span>
                  <span>4-Digit Code</span>
                </button>
              </div>

              {switchCount > 0 && (
                <div className="flex justify-between items-center px-1 text-[10px] font-['JetBrains_Mono'] text-[#535f70]">
                  <span>Mode Switches:</span>
                  <span className={switchCount >= 4 ? "text-[#ba1a1a] font-bold" : "text-[#006948]"}>
                    {switchCount}/4 {switchCount >= 4 ? "(Locked)" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Hand Gesture Content */}
            {verificationMode === "hand" ? (
              <div className="flex items-center gap-3.5 bg-[#f2f3ff] p-2.5 rounded-xl border border-[#dae2fd]/60">
                <div className="relative w-20 h-24 rounded-lg overflow-hidden shrink-0 border border-[#bccac0]/40 bg-[#eaedff] flex items-center justify-center">
                  {isLoadingGesture ? (
                    <div className="flex flex-col items-center justify-center gap-1 text-[#006948]">
                      <div className="w-5 h-5 border-2 border-[#006948] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[9px] font-['JetBrains_Mono'] font-bold">Loading</span>
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
                        e.currentTarget.src =
                          "https://res.cloudinary.com/pwtmlbit/image/upload/v1789486427/gestures_Hand_holding_three_fingers_up_20260915102611.png";
                      }}
                    />
                  )}
                  <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-[#85f8c4] font-['JetBrains_Mono'] text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                    MATCH GESTURE
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-0.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
                        Pose Verification Gesture
                      </span>
                      <span
                        className={`text-[11px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.5 rounded ${
                          timeLeft === 0
                            ? "bg-[#ffdad6] text-[#ba1a1a]"
                            : timeLeft !== null && timeLeft <= 30
                            ? "bg-[#ffdad6] text-[#ba1a1a] animate-pulse"
                            : "bg-[#85f8c4]/30 text-[#006948]"
                        }`}
                      >
                        ⏱ {formatTimeLeft(timeLeft)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#3d4a42] font-['Inter'] mt-1 leading-snug">
                      Hold your hand in the camera viewfinder showing this exact gesture above the cleaned area.
                    </p>
                  </div>

                  {timeLeft === 0 ? (
                    <button
                      type="button"
                      onClick={handleRefreshVerification}
                      disabled={refreshCountAfterExpiry >= 2}
                      className={`mt-1 text-[11px] font-['Hanken_Grotesk'] font-bold flex items-center gap-1 ${
                        refreshCountAfterExpiry >= 2
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-[#ba1a1a] hover:underline cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">refresh</span>
                      <span>
                        Gesture expired. {refreshCountAfterExpiry >= 2 ? "No refreshes left." : "Click to refresh token."}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] text-[#006948]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse"></span>
                      <span>
                        {gestureId ? `Token: ${gestureId.slice(-6)}` : "Live Verification Active"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 4-Digit Code Content */
              <div className="flex flex-col gap-2.5 bg-[#f2f3ff] p-3 rounded-xl border border-[#dae2fd]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
                    Handwritten 4-Digit Code
                  </span>
                  <span
                    className={`text-[11px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.5 rounded ${
                      timeLeft === 0
                        ? "bg-[#ffdad6] text-[#ba1a1a]"
                        : timeLeft !== null && timeLeft <= 30
                        ? "bg-[#ffdad6] text-[#ba1a1a] animate-pulse"
                        : "bg-[#85f8c4]/30 text-[#006948]"
                    }`}
                  >
                    ⏱ {formatTimeLeft(timeLeft)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isLoadingCode ? (
                      <div className="flex items-center gap-1 text-[#006948] py-1">
                        <div className="w-4 h-4 border-2 border-[#006948] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-['JetBrains_Mono'] font-bold">Generating code...</span>
                      </div>
                    ) : (
                      (codeText || "7K9P")
                        .split("")
                        .map((char, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-9 bg-white rounded-lg border border-[#bccac0]/50 shadow-xs flex items-center justify-center font-['JetBrains_Mono'] text-sm font-extrabold text-[#006948]"
                          >
                            {char}
                          </div>
                        ))
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#a33900]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a33900] animate-pulse"></span>
                    <span>
                      {codeId ? `ID: ${codeId.slice(-6)}` : "Code Verification"}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#3d4a42] font-['Inter'] leading-snug">
                  Write this code on paper and include it clearly in the after-cleanup viewfinder frame.
                </p>

                {timeLeft === 0 && (
                  <button
                    type="button"
                    onClick={handleRefreshVerification}
                    disabled={refreshCountAfterExpiry >= 2}
                    className={`text-[11px] font-['Hanken_Grotesk'] font-bold flex items-center gap-1 ${
                      refreshCountAfterExpiry >= 2
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[#ba1a1a] hover:underline cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    <span>
                      Code expired. {refreshCountAfterExpiry >= 2 ? "No refreshes left." : "Click to refresh code."}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Remediation & Cleanup Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] flex items-center justify-between">
              <span>Cleanup Notes &amp; Methods</span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#535f70] font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe cleanup efforts, tools used, waste bags collected, recycling dispatch..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#bccac0]/40 text-xs font-['Inter'] focus:outline-none focus:ring-2 focus:ring-[#006948] bg-white resize-none text-[#131b2e] placeholder-[#737f77]"
            />
          </div>

          {/* 4. Impact & Reward Badge */}
          <div className="bg-[#85f8c4]/20 rounded-xl p-3 border border-[#006948]/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#006948] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">eco</span>
            </div>
            <div className="text-xs">
              <span className="font-['Hanken_Grotesk'] font-bold text-[#005137] block">
                Civic Resolution Reward
              </span>
              <span className="text-[11px] font-['Inter'] text-[#3d4a42]">
                Earn <strong>+100 Civic XP</strong> and boost your municipal leaderboard rank upon completion.
              </span>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <footer className="sticky bottom-0 z-30 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#dae2fd] p-4 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl border border-[#bccac0] text-[#131b2e] font-['Hanken_Grotesk'] font-bold text-xs hover:bg-[#e2e7ff] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !imageFile || (timeLeft !== null && timeLeft <= 0)}
            className="flex-1 py-3 px-4 rounded-xl bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying Cleanup...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                <span>Mark as Completed</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
