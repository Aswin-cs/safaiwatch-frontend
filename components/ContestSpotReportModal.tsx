"use client";

import React, { useState, useEffect, useRef } from "react";
import { spotsApi } from "@/lib/api";

export interface SharedVerificationState {
  verificationMode: "hand" | "code";
  gestureImageUrl: string | null;
  gestureId: string | null;
  gestureExpiresAt: number | null;
  codeText: string | null;
  codeId: string | null;
  codeExpiresAt: number | null;
  switchCount: number;
  refreshCountBeforeExpiry: number;
  refreshCountAfterExpiry: number;
  isLoadingGesture?: boolean;
  isLoadingCode?: boolean;
  onSelectMode: (mode: "hand" | "code") => void;
  onRefreshVerification: () => void;
}

export interface ContestSpotReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: any;
  onSubmitReport?: (
    spot: any,
    reportData: {
      reason: string;
      reasonTitle: string;
      details: string;
      counterPhoto?: File | null;
      counterPhotoPreview?: string | null;
      verificationMode?: "hand" | "code";
      verificationId?: string | null;
    }
  ) => void;
  userRole?: string;
  sharedVerification?: SharedVerificationState;
  currentUserId?: string;
}

export default function ContestSpotReportModal({
  isOpen,
  onClose,
  spot,
  onSubmitReport,
  userRole = "Civilian",
  sharedVerification,
  currentUserId,
}: ContestSpotReportModalProps) {
  const isCompleteReport = Boolean(spot?.isCompleted);
  const targetReportList = isCompleteReport ? (spot?.isReportedOnComplete || spot?.isReportedBy) : spot?.isReportedBy;
  const hasUserReported = Boolean(
    spot?.hasUserReported ||
    spot?.isReportedByRequestedUser ||
    (currentUserId && Array.isArray(targetReportList) && targetReportList.some((entry: any) => {
      const rId = entry?.reportedBy?._id ? entry.reportedBy._id.toString() : (entry?.reportedBy ? entry.reportedBy.toString() : (typeof entry === "string" ? entry : ""));
      return rId && String(rId) === String(currentUserId);
    }))
  );

  // 1. Objection Reason State
  const [selectedReason, setSelectedReason] = useState<string>("fake_or_ai");

  // 2. Detailed Explanation
  const [explanation, setExplanation] = useState<string>("");

  // 3. Verification Mode Tab State ("hand" gesture or "code")
  const [localVerificationMode, setLocalVerificationMode] = useState<"hand" | "code">("hand");

  // Gesture Verification State
  const [localGestureImageUrl, setLocalGestureImageUrl] = useState<string | null>(null);
  const [localGestureId, setLocalGestureId] = useState<string | null>(null);
  const [localIsLoadingGesture, setLocalIsLoadingGesture] = useState<boolean>(false);

  // Code Verification State
  const [localCodeText, setLocalCodeText] = useState<string | null>(null);
  const [localCodeId, setLocalCodeId] = useState<string | null>(null);
  const [localIsLoadingCode, setLocalIsLoadingCode] = useState<boolean>(false);

  // Verification Countdown Expiry State
  const [localGestureExpiresAt, setLocalGestureExpiresAt] = useState<number | null>(null);
  const [localCodeExpiresAt, setLocalCodeExpiresAt] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Mode Switch Lock State (max 4 switches per session)
  const [localSwitchCount, setLocalSwitchCount] = useState<number>(0);

  // Refresh Quotas
  const [localRefreshCountBeforeExpiry, setLocalRefreshCountBeforeExpiry] = useState<number>(0);
  const [localRefreshCountAfterExpiry, setLocalRefreshCountAfterExpiry] = useState<number>(0);

  // Unified / Shared state resolution
  const verificationMode = sharedVerification ? sharedVerification.verificationMode : localVerificationMode;
  const gestureImageUrl = sharedVerification ? sharedVerification.gestureImageUrl : localGestureImageUrl;
  const gestureId = sharedVerification ? sharedVerification.gestureId : localGestureId;
  const gestureExpiresAt = sharedVerification ? sharedVerification.gestureExpiresAt : localGestureExpiresAt;
  const codeText = sharedVerification ? sharedVerification.codeText : localCodeText;
  const codeId = sharedVerification ? sharedVerification.codeId : localCodeId;
  const codeExpiresAt = sharedVerification ? sharedVerification.codeExpiresAt : localCodeExpiresAt;
  const switchCount = sharedVerification ? sharedVerification.switchCount : localSwitchCount;
  const refreshCountBeforeExpiry = sharedVerification ? sharedVerification.refreshCountBeforeExpiry : localRefreshCountBeforeExpiry;
  const refreshCountAfterExpiry = sharedVerification ? sharedVerification.refreshCountAfterExpiry : localRefreshCountAfterExpiry;
  const isLoadingGesture = sharedVerification ? (sharedVerification.isLoadingGesture ?? false) : localIsLoadingGesture;
  const isLoadingCode = sharedVerification ? (sharedVerification.isLoadingCode ?? false) : localIsLoadingCode;

  // Active time left in seconds
  const activeExpiresAt = verificationMode === "hand" ? gestureExpiresAt : codeExpiresAt;
  const timeLeft = activeExpiresAt !== null ? Math.max(0, Math.ceil((activeExpiresAt - currentTime) / 1000)) : null;

  // 4. Live Camera & Counter-Proof Photo State
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

  // Form submitting & notifications
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    setSelectedReason(spot?.isCompleted ? "fake_photo" : "fake_or_ai");
    setExplanation("");
    setImageFile(null);
    setImagePreview(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLocalGestureImageUrl(null);
    setLocalGestureId(null);
    setLocalCodeText(null);
    setLocalCodeId(null);
    setLocalGestureExpiresAt(null);
    setLocalCodeExpiresAt(null);
    setLocalVerificationMode("hand");
    setRefreshTrigger(0);
    setLocalSwitchCount(0);
    setLocalRefreshCountBeforeExpiry(0);
    setLocalRefreshCountAfterExpiry(0);
    stopCamera();
    setCameraError(null);
    setIsStartingCamera(false);
    isFetchingGestureRef.current = false;
    isFetchingCodeRef.current = false;
  };

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
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

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
      setCameraError(err?.message || "Could not access live camera. Please allow camera permissions.");
    }
  };

  // Connect stream when camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video.play().catch((err) => console.warn("Video play error:", err));
    }
  }, [isCameraActive]);

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
          console.warn("Hardware torch constraint failed:", constraintErr);
        }
      }
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn("Torch toggle error:", err);
      setIsTorchOn(!isTorchOn);
    }
  };

  // Capture photo snapshot
  const capturePhoto = () => {
    if (!videoRef.current) return;

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
          const file = new File([blob], `counter_proof_capture_${Date.now()}.jpg`, {
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

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    }
  }, [isOpen]);

  // Countdown Timer Effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Mode switch handler
  const handleSelectMode = (newMode: "hand" | "code") => {
    if (sharedVerification) {
      sharedVerification.onSelectMode(newMode);
      return;
    }
    if (newMode === localVerificationMode) return;
    if (localSwitchCount >= 4) {
      setErrorMsg("Maximum verification mode switches reached (4/4). Mode selection is locked.");
      return;
    }
    setLocalSwitchCount((prev) => prev + 1);
    setLocalVerificationMode(newMode);
    setCurrentTime(Date.now());
    setErrorMsg(null);

    // Reset verification tokens so switching modes requests a fresh token and updates the document
    if (newMode === "hand") {
      setLocalGestureId(null);
      setLocalGestureImageUrl(null);
      setLocalGestureExpiresAt(null);
    } else {
      setLocalCodeId(null);
      setLocalCodeText(null);
      setLocalCodeExpiresAt(null);
    }
  };

  // Refresh handler
  const handleRefreshVerification = () => {
    if (sharedVerification) {
      sharedVerification.onRefreshVerification();
      return;
    }
    if (timeLeft === 0) {
      if (localRefreshCountAfterExpiry >= 2) {
        setErrorMsg("Maximum post-expiry refreshes reached (2/2). Please reopen to restart.");
        return;
      }
      setLocalRefreshCountAfterExpiry((prev) => prev + 1);
    } else {
      if (localRefreshCountBeforeExpiry >= 3) {
        setErrorMsg("Maximum pre-expiry refreshes reached (3/3). Please wait for timer to expire.");
        return;
      }
      setLocalRefreshCountBeforeExpiry((prev) => prev + 1);
    }

    setLocalGestureExpiresAt(null);
    setLocalCodeExpiresAt(null);
    setLocalGestureId(null);
    setLocalGestureImageUrl(null);
    setLocalCodeId(null);
    setLocalCodeText(null);
    setErrorMsg(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fetch Gesture Verification when mode is "hand" (only if NOT using sharedVerification)
  const targetSpotId = spot?._id || spot?.id;
  const spotCoordinates: [number, number] = spot?.coordinates?.length === 2
    ? [spot.coordinates[1], spot.coordinates[0]]
    : [11.7284, 76.2841];

  useEffect(() => {
    if (sharedVerification || !isOpen || verificationMode !== "hand") return;
    if (gestureId || isFetchingGestureRef.current) return;

    isFetchingGestureRef.current = true;
    let isMounted = true;
    const fetchGesture = async () => {
      setLocalIsLoadingGesture(true);
      try {
        const res = await spotsApi.getRandomGestureVerification({
          spotId: targetSpotId,
          markspotid: targetSpotId,
          coordinates: [spotCoordinates[1], spotCoordinates[0]],
          action: "contest",
        });
        if (isMounted && res && res.success) {
          const imgUrl = (res as any).imageUrl || (res as any).data?.imageUrl;
          const imgId = (res as any).imageId || (res as any).data?.imageId;
          if (imgUrl) setLocalGestureImageUrl(imgUrl);
          if (imgId) setLocalGestureId(imgId);
          setLocalGestureExpiresAt(Date.now() + 180 * 1000);
        }
      } catch (err) {
        console.error("Failed to fetch contest gesture verification:", err);
      } finally {
        if (isMounted) setLocalIsLoadingGesture(false);
        isFetchingGestureRef.current = false;
      }
    };

    fetchGesture();
    return () => {
      isMounted = false;
    };
  }, [sharedVerification, isOpen, verificationMode, gestureId, refreshTrigger, targetSpotId]);

  // Fetch Code Verification when mode is "code" (only if NOT using sharedVerification)
  useEffect(() => {
    if (sharedVerification || !isOpen || verificationMode !== "code") return;
    if (codeId || isFetchingCodeRef.current) return;

    isFetchingCodeRef.current = true;
    let isMounted = true;
    const fetchCode = async () => {
      setLocalIsLoadingCode(true);
      try {
        const res = await spotsApi.getRandomCodeVerification({
          spotId: targetSpotId,
          markspotid: targetSpotId,
          coordinates: [spotCoordinates[1], spotCoordinates[0]],
          action: "contest",
        });
        if (isMounted && res && res.success) {
          const cVal = (res as any).code || (res as any).data?.code;
          const cId = (res as any).verificationId || (res as any).data?.verificationId;
          if (cVal) setLocalCodeText(cVal);
          if (cId) setLocalCodeId(cId);
          setLocalCodeExpiresAt(Date.now() + 300 * 1000);
        }
      } catch (err) {
        console.error("Failed to fetch contest code verification:", err);
      } finally {
        if (isMounted) setLocalIsLoadingCode(false);
        isFetchingCodeRef.current = false;
      }
    };

    fetchCode();
    return () => {
      isMounted = false;
    };
  }, [sharedVerification, isOpen, verificationMode, codeId, refreshTrigger, targetSpotId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(spot?.isCompleted ? "fake_photo" : "fake_or_ai");
    }
  }, [isOpen, spot?.isCompleted]);

  if (!isOpen || !spot) return null;

  const spotIdShort = (spot._id || spot.id || "SW-7741").slice(-6).toUpperCase();
  const spotCoords = spot.lat && spot.lng
    ? `${spot.lat.toFixed(4)}° N, ${spot.lng.toFixed(4)}° E`
    : spot.coordinates && Array.isArray(spot.coordinates)
    ? `${Number(spot.coordinates[1]).toFixed(4)}° N, ${Number(spot.coordinates[0]).toFixed(4)}° E`
    : "11.7291° N, 76.2854° E";

  const extractUsername = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "object") {
      if (val.username) return val.username.startsWith("@") ? val.username : `@${val.username}`;
      if (val.name) return val.name;
    } else if (typeof val === "string" && val.trim().length > 0 && !val.match(/^[0-9a-fA-F]{24}$/)) {
      return val.startsWith("@") ? val : `@${val}`;
    }
    return null;
  };

  const reporterName =
    extractUsername(spot.markedBy) ||
    extractUsername(spot.reportedBy) ||
    extractUsername(spot.user) ||
    extractUsername(spot.SpotedUser) ||
    "Citizen Reporter";

  const cleanerName =
    extractUsername(spot.completedBy) ||
    (Array.isArray(spot.isAssignedBy) && spot.isAssignedBy[0]
      ? extractUsername(spot.isAssignedBy[0]?.username || spot.isAssignedBy[0]?.id || spot.isAssignedBy[0])
      : null) ||
    extractUsername(spot.assignedTo) ||
    "Assigned Volunteer";

  const displayImage = isCompleteReport
    ? (spot.completedImage || spot.completedProofPhoto || spot.proofPhoto || spot.image)
    : spot.image;

  // Exact 5 non-duplicated reasons matching user specification:
  // Fake photo, It doesn't cleanup, Wrong location, Incomplete cleanup, Other fraud
  const objectionReasons = isCompleteReport
    ? [
        {
          id: "fake_photo",
          title: "Fake or Staged Photo",
          desc: "Cleanup user posted a fake photo, downloaded from the internet, or reused an old photo",
          icon: "no_photography",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
        {
          id: "not_cleaned",
          title: "Spot Not Cleaned / Waste Still Present",
          desc: "The spot was not cleaned; trash, garbage or debris remains lying at the site",
          icon: "delete_forever",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
        {
          id: "wrong_location",
          title: "Wrong Location / Different Spot",
          desc: "Proof photo was taken at a different location and does not match this spot",
          icon: "wrong_location",
          iconColor: "text-[#a33900]",
          dotColor: "bg-[#a33900]",
        },
        {
          id: "incomplete_cleanup",
          title: "Incomplete Cleanup / Improper Disposal",
          desc: "Cleanup was only partially done, or waste was dumped into nearby drains or bushes",
          icon: "delete_sweep",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
        {
          id: "other_fraud",
          title: "Other Policy Violation / Fraud",
          desc: "False completion claim, duplicate submission, or other cleanup violation",
          icon: "report",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
      ]
    : [
        {
          id: "fake_or_ai",
          title: "Fake or AI-Generated Spot",
          desc: "Photo is fabricated, AI generated, or stock image from internet",
          icon: "sentiment_dissatisfied",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
        {
          id: "already_cleaned",
          title: "Already Clean / No Waste Found",
          desc: "Area is clean; no waste or debris exists at this location",
          icon: "cleaning_services",
          iconColor: "text-[#006948]",
          dotColor: "bg-[#006948]",
        },
        {
          id: "inaccessible",
          title: "Inaccessible or Hazardous Area",
          desc: "Private property, gated zone, or physically dangerous site",
          icon: "block",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
        {
          id: "wrong_location",
          title: "Incorrect Location / Coordinates",
          desc: "GPS coordinates or pin do not match the real spot location",
          icon: "wrong_location",
          iconColor: "text-[#a33900]",
          dotColor: "bg-[#a33900]",
        },
        {
          id: "other_spam",
          title: "Other Policy Violation / Spam",
          desc: "Duplicate report, spam, or inappropriate content",
          icon: "report",
          iconColor: "text-[#ba1a1a]",
          dotColor: "bg-[#ba1a1a]",
        },
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMsg("Please select an objection reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const matchedReason = objectionReasons.find((r) => r.id === selectedReason);
      const targetSpotId = spot?._id || spot?.id || "";

      const targetForWhat = isCompleteReport ? "reportCompleteSpot" : "reportSpot";
      const formData = new FormData();
      formData.append("spotId", targetSpotId);
      formData.append("forWhat", targetForWhat);
      formData.append("reason", selectedReason);
      formData.append("reasonForSpot", selectedReason);
      formData.append("reasonForSpotComplete", selectedReason);
      formData.append("reasonTitle", matchedReason?.title || selectedReason);
      formData.append("details", explanation.trim());
      formData.append("description", explanation.trim());
      formData.append("verificationMode", verificationMode);

      const vId = verificationMode === "hand" ? gestureId : codeId;
      if (vId) {
        formData.append("verificationId", vId);
      }
      if (imageFile) {
        formData.append("image", imageFile);
        formData.append("counterPhoto", imageFile);
      }

      const res = await spotsApi.reportSpot(targetSpotId, formData);
      if (res && res.success === false && !(res as any)?.report) {
        setErrorMsg(res.message || "Failed to submit contest report.");
        setIsSubmitting(false);
        return;
      }

      if (onSubmitReport) {
        onSubmitReport(spot, {
          reason: selectedReason,
          reasonTitle: matchedReason?.title || selectedReason,
          details: explanation.trim(),
          counterPhoto: imageFile,
          counterPhotoPreview: imagePreview,
          verificationMode: verificationMode,
          verificationId: vId,
        });
      }

      setSuccessMsg(
        isCompleteReport
          ? "Cleanup report registered! Dossier dispatched to Municipal Auditors & AI Vision Verifier."
          : "Dispute registered! Dossier dispatched to Tier-2 Arbitrators & AI Vision Auditor."
      );
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting contest report:", err);
      setErrorMsg(err?.message || "Failed to submit report. Please try again.");
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-60 bg-[#131b2e]/75 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto animate-enter">
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-[#faf8ff] text-[#131b2e] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#dae2fd] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-[#faf8ff]/95 backdrop-blur-xl border-b border-[#dae2fd] px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            aria-label="Go Back"
            onClick={onClose}
            className="w-10 h-10 -ml-1 flex items-center justify-center rounded-xl text-[#131b2e] hover:bg-[#eaedff] active:bg-[#e2e7ff] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>

          <div className="flex-1 px-2 text-center min-w-0">
            <h1 className="text-base font-['Hanken_Grotesk'] font-bold tracking-tight text-[#131b2e] truncate">
              {isCompleteReport ? "Report Cleanup Submission" : "Contest Spot Report"}
            </h1>
          </div>

          <div className="w-10 h-10 -mr-1 shrink-0" />
        </header>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {errorMsg && (
            <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-xl border border-[#ffb4ab] text-xs flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {hasUserReported && (
            <div className="bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200 text-xs flex items-center gap-2 font-medium shadow-2xs">
              <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
              <span>
                {isCompleteReport
                  ? "You have already registered an objection against this cleanup submission."
                  : "You have already registered an objection against this spot. Duplicate reports cannot be filed."}
              </span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#85f8c4]/40 text-[#005137] p-3 rounded-xl border border-[#006948]/30 text-xs flex items-center gap-2 font-bold animate-pulse">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Status Context Ribbon */}
          <div className="flex items-center justify-between bg-[#e2e7ff] rounded-xl px-3 py-2 text-[#3d4a42]">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#a33900] text-sm">
                {isCompleteReport ? "verified" : "gavel"}
              </span>
              <span className="font-['JetBrains_Mono'] text-xs font-semibold tracking-wider text-[#a33900] uppercase">
                {isCompleteReport ? "Cleanup Verification Audit" : "Dispute Arbitration Protocol"}
              </span>
            </div>
            <span className="inline-flex items-center text-xs font-['JetBrains_Mono'] text-[#131b2e] bg-[#faf8ff] px-2 py-0.5 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a33900] mr-1.5 animate-pulse"></span>
              {isCompleteReport ? "AUDIT-MODE" : "T1-LOCK"}
            </span>
          </div>

          {/* Section 1: Assigned Spot Summary Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#dae2fd]/70 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 bg-[#85f8c4] text-[#002114] px-2 py-0.5 rounded-full font-['JetBrains_Mono'] text-[11px] font-bold mb-1">
                  <span className="material-symbols-outlined text-[13px]">
                    {isCompleteReport ? "task_alt" : "verified_user"}
                  </span>
                  {isCompleteReport ? "Completed Cleanup Under Review" : "Assigned Target Spot"}
                </div>
                <h2 className="text-sm sm:text-base font-['Hanken_Grotesk'] font-bold text-[#131b2e] truncate">
                  Spot #{spotIdShort} • {spot.title || spot.address || "Reported Location"}
                </h2>
              </div>
              <span className="material-symbols-outlined text-[#6d7a72] text-xl shrink-0">near_me</span>
            </div>

            {/* Telemetry Strip */}
            <div className="bg-[#f2f3ff] rounded-xl p-2.5 flex items-center justify-between font-['JetBrains_Mono'] text-[11px] text-[#3d4a42] border border-[#dae2fd]/50">
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[#006948] text-sm">satellite_alt</span>
                <span className="truncate">{spotCoords}</span>
              </div>
              <span className="text-[#006948] font-bold shrink-0">±2.8m (RTK GNSS)</span>
            </div>

            {/* Submission Preview Card */}
            <div className="flex gap-3 items-center bg-[#f2f3ff] rounded-xl p-2.5 border border-[#dae2fd]/50">
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-[#bccac0]/40 bg-[#283044]">
                {displayImage ? (
                  <img
                    alt={isCompleteReport ? "Cleanup proof photo preview" : "Civilian reported garbage spot preview"}
                    className="w-full h-full object-cover"
                    src={displayImage}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-2xl">image</span>
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-[#283044]/85 backdrop-blur-xs text-[8px] font-['JetBrains_Mono'] text-[#eef0ff] font-bold text-center py-0.5 uppercase tracking-tight">
                  {isCompleteReport ? "Cleanup Proof" : "Citizen Evid."}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="inline-block bg-[#ffdbce] text-[#370e00] text-[10px] font-['JetBrains_Mono'] font-bold px-2 py-0.5 rounded">
                  {isCompleteReport ? "SUBMITTED CLEANUP PROOF" : "CIVILIAN REPORTED PHOTO"}
                </div>
                <p className="text-xs font-['Inter'] text-[#131b2e] truncate font-medium">
                  {spot.description || (isCompleteReport ? "Submitted cleanup proof photo under review" : "Flagged site photo under contestation")}
                </p>
                <div className="flex items-center text-[11px] text-[#3d4a42] font-['JetBrains_Mono'] gap-1">
                  <span className="material-symbols-outlined text-xs text-[#6d7a72]">schedule</span>
                  <span className="truncate">
                    {isCompleteReport ? (
                      <>Cleaned by <strong className="text-[#131b2e] font-semibold">{cleanerName}</strong></>
                    ) : (
                      <>Reported by <strong className="text-[#131b2e] font-semibold">{reporterName}</strong></>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 1. Live Camera / Photo Capture Viewfinder (Image 2 Design) */}
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
                  alt="Counter-proof capture preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* State B: Idle Viewfinder (Exact Image 2 Style) */}
              {!isCameraActive && !imagePreview && (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[#131b2e] gap-3 bg-[#f2f3ff] w-full h-full">
                  <div className="w-14 h-14 rounded-full bg-[#006948]/10 text-[#006948] flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
                      {isCompleteReport ? "Capture Site Proof Photo" : "Capture Counter-Proof Photo"}
                    </h3>
                    <p className="text-xs text-[#535f70] font-['Inter'] mt-0.5">
                      {isCompleteReport
                        ? "Take a real-time photo showing uncleaned trash or incorrect site location"
                        : "Take a real-time photo of the area using your camera"}
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
                      {isTorchSupported && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer active:scale-90 border border-white/10 ${
                            isTorchOn
                              ? "bg-amber-400 text-slate-900 shadow-md shadow-amber-400/40"
                              : "bg-black/50 hover:bg-black/70 text-white"
                          }`}
                          title={isTorchOn ? "Flashlight ON" : "Flashlight OFF"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isTorchOn ? "flashlight_on" : "flashlight_off"}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setCameraRatio((prev) => (prev === "9:16" ? "4:3" : "9:16"))}
                        className="px-2.5 py-1 rounded-full bg-black/50 hover:bg-black/70 text-white text-[11px] font-['JetBrains_Mono'] font-bold backdrop-blur-sm transition-all cursor-pointer active:scale-90 flex items-center gap-1 border border-white/10"
                        title="Toggle Aspect Ratio"
                      >
                        <span className="material-symbols-outlined text-[14px]">aspect_ratio</span>
                        <span>{cameraRatio}</span>
                      </button>

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

          {/* Section 3: 2. Liveness Verification Card (Exact Image 2 Style) */}
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
                      alt="Pose verification gesture"
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
                    <p className="text-[11px] text-[#3d4a42] font-['Inter'] leading-snug mt-1">
                      Hold your hand in the camera viewfinder showing this exact gesture above the cleaned area.
                    </p>
                  </div>

                  {timeLeft === 0 ? (
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
                        Gesture expired. {refreshCountAfterExpiry >= 2 ? "No refreshes left." : "Click to refresh."}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-[#006948]">
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

          {/* Section 4: Objection Reason Selector */}
          <div className="space-y-2">
            <div className="px-1">
              <h3 className="text-xs font-['JetBrains_Mono'] uppercase tracking-wider font-bold text-[#131b2e]">
                {isCompleteReport ? "Select Cleanup Issue" : "Select Reason"} <span className="text-rose-500">*</span>
              </h3>
              <p className="text-[11px] text-[#3d4a42] font-['Inter']">
                {isCompleteReport
                  ? "Select what is wrong with this cleanup submission"
                  : "Required classification for AI-Admin dispute arbitration"}
              </p>
            </div>

            <div className="space-y-2">
              {objectionReasons.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-rose-50/80 border-[#ba1a1a] shadow-xs ring-1 ring-[#ba1a1a]/30"
                        : "bg-white border-[#bccac0]/40 hover:bg-[#f2f3ff] hover:border-[#bccac0]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="objection_reason"
                      value={reason.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(reason.id)}
                      className="hidden"
                    />
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected ? "bg-white border-[#ba1a1a]" : "bg-[#eaedff] border-[#bccac0]"
                      }`}
                    >
                      {isSelected && <span className={`w-2.5 h-2.5 rounded-full ${reason.dotColor}`}></span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-['Hanken_Grotesk'] font-bold text-[#131b2e]">
                          {reason.title}
                        </span>
                        <span className={`material-symbols-outlined text-lg ${reason.iconColor}`}>
                          {reason.icon}
                        </span>
                      </div>
                      <p className="text-xs text-[#3d4a42] font-['Inter'] mt-0.5 leading-snug">
                        {reason.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5: Detailed Explanation Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label
                htmlFor="explanationText"
                className="text-xs font-['JetBrains_Mono'] uppercase tracking-wider font-bold text-[#131b2e]"
              >
                Detailed Explanation{" "}
                <span className="text-[#3d4a42] font-normal lowercase">(optional)</span>
              </label>
              <span className="font-['JetBrains_Mono'] text-xs text-[#3d4a42]">
                {explanation.length} / 400
              </span>
            </div>
            <div className="relative bg-white rounded-2xl p-3 shadow-xs border border-[#bccac0]/40">
              <textarea
                id="explanationText"
                rows={3}
                maxLength={400}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder={
                  isCompleteReport
                    ? "Describe why this cleanup is invalid (e.g., user posted a fake photo, spot is not cleaned, debris still remains, photo from wrong location)..."
                    : "Describe why this report is invalid (e.g., area is a clean park, old photograph used, wall painted yesterday)..."
                }
                className="w-full bg-transparent text-xs sm:text-sm font-['Inter'] text-[#131b2e] placeholder:text-[#6d7a72] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 6: Accountability Warning Banner */}
          <div className="bg-[#ffdbce]/40 rounded-2xl p-3.5 flex items-start gap-3 border border-[#cc4900]/20">
            <div className="w-7 h-7 rounded-full bg-[#cc4900] text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-base">shield_with_heart</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-['Hanken_Grotesk'] font-bold text-[#131b2e] uppercase tracking-wide block">
                {isCompleteReport ? "Civic Verification Guardrail" : "Coordinator Accountability Guardrail"}
              </span>
              <p className="text-xs font-['Inter'] text-[#3d4a42] leading-relaxed">
                {isCompleteReport
                  ? "Reporting a cleanup will trigger review by municipal moderators and AI photo auditors. Fraudulent or bad-faith claims are penalized."
                  : "Submitting bad-faith objections to avoid cleanup duties will degrade your Coordinator Trust Rating (-15%) and trigger a slash penalty on locked civic karma."}
              </p>
            </div>
          </div>

          {/* Section 7: Bottom Action Area */}
          <div className="pt-2 pb-2">
            <button
              type="submit"
              disabled={isSubmitting || hasUserReported}
              className={`w-full py-3.5 px-4 rounded-xl font-['Hanken_Grotesk'] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-md transition-all ${
                hasUserReported
                  ? "bg-slate-400 text-white cursor-not-allowed opacity-60"
                  : "bg-[#ba1a1a] hover:bg-[#93000a] text-white active:scale-[0.99] cursor-pointer disabled:opacity-50"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isCompleteReport ? "Submitting Cleanup Report..." : "Registering Dispute..."}</span>
                </>
              ) : hasUserReported ? (
                <>
                  <span className="material-symbols-outlined text-lg">check</span>
                  <span>{isCompleteReport ? "Cleanup Already Reported by You" : "Already Reported by You"}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">{isCompleteReport ? "flag" : "gavel"}</span>
                  <span>{isCompleteReport ? "Submit Report on Cleanup" : "Register Report Against Marked User"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
