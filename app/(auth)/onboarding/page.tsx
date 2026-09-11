"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Shield,
  Wrench,
  CheckCircle2,
  Navigation,
  MapPin,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Home,
  User,
  Mail,
  Building,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { authApi } from "@/lib/api";
import ValidationAlertModal from "@/components/ValidationAlertModal";

// Custom useDebounce hook for input text debouncing
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

type RoleOption = "Civilian" | "Hybrid" | "Coordinator";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill email from URL if available
  const emailParam = searchParams.get("email") || "";

  // State management
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Hybrid"); // Hybrid (Civic Ranger) recommended by default

  // Username Uniqueness Debounced Validation State
  const debouncedUsername = useDebounce(username, 450);
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);
  const [isUsernameUnique, setIsUsernameUnique] = useState<boolean | null>(null);
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string | null>(null);

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Geolocation state: [longitude, latitude]
  const [coords, setCoords] = useState<[number, number]>([76.2711, 10.7751]); // Default ward coords
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Ward 14, Central Sector (Default)");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setupFinished, setSetupFinished] = useState(false);

  // Signed In User Session State
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAlreadySignedIn, setIsAlreadySignedIn] = useState(false);

  // Validation Alert Popup Modal State
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    errors?: any;
  }>({ isOpen: false });

  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }

    async function fetchSession() {
      try {
        const res = await authApi.getMe();
        if (res.success) {
          if (res.isProfileCompleted || res.authorizationType === "normal") {
            setIsAlreadySignedIn(true);
            setCurrentUser(res.user);
            return;
          }
          if (res.user) {
            if (res.user.email && !emailParam) setEmail(res.user.email);
            if (res.user.username) setUsername(res.user.username);
            if (res.user.avatarUrl || res.user.avatar?.url) {
              setAvatarPreview(res.user.avatarUrl || res.user.avatar?.url);
            }
          }
        } else {
          // If no token cookie or unauthorized, redirect to /login
          router.push("/login");
        }
      } catch (e) {
        console.warn("Session fetch error:", e);
        router.push("/login");
      }
    }
    fetchSession();
  }, [emailParam, email, router]);

  // Debounced effect to verify username uniqueness via backend route POST /api/v1/auth/is-unique-username
  useEffect(() => {
    const trimmed = debouncedUsername.trim();
    if (!trimmed) {
      setIsUsernameUnique(null);
      setUsernameStatusMessage(null);
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3) {
      setIsUsernameUnique(false);
      setUsernameStatusMessage("Username must be at least 3 characters long");
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setIsUsernameUnique(false);
      setUsernameStatusMessage("Username can only contain letters, numbers, and underscores");
      setIsCheckingUsername(false);
      return;
    }

    let isCancelled = false;
    async function checkUniqueness() {
      setIsCheckingUsername(true);
      try {
        const res = await authApi.checkUsername(trimmed);
        if (isCancelled) return;

        if (res.success) {
          setIsUsernameUnique(true);
          setUsernameStatusMessage("Username is unique and available! ✅");
        } else {
          setIsUsernameUnique(false);
          setUsernameStatusMessage(res.message || "Username already exists. Please pick another.");
        }
      } catch (err: any) {
        if (isCancelled) return;
        setIsUsernameUnique(false);
        setUsernameStatusMessage("Error verifying username uniqueness.");
      } finally {
        if (!isCancelled) setIsCheckingUsername(false);
      }
    }

    checkUniqueness();

    return () => {
      isCancelled = true;
    };
  }, [debouncedUsername]);

  // Handle avatar file selection & 5MB size limit validation
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError(null);

    if (!file) return;

    // 1. Validate file size (under 5MB)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setAvatarError(`Image size must be under 5MB. (Selected file: ${fileSizeMB} MB)`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Validate file type (must be an image)
    if (!file.type.startsWith("image/")) {
      setAvatarError("Invalid file type. Please select an image file (JPG, PNG, WEBP, GIF, SVG).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAvatarFile(file);

    // Create live image preview via FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAutoDetect = () => {
    setIsDetecting(true);
    setErrorMessage(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          setCoords([lng, lat]);
          setLocationStatus(`Live Coordinates: ${lat}° N, ${lng}° E`);
          setIsDetecting(false);
        },
        (error) => {
          console.warn("GPS Geolocation error:", error);
          // Fallback to simulated ward location
          setCoords([76.2711, 10.7751]);
          setLocationStatus("Ward 7, Central Civic Sector (GPS Default)");
          setIsDetecting(false);
        },
        { timeout: 8000 }
      );
    } else {
      setCoords([76.2711, 10.7751]);
      setLocationStatus("Ward 7, Central Civic Sector (GPS Default)");
      setIsDetecting(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationErrors: { field: string; message: string }[] = [];

    // Client-side validations matching backend Zod schema
    if (!username.trim() || username.trim().length < 3) {
      validationErrors.push({ field: "username", message: "Username must be at least 3 characters long." });
    }

    if (!email.trim() || !email.includes("@")) {
      validationErrors.push({ field: "email", message: "Please enter a valid email address." });
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      validationErrors.push({ field: "pincode", message: "Pincode must be a valid 6-digit number." });
    }

    if (!address.trim()) {
      validationErrors.push({ field: "address", message: "Please enter your street address or locality." });
    }

    if (avatarError) {
      validationErrors.push({ field: "avatar", message: avatarError });
    }

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.map((err) => err.message).join(", "));
      setValidationAlert({
        isOpen: true,
        title: "Validation Error",
        message: "Validation Error",
        errors: validationErrors,
      });
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("username", username.trim());
        formData.append("email", email.trim());
        formData.append("pincode", pincode.trim());
        formData.append("address", address.trim());
        formData.append("role", selectedRole);
        formData.append("geolocation", JSON.stringify({ type: "Point", coordinates: coords }));
        formData.append("provider", "email");
        formData.append("providerId", "email123");
        formData.append("avatar", avatarFile);

        response = await authApi.signUpCompletion(formData);
      } else {
        const payload = {
          username: username.trim(),
          email: email.trim(),
          pincode: pincode.trim(),
          address: address.trim(),
          role: selectedRole,
          geolocation: {
            type: "Point" as const,
            coordinates: coords,
          },
          provider: "email" as const,
          providerId: "email123",
          avatarUrl: avatarPreview || undefined,
        };

        response = await authApi.signUpCompletion(payload);
      }
      setIsLoading(false);

      if (response.success) {
        setSetupFinished(true);
        setTimeout(() => {
          router.push("/feed");
        }, 1200);
      } else {
        const fallBackMsg = response.message || "Failed to complete setup. Please verify your details.";
        setErrorMessage(
          response.errors && response.errors.length > 0
            ? response.errors.map((err: any) => err.message).join(", ")
            : fallBackMsg
        );

        if (response.message === "Validation Error" || (response.errors && response.errors.length > 0)) {
          setValidationAlert({
            isOpen: true,
            title: "Validation Error",
            message: response.message || "Validation Error",
            errors: response.errors || [{ field: "form", message: fallBackMsg }],
          });
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.message || "Network error while completing setup.";
      setErrorMessage(errMsg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8FF] text-[#131b2e] antialiased selection:bg-[#85f8c4] selection:text-[#002114]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E2E7FF] pt-5 pb-4 px-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#6d7a72] hover:text-[#006948] font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="font-mono text-[10px] text-[#006948] uppercase tracking-wider font-bold bg-[#006948]/10 px-2.5 py-0.5 rounded-full border border-[#006948]/20">
            Step 2 of 2: Profile Completion
          </span>
        </div>

        <div className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="h-1.5 flex-1 bg-[#006948] rounded-full"></div>
          <div className="h-1.5 flex-1 bg-[#006948] rounded-full"></div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-[#85f8c4]/30 px-3 py-1 rounded-full mb-2 border border-[#006948]/20">
          <ShieldCheck className="w-3.5 h-3.5 text-[#006948]" />
          <span className="font-mono text-[10px] text-[#006948] font-bold uppercase tracking-wider">
            SafaiWatch Registration
          </span>
        </div>

        <h1 className="font-['Hanken_Grotesk'] text-2xl font-bold tracking-tight text-[#131b2e] mb-1">
          Complete Your Civic Profile
        </h1>
        <p className="text-xs text-[#3d4a42] leading-relaxed">
          Provide your details and anchor your ward location for live incident reports and cleanup dispatches.
        </p>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 px-6 pb-28 max-w-lg mx-auto w-full pt-5 flex flex-col gap-6">
        {isAlreadySignedIn && currentUser ? (
          <div className="bg-white rounded-[24px] p-6 border border-[#006948]/30 shadow-lg flex flex-col items-center text-center gap-4 my-auto animate-enter">
            <div className="w-14 h-14 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center border border-[#006948]/20">
              <ShieldCheck className="w-7 h-7 text-[#006948]" />
            </div>

            <div>
              <span className="font-mono text-[10px] font-bold text-[#006948] uppercase tracking-widest bg-[#006948]/10 px-2.5 py-0.5 rounded-full border border-[#006948]/20">
                Profile Already Completed
              </span>
              <h2 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e] mt-1.5">
                Signed In as {currentUser.username || currentUser.name || "Civic Hero"}
              </h2>
              <p className="text-xs text-[#6d7a72] mt-0.5">{currentUser.email}</p>
            </div>

            <div className="w-full bg-[#FAF8FF] rounded-xl p-3.5 border border-[#bccac0]/40 text-xs flex flex-col gap-1.5 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[#6d7a72]">Assigned Role:</span>
                <span className="font-mono font-bold text-[#006948]">{currentUser.role || "Hybrid"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6d7a72]">Pincode Territory:</span>
                <span className="font-mono font-bold text-[#131b2e]">{currentUser.pincode || "Registered"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full pt-1">
              <Link
                href="/"
                className="w-full h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-[#006948] hover:bg-[#00855d] text-white shadow-md transition-all"
              >
                <span>Go to Home Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/feed"
                className="w-full h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-white hover:bg-[#FAF8FF] text-[#131b2e] border border-[#bccac0]/60 transition-all"
              >
                <span>Explore Locality Feed</span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  await authApi.signOut();
                  setIsAlreadySignedIn(false);
                  setCurrentUser(null);
                  router.push("/login");
                }}
                className="w-full h-[40px] text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-all cursor-pointer"
              >
                Sign Out &amp; Switch Account
              </button>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="bg-[#ffdad6]/60 border border-[#ba1a1a]/40 text-[#93000a] text-xs font-semibold px-4 py-3 rounded-xl flex items-start gap-2.5 animate-enter">
                <AlertCircle className="w-4 h-4 text-[#ba1a1a] mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCompleteSetup} className="flex flex-col gap-6">
          {/* Section 1: User Identity */}
          <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-xs flex flex-col gap-4">
            <h2 className="font-mono text-[11px] text-[#6d7a72] uppercase tracking-widest font-bold border-b border-[#E2E8F0] pb-2">
              1. Basic Information
            </h2>

            {/* Profile Picture Upload Field */}
            <div className="flex flex-col gap-2 p-4 bg-[#FAF8FF] rounded-2xl border border-[#006948]/20">
              <label className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#006948]" />
                  <span>User Profile Picture</span>
                </span>
                <span className="text-[10px] text-[#006948] bg-[#006948]/10 px-2 py-0.5 rounded-full font-bold">
                  Max 5MB
                </span>
              </label>

              <div className="flex items-center gap-4 pt-1">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#006948]/30 overflow-hidden flex items-center justify-center shadow-xs">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-[#6d7a72]" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-[#006948] hover:bg-[#00855d] text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                    title="Upload Profile Picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload-input"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white border border-[#bccac0]/60 hover:bg-[#FAF8FF] text-[#131b2e] rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      {avatarPreview ? "Change Photo" : "Upload Photo"}
                    </button>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl font-semibold transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[#6d7a72] leading-tight">
                    Supported: JPG, PNG, WEBP. Strictly under 5MB size limit.
                  </p>
                </div>
              </div>

              {avatarError && (
                <div className="mt-1 bg-[#ffdad6]/60 border border-[#ba1a1a]/40 text-[#93000a] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}
            </div>

            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#006948]" />
                  <span>Username</span>
                </span>
                {isUsernameUnique === true && (
                  <span className="text-[10px] text-[#059669] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                    Available
                  </span>
                )}
                {isUsernameUnique === false && (
                  <span className="text-[10px] text-[#ba1a1a] font-bold bg-[#FFDAD6] px-2 py-0.5 rounded-full border border-[#FFB4AB]">
                    Unavailable
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah_jenkins"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (isUsernameUnique !== null) setIsUsernameUnique(null);
                  }}
                  className={`w-full px-4 py-3 bg-[#f2f3ff] border rounded-xl text-sm font-medium text-[#131b2e] placeholder:text-[#6d7a72]/60 focus:outline-none focus:bg-white transition-all ${
                    isUsernameUnique === true
                      ? "border-[#059669] ring-1 ring-[#059669]/20"
                      : isUsernameUnique === false
                      ? "border-[#ba1a1a] ring-1 ring-[#ba1a1a]/20"
                      : "border-[#bccac0]/50 focus:border-[#006948]"
                  }`}
                />
                {isCheckingUsername && (
                  <div className="absolute right-3.5 top-3.5">
                    <Loader2 className="w-4 h-4 animate-spin text-[#006948]" />
                  </div>
                )}
              </div>

              {/* Username Uniqueness Live Feedback Message */}
              {isCheckingUsername && (
                <p className="text-xs text-[#006948] font-medium flex items-center gap-1.5 mt-0.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006948]" />
                  <span>Checking username availability...</span>
                </p>
              )}
              {!isCheckingUsername && isUsernameUnique === true && (
                <p className="text-xs text-[#059669] font-semibold flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>{usernameStatusMessage}</span>
                </p>
              )}
              {!isCheckingUsername && isUsernameUnique === false && (
                <p className="text-xs text-[#ba1a1a] font-semibold flex items-center gap-1.5 mt-0.5">
                  <XCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                  <span>{usernameStatusMessage}</span>
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#006948]" />
                <span>Verified Email</span>
              </label>
              <input
                type="email"
                required
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#bccac0]/50 rounded-xl text-sm font-medium text-[#131b2e] placeholder:text-[#6d7a72]/60 focus:outline-none focus:border-[#006948] focus:bg-white transition-all"
              />
            </div>

            {/* Address & Pincode Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#006948]" />
                  <span>Street Address</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 14 Main Ward Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#bccac0]/50 rounded-xl text-sm font-medium text-[#131b2e] placeholder:text-[#6d7a72]/60 focus:outline-none focus:border-[#006948] focus:bg-white transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold">
                  <span>Pincode</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="679101"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f2f3ff] border border-[#bccac0]/50 rounded-xl text-sm font-mono font-bold text-[#131b2e] placeholder:text-[#6d7a72]/60 focus:outline-none focus:border-[#006948] focus:bg-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Role Selection */}
          <section className="flex flex-col gap-3">
            <h2 className="font-mono text-[11px] text-[#6d7a72] uppercase tracking-widest font-bold">
              2. Choose Your Primary Civic Role
            </h2>

            <div className="flex flex-col gap-3">
              {/* Option 1: Civilian */}
              <button
                type="button"
                onClick={() => setSelectedRole("Civilian")}
                className={`p-4 rounded-[20px] flex items-start gap-3.5 text-left w-full relative transition-all cursor-pointer border ${
                  selectedRole === "Civilian"
                    ? "border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]"
                    : "border-[#E2E8F0] bg-white hover:border-[#006948]/40"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-[#6d7a72]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e] mb-0.5">
                    Civilian <span className="text-[#3d4a42] font-normal text-xs">(Spotter)</span>
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-snug">
                    Report issues casually when you spot uncollected waste or dirty public bins.
                  </p>
                </div>
                {selectedRole === "Civilian" && (
                  <div className="text-[#006948]">
                    <CheckCircle2 className="w-5 h-5 fill-[#006948] text-white" />
                  </div>
                )}
              </button>

              {/* Option 2: Hybrid (Civic Ranger) - RECOMMENDED */}
              <button
                type="button"
                onClick={() => setSelectedRole("Hybrid")}
                className={`p-4 rounded-[20px] flex items-start gap-3.5 text-left w-full relative overflow-hidden transition-all cursor-pointer border ${
                  selectedRole === "Hybrid"
                    ? "border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]"
                    : "border-[#E2E8F0] bg-white hover:border-[#006948]/40"
                }`}
              >
                <div className="absolute top-0 right-0 bg-[#F59E0B] text-white font-mono text-[9px] px-2.5 py-0.5 rounded-bl-xl font-bold tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>RECOMMENDED ★</span>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#006948]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[#006948]" />
                </div>
                <div className="flex-1 pr-14">
                  <h3 className="font-['Hanken_Grotesk'] text-sm font-bold text-[#006948] mb-0.5">
                    Civic Ranger <span className="text-[#006948]/70 font-normal text-xs">(Hybrid)</span>
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-snug">
                    Report incidents, join local cleanup drives, earn civic karma, and verify reports.
                  </p>
                </div>
                {selectedRole === "Hybrid" && (
                  <div className="text-[#006948]">
                    <CheckCircle2 className="w-5 h-5 fill-[#006948] text-white" />
                  </div>
                )}
              </button>

              {/* Option 3: Coordinator */}
              <button
                type="button"
                onClick={() => setSelectedRole("Coordinator")}
                className={`p-4 rounded-[20px] flex items-start gap-3.5 text-left w-full relative transition-all cursor-pointer border ${
                  selectedRole === "Coordinator"
                    ? "border-[#006948] bg-[#f5fff7] ring-1 ring-[#006948]"
                    : "border-[#E2E8F0] bg-white hover:border-[#006948]/40"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 text-[#6d7a72]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e] mb-0.5">
                    Coordinator <span className="text-[#3d4a42] font-normal text-xs">(Lead)</span>
                  </h3>
                  <p className="text-xs text-[#3d4a42] leading-snug">
                    Schedule cleanup events, manage volunteer groups, and review resolution evidence.
                  </p>
                </div>
                {selectedRole === "Coordinator" && (
                  <div className="text-[#006948]">
                    <CheckCircle2 className="w-5 h-5 fill-[#006948] text-white" />
                  </div>
                )}
              </button>
            </div>
          </section>

          {/* Section 3: Geolocation Anchoring */}
          <section className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-xs flex flex-col gap-4">
            <h2 className="font-mono text-[11px] text-[#6d7a72] uppercase tracking-widest font-bold">
              3. Geolocation Territory Anchor
            </h2>

            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="w-full bg-[#006948]/10 hover:bg-[#006948]/20 transition-colors text-[#006948] font-['Hanken_Grotesk'] text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? "animate-spin" : ""}`} />
              <span>{isDetecting ? "Detecting GPS Position..." : "Detect Live Geolocation Coordinates"}</span>
            </button>

            <div className="bg-[#FAF8FF] border border-[#006948]/30 rounded-xl p-3.5 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#006948] mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-[10px] text-[#6d7a72] uppercase tracking-wider font-bold mb-0.5">
                  Anchored GeoJSON Location
                </p>
                <p className="font-mono text-xs font-bold text-[#131b2e] leading-tight mb-1">
                  [{coords[0]}, {coords[1]}]
                </p>
                <span className="text-[11px] text-[#3d4a42]">{locationStatus}</span>
              </div>
            </div>
          </section>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || setupFinished || isCheckingUsername || isUsernameUnique === false}
            className={`w-full h-[52px] rounded-xl font-['Hanken_Grotesk'] font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
              isUsernameUnique === false || isCheckingUsername
                ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none opacity-80"
                : setupFinished
                ? "bg-[#00855d] text-white active:scale-[0.98] cursor-pointer"
                : "bg-[#006948] hover:bg-[#00855d] text-white active:scale-[0.98] cursor-pointer"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Completing Setup...</span>
              </>
            ) : isCheckingUsername ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <span>Verifying Username...</span>
              </>
            ) : isUsernameUnique === false ? (
              <>
                <XCircle className="w-4 h-4 text-slate-500" />
                <span>Username Unavailable - Pick Another</span>
              </>
            ) : setupFinished ? (
              <>
                <Check className="w-4 h-4 text-[#85f8c4]" />
                <span>Profile Setup Complete! Redirecting...</span>
              </>
            ) : (
              <>
                <span>Complete Setup &amp; Enter Feed</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        </>
        )}
      </main>

      {/* Validation Warning Alert Popup Modal */}
      <ValidationAlertModal
        isOpen={validationAlert.isOpen}
        onClose={() => setValidationAlert({ isOpen: false })}
        title={validationAlert.title}
        message={validationAlert.message}
        errors={validationAlert.errors}
      />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8FF]">
          <Loader2 className="w-8 h-8 animate-spin text-[#006948]" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
