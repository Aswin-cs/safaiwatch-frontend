"use client";

import React, { useState, useEffect, useRef } from "react";
import { spotsApi } from "@/lib/api";
import ContestSpotReportModal from "@/components/ContestSpotReportModal";

export interface CompleteWasteSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: any;
  onSuccess?: (updatedSpot: any) => void;
  onReportSpot?: (spot: any, reportData: { reason: string; details?: string }) => void;
  userRole?: string;
  userLocation?: [number, number] | null;
  currentUserId?: string;
}

export default function CompleteWasteSpotModal({
  isOpen,
  onClose,
  spot,
  onSuccess,
  onReportSpot,
  userRole = "Civilian",
  userLocation,
  currentUserId,
}: CompleteWasteSpotModalProps) {
  // Report Spot / Issue Modal State
  const [isReportIssueOpen, setIsReportIssueOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("fake_or_ai");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

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

  // GPS Coordinates Resolution State
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(
    userLocation && userLocation.length >= 2 ? { lat: userLocation[0], lng: userLocation[1] } : null
  );
  const [gpsStatus, setGpsStatus] = useState<"idle" | "acquiring" | "ready" | "failed">("idle");

  // Keep GPS coordinates synced or acquired whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (userLocation && userLocation.length >= 2 && !isNaN(userLocation[0]) && !isNaN(userLocation[1])) {
      setGpsCoords({ lat: userLocation[0], lng: userLocation[1] });
      setGpsStatus("ready");
    }

    if (typeof window !== "undefined" && navigator?.geolocation) {
      setGpsStatus((prev) => (prev === "ready" ? "ready" : "acquiring"));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus("ready");
        },
        (err) => {
          console.warn("CompleteWasteSpotModal GPS auto-fetch error:", err);
          if (!userLocation || userLocation.length < 2) {
            setGpsStatus("failed");
          }
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
      );
    }
  }, [isOpen, userLocation]);

  // Haversine distance calculator between two GPS points
  const calculateDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const toRad = (value: number) => (value * Math.PI) / 180;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper to extract coordinates from spot object
  const getSpotCoordinates = (spotObj: any): { lat: number; lng: number } | null => {
    if (!spotObj) return null;
    const loc = spotObj.location || spotObj.geolocation;
    if (loc && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
    }
    if (Array.isArray(spotObj.coordinates) && spotObj.coordinates.length >= 2) {
      return { lat: Number(spotObj.coordinates[1]), lng: Number(spotObj.coordinates[0]) };
    }
    if (spotObj.latitude !== undefined && spotObj.longitude !== undefined) {
      const lat = Number(spotObj.latitude);
      const lng = Number(spotObj.longitude);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (spotObj.lat !== undefined && spotObj.lng !== undefined) {
      const lat = Number(spotObj.lat);
      const lng = Number(spotObj.lng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  // Real-time distance and boundary status to the marked spot
  const spotCoords = getSpotCoordinates(spot);
  const distanceToSpot =
    gpsCoords && spotCoords
      ? calculateDistanceInMeters(gpsCoords.lat, gpsCoords.lng, spotCoords.lat, spotCoords.lng)
      : null;

  const distanceDisplay =
    distanceToSpot !== null
      ? distanceToSpot >= 1000
        ? `${(distanceToSpot / 1000).toFixed(2)} km`
        : `${distanceToSpot.toFixed(1)} m`
      : null;

  const isWithinBoundary = distanceToSpot !== null && distanceToSpot <= 5;
  const hasUserReported = Boolean(
    spot?.hasUserReported ||
    spot?.isReportedByRequestedUser ||
    (currentUserId && Array.isArray(spot?.isReportedBy) && spot.isReportedBy.some((entry: any) => {
      const rId = entry?.reportedBy?._id ? entry.reportedBy._id.toString() : (entry?.reportedBy ? entry.reportedBy.toString() : (typeof entry === "string" ? entry : ""));
      return rId && String(rId) === String(currentUserId);
    }))
  );

  // Cleanup Description
  const [description, setDescription] = useState<string>("");

  // After Photo State & Live Camera State
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
      const nextTorch = !isTorchOn;
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: nextTorch }],
          });
        } catch (constraintErr) {
          console.warn("Hardware torch constraint failed (device may use screen illumination):", constraintErr);
        }
      }
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn("Torch toggle error:", err);
      setIsTorchOn(!isTorchOn);
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
          const file = new File([blob], `cleanup_spot_capture_${Date.now()}.jpg`, {
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

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeletingVerification, setIsDeletingVerification] = useState<boolean>(false);
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
    stopCamera();
    setCameraError(null);
    setIsStartingCamera(false);
    isFetchingGestureRef.current = false;
    isFetchingCodeRef.current = false;
  };

  // Handle back button / cancellation - calls deleteOneTimeVerification endpoint
  const handleBack = async () => {
    const idToDelete = gestureId || codeId || targetSpotId;
    if (idToDelete) {
      try {
        setIsDeletingVerification(true);
        await spotsApi.deleteOneTimeVerification(idToDelete);
      } catch (err) {
        console.warn("Could not delete one-time verification on modal exit:", err);
      } finally {
        setIsDeletingVerification(false);
      }
    }
    resetFormState();
    onClose();
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

    // Reset verification tokens so switching modes requests a fresh token and updates the document
    if (newMode === "hand") {
      setGestureId(null);
      setGestureImageUrl(null);
      setGestureExpiresAt(null);
    } else {
      setCodeId(null);
      setCodeText(null);
      setCodeExpiresAt(null);
    }
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

      // Capture live GPS coordinates to satisfy backend 5m radius verification
      let resolvedLat: number | null = null;
      let resolvedLng: number | null = null;

      if (typeof window !== "undefined" && navigator?.geolocation) {
        // Attempt 1: High accuracy GPS
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 15000,
            });
          });
          resolvedLat = pos.coords.latitude;
          resolvedLng = pos.coords.longitude;
        } catch (err1) {
          console.warn("High accuracy GPS failed, trying standard accuracy fallback:", err1);
        }

        // Attempt 2: Standard accuracy network geolocation fallback
        if (resolvedLat === null) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000,
              });
            });
            resolvedLat = pos.coords.latitude;
            resolvedLng = pos.coords.longitude;
          } catch (err2) {
            console.warn("Standard accuracy geolocation failed:", err2);
          }
        }
      }

      // Attempt 3: Cached state or parent userLocation prop fallback
      if (resolvedLat === null && gpsCoords) {
        resolvedLat = gpsCoords.lat;
        resolvedLng = gpsCoords.lng;
      } else if (resolvedLat === null && userLocation && userLocation.length >= 2) {
        resolvedLat = userLocation[0];
        resolvedLng = userLocation[1];
      }

      // If coordinates still could not be determined, HALT and inform user
      if (resolvedLat === null || resolvedLng === null) {
        setGpsStatus("failed");
        setErrorMsg(
          "Current GPS location is required to verify physical proximity to the spot. Please enable location permissions in your browser and try again."
        );
        setIsSubmitting(false);
        return;
      }

      // Update state and append to FormData
      setGpsCoords({ lat: resolvedLat, lng: resolvedLng });
      setGpsStatus("ready");
      formData.append("latitude", String(resolvedLat));
      formData.append("longitude", String(resolvedLng));
      formData.append("coordinates", JSON.stringify([resolvedLng, resolvedLat]));
      formData.append("userLocation", JSON.stringify([resolvedLng, resolvedLat]));

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
        const rawMsg = res?.message || "";
        if (rawMsg.includes("Location verification failed") || rawMsg.includes("away from the marked spot")) {
          setErrorMsg(`Out of Boundary: ${rawMsg}`);
        } else if (rawMsg.includes("location") || rawMsg.includes("proximity")) {
          setErrorMsg(`Location Error: ${rawMsg}`);
        } else {
          setErrorMsg(rawMsg || "Failed to complete spot cleanup. Please check your inputs.");
        }
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error submitting spot completion:", err);
      const rawMsg = err?.message || "";
      if (rawMsg.includes("Location verification failed") || rawMsg.includes("away from the marked spot")) {
        setErrorMsg(`Out of Boundary: ${rawMsg}`);
      } else {
        setErrorMsg(rawMsg || "Network error while completing spot.");
      }
      setIsSubmitting(false);
    }
  };

  // Submit Report / Dispute for this spot (e.g. fake, inaccessible, already clean)
  const handleReportSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reportReason) {
      setReportError("Please select a reason for reporting this spot.");
      return;
    }

    try {
      setIsSubmittingReport(true);
      setReportError(null);

      const reasonLabels: Record<string, string> = {
        fake_or_ai: "Fake / AI-Generated Spot",
        already_clean: "Already Clean / No Waste Found",
        inaccessible: "Inaccessible / Hazardous Area",
        wrong_location: "Incorrect Location / Wrong Coordinates",
        other: "Other Policy Violation / Spam",
      };

      const selectedReasonLabel = reasonLabels[reportReason] || reportReason;

      if (onReportSpot) {
        onReportSpot(spot, {
          reason: selectedReasonLabel,
          details: reportDetails.trim(),
        });
      }

      setReportSuccess("Report submitted successfully. Our municipal moderators and AI audit team have been notified.");
      setTimeout(() => {
        setIsSubmittingReport(false);
        setIsReportIssueOpen(false);
        setReportSuccess(null);
        setReportDetails("");
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error reporting spot issue:", err);
      setReportError(err?.message || "Failed to submit spot report. Please try again.");
      setIsSubmittingReport(false);
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
            aria-label="Back and cancel verification"
            onClick={handleBack}
            disabled={isDeletingVerification || isSubmitting}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-[#3d4a42] hover:text-[#131b2e] hover:bg-[#e2e7ff] transition-colors cursor-pointer disabled:opacity-50"
            title="Cancel and discard verification"
          >
            {isDeletingVerification ? (
              <div className="w-5 h-5 border-2 border-[#006948] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            )}
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

          {/* Out of Boundary Live Warning Banner */}
          {distanceToSpot !== null && !isWithinBoundary && !errorMsg && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl text-xs flex items-start gap-2.5 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">near_me</span>
              <div>
                <p className="font-bold text-amber-950">You are outside the marked spot boundary ({distanceDisplay} away)</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  You must be physically within <strong>5 meters</strong> of the spot coordinates to submit completion proof.
                </p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#85f8c4]/40 text-[#005137] p-3 rounded-2xl border border-[#006948]/30 text-xs flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* User has already reported this spot notice */}
          {hasUserReported && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-2xl text-xs flex items-center gap-2.5 font-medium shadow-2xs">
              <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0">report</span>
              <div>
                <p className="font-bold text-rose-950">Dispute Filed By You</p>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  You have already submitted a report/contest on this spot. You cannot complete or re-report it.
                </p>
              </div>
            </div>
          )}

          {/* Spot Before Reference Card */}
          {spot.image && (
            <div className="bg-[#f2f3ff] rounded-2xl p-3 border border-[#dae2fd]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 flex-1 min-w-0">
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-[#006948]/10 text-[#006948] text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded-md">
                      {spot.category || spot.wasteCategory || "Waste Spot"}
                    </span>
                    <span className="text-[10px] text-[#535f70] font-['JetBrains_Mono']">
                      ID: {(spot._id || spot.id || "").slice(-6)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <h4 className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] truncate">
                      {spot.title || spot.address || "Reported Location"}
                    </h4>
                    {/* Boundary & Proximity Status Chip */}
                    {isWithinBoundary && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-[11px]">verified</span>
                        <span>In Boundary ({distanceDisplay})</span>
                      </span>
                    )}
                    {distanceToSpot !== null && !isWithinBoundary && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300" title={`You are ${distanceDisplay} away. Must be within 5m.`}>
                        <span className="material-symbols-outlined text-[11px]">near_me</span>
                        <span>Outside Boundary ({distanceDisplay} away)</span>
                      </span>
                    )}
                    {distanceToSpot === null && gpsStatus === "ready" && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-[11px]">my_location</span>
                        <span>GPS Ready</span>
                      </span>
                    )}
                    {distanceToSpot === null && gpsStatus === "acquiring" && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <span className="material-symbols-outlined text-[11px] animate-spin">sync</span>
                        <span>Acquiring GPS...</span>
                      </span>
                    )}
                    {distanceToSpot === null && gpsStatus === "failed" && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200" title="Click to grant location permission in your browser">
                        <span className="material-symbols-outlined text-[11px]">location_disabled</span>
                        <span>GPS Needed</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#3d4a42] line-clamp-1 mt-0.5">
                    {spot.description || "Reported waste area awaiting cleanup resolution"}
                  </p>
                </div>
              </div>

              {/* Quick Report Button on Spot Card */}
              <button
                type="button"
                onClick={() => setIsReportIssueOpen(true)}
                disabled={hasUserReported}
                className={`self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-['Hanken_Grotesk'] font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 ${
                  hasUserReported
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                    : "bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] border-rose-200/90 cursor-pointer"
                }`}
                title={hasUserReported ? "You have already reported this spot" : "Report this spot as fake, inaccessible, or already clean"}
              >
                <span className="material-symbols-outlined text-[14px]">flag</span>
                <span>{hasUserReported ? "Already Reported" : "Report Issue"}</span>
              </button>
            </div>
          )}

          {/* 1. Live Camera / Photo Capture Viewfinder (After Photo) */}
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

              {/* Torch / Flash Illumination Fill Effect */}
              {isCameraActive && isTorchOn && (
                <div className="absolute inset-0 bg-amber-200/10 pointer-events-none z-10" />
              )}

              {/* State A: Photo Captured Preview */}
              {!isCameraActive && imagePreview && (
                <img
                  src={imagePreview}
                  alt="Remediated spot cleanup preview"
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
                      Capture Cleanup Photo
                    </h3>
                    <p className="text-xs text-[#535f70] font-['Inter'] mt-0.5">
                      Take a real-time photo of the cleaned area using your camera
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => startCamera("environment")}
                      disabled={isStartingCamera}
                      className="px-5 py-2.5 rounded-xl bg-[#006948] hover:bg-[#00855d] active:scale-95 text-white font-['Hanken_Grotesk'] text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                      <span>{isStartingCamera ? "Opening..." : "Open Camera"}</span>
                    </button>
                  </div>

                  {cameraError && (
                    <p className="text-xs text-rose-600 font-medium mt-1">{cameraError}</p>
                  )}
                </div>
              )}

              {/* Active Camera Overlay Controls */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 bg-gradient-to-b from-black/40 via-transparent to-black/50 z-20">
                  {/* Top Bar: Live indicator, Flashlight, Aspect Ratio & Flip Camera */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <span className="bg-black/50 backdrop-blur-sm text-white font-['Inter'] text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live View</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Flashlight / Torch Toggle */}
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer active:scale-90 border border-white/10 ${
                          isTorchOn
                            ? "bg-amber-400 text-slate-900 shadow-md shadow-amber-400/40"
                            : "bg-black/50 hover:bg-black/70 text-white"
                        }`}
                        title={isTorchOn ? "Flashlight ON (Click to turn off)" : "Flashlight OFF (Click to turn on)"}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isTorchOn ? "flashlight_on" : "flashlight_off"}
                        </span>
                      </button>

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
        <footer className="sticky bottom-0 z-30 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#dae2fd] p-4 flex gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting || isDeletingVerification}
            className="py-3 px-4 rounded-xl border border-[#bccac0] text-[#131b2e] font-['Hanken_Grotesk'] font-bold text-xs hover:bg-[#e2e7ff] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[75px]"
          >
            {isDeletingVerification ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#131b2e] border-t-transparent rounded-full animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              "Cancel"
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsReportIssueOpen(true)}
            disabled={isSubmitting || hasUserReported}
            className={`py-3 px-3.5 rounded-xl border font-['Hanken_Grotesk'] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 ${
              hasUserReported
                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                : "border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] cursor-pointer disabled:opacity-50"
            }`}
            title={hasUserReported ? "You have already reported this spot" : "Report this spot as fake, inaccessible, or already clean"}
          >
            <span className="material-symbols-outlined text-[16px]">flag</span>
            <span>{hasUserReported ? "Already Reported" : "Report Spot"}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !imageFile || (timeLeft !== null && timeLeft <= 0) || hasUserReported}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-['Hanken_Grotesk'] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
              hasUserReported
                ? "bg-slate-400 cursor-not-allowed opacity-60"
                : "bg-[#006948] hover:bg-[#00855d] cursor-pointer active:scale-98 disabled:opacity-50"
            }`}
            title={hasUserReported ? "You reported this spot and cannot mark it as completed" : "Mark as Completed"}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying Cleanup...</span>
              </>
            ) : hasUserReported ? (
              <>
                <span className="material-symbols-outlined text-[16px]">block</span>
                <span>Cannot Complete (Reported)</span>
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

      {/* 5. CONTEST / REPORT SPOT MODAL (GOOGLE STITCH SPECIFICATION) */}
      <ContestSpotReportModal
        isOpen={isReportIssueOpen}
        onClose={() => setIsReportIssueOpen(false)}
        spot={spot}
        currentUserId={currentUserId}
        userRole={userRole}
        sharedVerification={{
          verificationMode,
          gestureImageUrl,
          gestureId,
          gestureExpiresAt,
          codeText,
          codeId,
          codeExpiresAt,
          switchCount,
          refreshCountBeforeExpiry,
          refreshCountAfterExpiry,
          isLoadingGesture,
          isLoadingCode,
          onSelectMode: handleSelectMode,
          onRefreshVerification: handleRefreshVerification,
        }}
        onSubmitReport={(reportedSpot, reportData) => {
          setIsReportIssueOpen(false);
          if (onReportSpot) {
            onReportSpot(reportedSpot, {
              reason: reportData.reasonTitle || reportData.reason,
              details: reportData.details,
            });
          }
          setSuccessMsg("Dispute registered! Dossier dispatched to AI Vision Auditor.");
          setTimeout(() => {
            onClose();
          }, 1200);
        }}
      />
    </div>
  );
}
