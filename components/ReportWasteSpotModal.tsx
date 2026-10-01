"use client";

import React, { useState, useEffect, useRef } from "react";
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

  // Switch Lock State (max 4 mode switches allowed per modal session)
  const [switchCount, setSwitchCount] = useState<number>(0);

  // Refresh Quota State: max 3 refreshes before timer expiry, max 2 refreshes after timer expiry
  const [refreshCountBeforeExpiry, setRefreshCountBeforeExpiry] = useState<number>(0);
  const [refreshCountAfterExpiry, setRefreshCountAfterExpiry] = useState<number>(0);

  // Telemetry / Location State
  const [coords, setCoords] = useState<[number, number]>(
    droppedCoordinates ? [droppedCoordinates[0], droppedCoordinates[1]] : [11.7284, 76.2841]
  );
  const [isRecalibrating, setIsRecalibrating] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");

  const isFetchingGestureRef = useRef<boolean>(false);
  const isFetchingCodeRef = useRef<boolean>(false);
  const coordsRef = useRef<[number, number]>(coords);
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // Category & Severity State
  const [wasteCategory, setWasteCategory] = useState<string>("Plastics & Wraps");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "very_high">("medium");

  // File Upload & Live Camera State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraRatio, setCameraRatio] = useState<"4:3" | "9:16">("9:16");
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop live camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setIsTorchSupported(false);
    setIsTorchOn(false);
  };

  // Connect stream to video element whenever camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.play().catch((err) => console.warn("Video play error:", err));
    }
  }, [isCameraActive]);

  // Start live camera stream
  const startCamera = async (facing: "environment" | "user" = cameraFacing) => {
    try {
      setCameraError(null);
      setIsStartingCamera(true);
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported in this browser environment.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing ? { ideal: facing } : undefined,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });
      } catch (err) {
        // Fallback to generic video if complex constraints fail
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      // Check flashlight / torch capability on the current video track
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities ? (track.getCapabilities() as any) : null;
      if (capabilities && "torch" in capabilities) {
        setIsTorchSupported(true);
      } else {
        setIsTorchSupported(false);
      }
      setIsTorchOn(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Direct video play error:", playErr);
        }
      }
      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch (err: any) {
      console.warn("Live camera start failed:", err);
      setIsStartingCamera(false);
      setIsCameraActive(false);
      setCameraError(err?.message || "Could not access live camera. Please allow camera permissions or use fallback.");
    }
  };

  // Toggle front/rear camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn("Torch toggle error:", err);
    }
  };

  // Capture photo snapshot from live video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Trigger visual shutter flash and haptic vibration if supported
    setShutterFlash(true);
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {}
    }
    setTimeout(() => setShutterFlash(false), 200);

    const video = videoRef.current;
    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;
    const canvas = canvasRef.current || document.createElement("canvas");

    if (cameraRatio === "9:16") {
      let srcW = vWidth;
      let srcH = vHeight;
      let srcX = 0;
      let srcY = 0;

      if (vWidth / vHeight > 9 / 16) {
        srcW = Math.round(vHeight * (9 / 16));
        srcX = Math.round((vWidth - srcW) / 2);
      } else {
        srcH = Math.round(vWidth * (16 / 9));
        srcY = Math.round((vHeight - srcH) / 2);
      }

      canvas.width = srcW;
      canvas.height = srcH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (cameraFacing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
    } else {
      canvas.width = vWidth;
      canvas.height = vHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (cameraFacing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `waste_report_capture_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setImageFile(file);
          const previewUrl = URL.createObjectURL(blob);
          setImagePreview(previewUrl);
          stopCamera();
          setErrorMsg(null);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // Auto-stop camera on modal close and unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formatter for MM:SS timer display
  const formatTimeLeft = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Mode Switch Handler with 4-switch lock rule
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

  // Helper function to reset all form fields and states
  const resetFormState = () => {
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setWasteCategory("Plastics & Wraps");
    setSeverity("medium");
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
    stopCamera();
    setCameraError(null);
    setIsStartingCamera(false);
    isFetchingGestureRef.current = false;
    isFetchingCodeRef.current = false;
  };

  // Manual refresh handler for verification gesture/code with pre-expiry (3) and post-expiry (2) limits
  const handleRefreshVerification = () => {
    if (timeLeft === 0) {
      if (refreshCountAfterExpiry >= 2) {
        setErrorMsg("Maximum post-expiry refreshes reached (2/2). Please reopen the modal to restart verification.");
        return;
      }
      setRefreshCountAfterExpiry((prev) => prev + 1);
    } else {
      if (refreshCountBeforeExpiry >= 3) {
        setErrorMsg("Maximum pre-expiry refreshes reached (3/3). Please wait for timer to expire or submit report.");
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

  // Synchronize droppedCoordinates or fetch current live GPS spot location when opened
  useEffect(() => {
    if (!isOpen) {
      resetFormState();
      return;
    }

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

  // Fetch random gesture verification photo and ID when modal is open and mode is "hand" (3 mins = 180s)
  useEffect(() => {
    if (!isOpen || verificationMode !== "hand") return;
    if (gestureId || isFetchingGestureRef.current) return;

    isFetchingGestureRef.current = true;
    let isMounted = true;
    const fetchGesture = async () => {
      setIsLoadingGesture(true);
      try {
        const currentCoords = coordsRef.current;
        const geoCoords: [number, number] = [currentCoords[1], currentCoords[0]];
        const res = await spotsApi.getRandomGestureVerification({ coordinates: geoCoords });
        if (isMounted && res && res.success) {
          const imgUrl = (res as any).imageUrl || (res as any).data?.imageUrl;
          const imgId = (res as any).imageId || (res as any).data?.imageId;
          if (imgUrl) setGestureImageUrl(imgUrl);
          if (imgId) setGestureId(imgId);
          setGestureExpiresAt(Date.now() + 180 * 1000); // 3 minutes for loaded gesture image
        }
      } catch (err) {
        console.error("Failed to fetch gesture verification photo:", err);
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
  }, [isOpen, verificationMode, gestureId, refreshTrigger]);

  // Fetch random code verification and ID when modal is open and mode is "code" (5 mins = 300s)
  useEffect(() => {
    if (!isOpen || verificationMode !== "code") return;
    if (codeId || isFetchingCodeRef.current) return;

    isFetchingCodeRef.current = true;
    let isMounted = true;
    const fetchCode = async () => {
      setIsLoadingCode(true);
      try {
        const currentCoords = coordsRef.current;
        const geoCoords: [number, number] = [currentCoords[1], currentCoords[0]];
        const res = await spotsApi.getRandomCodeVerification({ coordinates: geoCoords });
        if (isMounted && res && res.success) {
          const cVal = (res as any).code || (res as any).data?.code;
          const cId = (res as any).verificationId || (res as any).data?.verificationId;
          if (cVal) setCodeText(cVal);
          if (cId) setCodeId(cId);
          setCodeExpiresAt(Date.now() + 300 * 1000); // 5 minutes for loaded verification code
        }
      } catch (err) {
        console.error("Failed to fetch code verification:", err);
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
  }, [isOpen, verificationMode, codeId, refreshTrigger]);

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

    const activeVerificationId = verificationMode === "hand" ? gestureId : (codeId || gestureId);

    if (!imageFile) {
      setErrorMsg("Please upload a photo of the waste spot to verify optical presence.");
      return;
    }

    if (!activeVerificationId) {
      setErrorMsg("Valid verification ID is required. Please wait for liveness verification to load.");
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

      const activeVerificationId = verificationMode === "hand" ? gestureId : (codeId || gestureId);
      if (activeVerificationId) {
        formData.append("verificationId", activeVerificationId);
        formData.append("gestureVerificationId", activeVerificationId);
        formData.append("gestureImageId", activeVerificationId);
        formData.append("gestureId", activeVerificationId);
        formData.append("codeId", activeVerificationId);
        formData.append("type", verificationMode === "hand" ? "gesture" : "code");
      }

      const res = await spotsApi.createSpot(formData);

      if (res && res.success) {
        setSuccessMsg("Spot verified and uploaded successfully! +50 XP Earned.");
        if (onSuccess) {
          onSuccess(res.spot);
        }
        setTimeout(() => {
          setIsSubmitting(false);
          resetFormState();
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

          {/* 1. Live Camera / Photo Capture Viewfinder */}
          <div className="flex flex-col gap-2">
            <div
              className={`relative w-full ${
                cameraRatio === "9:16" && (isCameraActive || imagePreview)
                  ? "aspect-[9/16] max-h-[68vh]"
                  : "aspect-[4/3]"
              } rounded-2xl overflow-hidden bg-slate-900 shadow-sm flex items-center justify-center border border-slate-200 transition-all duration-300`}
            >
              <canvas ref={canvasRef} className="hidden" />

              {/* Permanent Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
              />

              {/* Shutter White Flash Effect */}
              {shutterFlash && (
                <div className="absolute inset-0 bg-white pointer-events-none z-30 transition-opacity duration-150" />
              )}

              {/* State A: Photo Captured Preview */}
              {!isCameraActive && imagePreview && (
                <img
                  src={imagePreview}
                  alt="Waste spot preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* State B: Idle Viewfinder (Simple Light Call-to-Action) */}
              {!isCameraActive && !imagePreview && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[#131b2e] gap-3 bg-[#f2f3ff] w-full h-full">
                  <div className="w-14 h-14 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
                      Capture Waste Spot Photo
                    </h3>
                    <p className="text-xs text-[#535f70] font-['Inter'] mt-0.5">
                      Take a real-time photo or upload from your device
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => startCamera("environment")}
                      disabled={isStartingCamera}
                      className="px-5 py-2.5 rounded-xl bg-[#006948] hover:bg-[#00855d] active:scale-95 text-white font-['Hanken_Grotesk'] text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                      <span>{isStartingCamera ? "Opening..." : "Open Camera"}</span>
                    </button>

                    <label className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#3d4a42] font-['Hanken_Grotesk'] text-xs font-semibold border border-[#dae2fd] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {cameraError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{cameraError}</p>
                  )}
                </div>
              )}

              {/* Active Camera Overlay Controls */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 bg-gradient-to-b from-black/40 via-transparent to-black/50 z-20">
                  {/* Top Bar: Live indicator, Aspect Ratio & Flip Camera */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <span className="bg-black/50 backdrop-blur-sm text-white font-['Inter'] text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live View</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Torch / Flashlight Toggle (if supported by device) */}
                      {isTorchSupported && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer active:scale-90 border border-white/10 ${
                            isTorchOn
                              ? "bg-amber-400 text-slate-900 shadow-md shadow-amber-400/40"
                              : "bg-black/50 hover:bg-black/70 text-white"
                          }`}
                          title={isTorchOn ? "Turn Flash Off" : "Turn Flash On"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isTorchOn ? "flashlight_on" : "flashlight_off"}
                          </span>
                        </button>
                      )}

                      {/* Aspect Ratio Toggle (9:16 / 4:3) */}
                      <button
                        type="button"
                        onClick={() => setCameraRatio((prev) => (prev === "9:16" ? "4:3" : "9:16"))}
                        className="px-2.5 py-1 rounded-full bg-black/50 hover:bg-black/70 text-white text-[11px] font-['JetBrains_Mono'] font-bold backdrop-blur-sm transition-all cursor-pointer active:scale-90 flex items-center gap-1 border border-white/10"
                        title="Toggle Aspect Ratio"
                      >
                        <span className="material-symbols-outlined text-[14px]">aspect_ratio</span>
                        <span>{cameraRatio}</span>
                      </button>

                      {/* Flip Camera Button */}
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer active:scale-90 border border-white/10"
                        title="Switch Camera"
                      >
                        <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Bar: Cancel and Simple Shutter */}
                  <div className="flex items-center justify-between pointer-events-auto px-2 pb-1">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-['Inter'] font-medium backdrop-blur-sm transition-all cursor-pointer"
                    >
                      Cancel
                    </button>

                    {/* Clean Native Shutter Button */}
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-14 h-14 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 active:scale-90 p-1 flex items-center justify-center transition-all cursor-pointer shadow-lg"
                      title="Capture Photo"
                    >
                      <div className="w-full h-full rounded-full bg-white transition-transform active:scale-95"></div>
                    </button>

                    <div className="w-14"></div>
                  </div>
                </div>
              )}

              {/* Photo Captured Controls Overlay */}
              {!isCameraActive && imagePreview && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20">
                  <div className="flex items-center justify-between pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        startCamera("environment");
                      }}
                      className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-[#006948] px-3.5 py-2 rounded-xl text-xs font-['Hanken_Grotesk'] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">replay</span>
                      <span>Retake</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        stopCamera();
                      }}
                      className="bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-['Hanken_Grotesk'] font-bold px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                    ? "Limit (3/3)"
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
                  <span className="material-symbols-outlined text-[16px]">front_hand</span>
                  <span>Hand Gesture (3 min)</span>
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
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                  <span>Code Word (5 min)</span>
                </button>
              </div>

              {switchCount > 0 && (
                <div className="flex items-center justify-between px-1 text-[10px] font-['JetBrains_Mono'] text-[#3d4a42]">
                  <span>Mode switches: {switchCount}/4</span>
                  {switchCount >= 4 && (
                    <span className="text-[#ba1a1a] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">lock</span>
                      Mode selection locked (4/4 limit)
                    </span>
                  )}
                </div>
              )}
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
                  
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] text-[#006948] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006948] animate-pulse"></span>
                      <span>
                        {gestureId ? `ID: ${gestureId.slice(-6)}` : "Optical Anti-Spoofing"}
                      </span>
                    </div>

                    {timeLeft !== null && (
                      <div className={`inline-flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded ${timeLeft === 0 ? "bg-[#ffdad6] text-[#93000a] animate-bounce" : "bg-[#006948]/15 text-[#006948]"}`}>
                        <span className="material-symbols-outlined text-[13px]">{timeLeft === 0 ? "error" : "timer"}</span>
                        <span>{timeLeft === 0 ? "Expired (00:00)" : `${formatTimeLeft(timeLeft)} remaining`}</span>
                      </div>
                    )}
                  </div>

                  {timeLeft === 0 && (
                    <button
                      type="button"
                      onClick={handleRefreshVerification}
                      disabled={refreshCountAfterExpiry >= 2}
                      className={`mt-1 text-[11px] font-['Hanken_Grotesk'] font-bold flex items-center gap-1 ${
                        refreshCountAfterExpiry >= 2 ? "text-gray-400 cursor-not-allowed" : "text-[#ba1a1a] hover:underline cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{refreshCountAfterExpiry >= 2 ? "lock" : "refresh"}</span>
                      <span>
                        {refreshCountAfterExpiry >= 2
                          ? "Post-expiry refresh limit reached (2/2). Reopen modal to restart."
                          : `Token expired. Click to refresh gesture (${refreshCountAfterExpiry}/2 used).`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Code Word Content */
              <div className="flex items-center gap-3.5 bg-[#f2f3ff] p-2.5 rounded-xl border border-[#dae2fd]/60">
                <div className="w-20 h-24 rounded-lg border border-[#bccac0]/40 bg-[#dae2fd] flex flex-col items-center justify-center p-2 text-center shrink-0">
                  {isLoadingCode ? (
                    <div className="flex flex-col items-center justify-center p-2 text-[#a33900]">
                      <span className="material-symbols-outlined text-2xl animate-spin">
                        progress_activity
                      </span>
                      <span className="text-[9px] font-['JetBrains_Mono'] font-bold mt-1">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[#a33900] text-2xl">edit_note</span>
                      <span className="font-['JetBrains_Mono'] font-bold text-xs text-[#131b2e] tracking-wider mt-1 bg-white px-1.5 py-0.5 rounded border border-[#bccac0]/40">
                        {codeText ? `'${codeText}'` : "'CODE'"}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] mb-0.5">
                    <span>Write Daily Code {codeText ? `'${codeText}'` : ""}</span>
                    <span className="text-xs">📝</span>
                  </div>
                  <p className="text-[11px] font-['Inter'] text-[#3d4a42] leading-tight mb-2">
                    Write the word <strong>{codeText || "CODE"}</strong> on paper, cardboard or chalk-slate and place visibly beside the waste pile.
                  </p>

                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] text-[#a33900] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a33900] animate-pulse"></span>
                      <span>
                        {codeId ? `ID: ${codeId.slice(-6)}` : "Code Verification"}
                      </span>
                    </div>

                    {timeLeft !== null && (
                      <div className={`inline-flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded ${timeLeft === 0 ? "bg-[#ffdad6] text-[#93000a] animate-bounce" : "bg-[#a33900]/15 text-[#a33900]"}`}>
                        <span className="material-symbols-outlined text-[13px]">{timeLeft === 0 ? "error" : "timer"}</span>
                        <span>{timeLeft === 0 ? "Expired (00:00)" : `${formatTimeLeft(timeLeft)} remaining`}</span>
                      </div>
                    )}
                  </div>

                  {timeLeft === 0 && (
                    <button
                      type="button"
                      onClick={handleRefreshVerification}
                      disabled={refreshCountAfterExpiry >= 2}
                      className={`mt-1 text-[11px] font-['Hanken_Grotesk'] font-bold flex items-center gap-1 ${
                        refreshCountAfterExpiry >= 2 ? "text-gray-400 cursor-not-allowed" : "text-[#ba1a1a] hover:underline cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{refreshCountAfterExpiry >= 2 ? "lock" : "refresh"}</span>
                      <span>
                        {refreshCountAfterExpiry >= 2
                          ? "Post-expiry refresh limit reached (2/2). Reopen modal to restart."
                          : `Token expired. Click to refresh code (${refreshCountAfterExpiry}/2 used).`}
                      </span>
                    </button>
                  )}
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
