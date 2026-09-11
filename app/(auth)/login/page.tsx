"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Mail,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lock,
  MapPin,
  Leaf,
  Loader2,
  ArrowLeft,
  Edit3,
  RotateCcw,
  KeyRound,
  Home,
  AlertCircle,
  UserPlus,
  LogIn,
} from "lucide-react";
import { authApi } from "@/lib/api";
import ValidationAlertModal from "@/components/ValidationAlertModal";

type AuthMode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router = useRouter();

  // Mode: 'sign-in' | 'sign-up'
  const [mode, setMode] = useState<AuthMode>("sign-in");
  // Step State: 'email' | 'otp'
  const [step, setStep] = useState<"email" | "otp">("email");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation Alert Popup Modal State
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean;
    title?: string;
    message?: string;
    errors?: any;
  }>({ isOpen: false });

  // Signed In User Session State
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAlreadySignedIn, setIsAlreadySignedIn] = useState(false);

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // State for session status differentiation
  const [isIncompleteAuth, setIsIncompleteAuth] = useState(false);

  // Check if user is authorized (normal vs incomplete)
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await authApi.getMe();
        if (response.success) {
          setIsAlreadySignedIn(true);
          setCurrentUser(response.user);
          if (response.isProfileCompleted || response.authorizationType === "normal") {
            setIsIncompleteAuth(false);
          } else {
            setIsIncompleteAuth(true);
          }
        }
      } catch (err) {
        // User not authorized, stay on login form
      }
    }
    checkAuthStatus();
  }, [router]);

  const handleClearEmail = () => {
    setInputValue("");
    setErrorMessage(null);
    emailInputRef.current?.focus();
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setStep("email");
    setErrorMessage(null);
    setOtpDigits(["", "", "", "", "", ""]);
  };

  // Dispatch OTP via Backend API
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = inputValue.trim();
    if (!email || !email.includes("@")) {
      const errMsg = "Please enter a valid email address.";
      setErrorMessage(errMsg);
      setValidationAlert({
        isOpen: true,
        title: "Validation Error",
        message: "Validation Error",
        errors: [{ field: "email", message: errMsg }],
      });
      emailInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    try {
      const response =
        mode === "sign-in"
          ? await authApi.signIn(email)
          : await authApi.signUp(email);

      setIsLoading(false);

      if (response.success) {
        setStep("otp");
        setOtpDigits(["", "", "", "", "", ""]);
        setResendTimer(30);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        const fallBackMsg =
          mode === "sign-in"
            ? "Unable to send Sign-In OTP. Please verify your email or sign up."
            : "Unable to send Sign-Up OTP. User might already exist.";
        const msg = response.message || fallBackMsg;
        setErrorMessage(msg);

        if (response.message === "Validation Error" || (response.errors && response.errors.length > 0)) {
          setValidationAlert({
            isOpen: true,
            title: "Validation Error",
            message: response.message || "Validation Error",
            errors: response.errors || [{ field: "email", message: msg }],
          });
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      const errMsg = err.message || "An unexpected network error occurred.";
      setErrorMessage(errMsg);
    }
  };

  // Handle individual digit input in OTP grid
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      setErrorMessage(null);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMessage(null);
    setResendSuccess(null);

    const email = inputValue.trim();
    setResendTimer(30);

    try {
      const response =
        mode === "sign-in"
          ? await authApi.resendSignInOtp(email)
          : await authApi.resendSignUpOtp(email);

      if (response.success) {
        setResendSuccess("A fresh 6-digit OTP code has been sent to your email!");
        setOtpDigits(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
        setTimeout(() => setResendSuccess(null), 3000);
      } else {
        setErrorMessage(response.message || "Failed to resend OTP code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error resending OTP code.");
    }
  };

  // Submit and verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const code = otpDigits.join("");
    if (code.length < 6) {
      const errMsg = "Please enter all 6 digits of the security OTP code.";
      setErrorMessage(errMsg);
      setValidationAlert({
        isOpen: true,
        title: "Validation Error",
        message: "Validation Error",
        errors: [{ field: "otp", message: errMsg }],
      });
      return;
    }

    setIsVerifying(true);

    const email = inputValue.trim();

    try {
      const response =
        mode === "sign-in"
          ? await authApi.verifySignInOtp(email, code)
          : await authApi.verifySignUpOtp(email, code);

      setIsVerifying(false);

      if (response.success) {
        setVerifySuccess(true);
        setTimeout(() => {
          if (mode === "sign-up") {
            // Proceed to onboarding to complete registration profile
            router.push(`/onboarding?email=${encodeURIComponent(email)}`);
          } else {
            // Sign in complete -> main feed/home
            router.push("/feed");
          }
        }, 1000);
      } else {
        const msg = response.message || "Invalid or expired OTP code.";
        setErrorMessage(msg);
        if (response.message === "Validation Error" || (response.errors && response.errors.length > 0)) {
          setValidationAlert({
            isOpen: true,
            title: "Validation Error",
            message: response.message || "Validation Error",
            errors: response.errors || [{ field: "otp", message: msg }],
          });
        }
      }
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMessage(err.message || "Verification failed.");
    }
  };

  // Handle Google Sign In Redirect
  const handleGoogleAuth = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between py-8 px-4 select-none relative bg-[#FAF8FF] text-[#131b2e] antialiased">
      {/* Top Nav Back to Home */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2 px-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#6d7a72] hover:text-[#006948] font-semibold transition-colors group"
        >
          <Home className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Home Page</span>
        </Link>
        <span className="text-[11px] font-mono font-bold text-[#006948] bg-[#006948]/10 px-2.5 py-0.5 rounded-full border border-[#006948]/20 uppercase">
          SafaiWatch Auth
        </span>
      </div>

      {/* Header Section */}
      <header className="w-full max-w-md mx-auto pt-4 pb-2 flex flex-col items-center text-center">
        {/* Brand Shield Icon */}
        <Link
          href="/"
          className="w-16 h-16 bg-[#006948] rounded-2xl flex items-center justify-center mb-3 shield-glow relative overflow-hidden cursor-pointer shadow-lg group"
          id="brand-shield"
          title="SafaiWatch Civic Shield"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00855d] to-transparent opacity-60"></div>
          <Shield className="w-8 h-8 text-[#85f8c4] z-10 drop-shadow-[0_0_8px_rgba(133,248,196,0.8)] transition-transform duration-300 group-hover:scale-110" />
        </Link>

        <h1 className="font-['Hanken_Grotesk'] text-3xl font-extrabold tracking-tight text-[#131b2e] mb-1">
          SafaiWatch Hub
        </h1>
        <h2 className="font-['Hanken_Grotesk'] text-sm font-semibold text-[#006948] mb-1 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#006948]" />
          <span>Verified Civic Action &amp; Locality Sanitation</span>
        </h2>
        <p className="text-xs text-[#3d4a42] max-w-[340px] leading-relaxed">
          {step === "email"
            ? mode === "sign-in"
              ? "Enter your registered email address to sign into your ward account."
              : "Register your email to join your local ward's civic coordination network."
            : "Enter the 6-digit security code sent to your email."}
        </p>
      </header>

      {/* Main Form Container */}
      <main className="flex-grow flex flex-col items-center w-full max-w-md mx-auto justify-center my-3">
        {isAlreadySignedIn && currentUser ? (
          <div className="glass-card w-full rounded-[24px] p-6 mb-4 flex flex-col items-center text-center gap-4 relative z-10 border border-[#006948]/30 bg-white/95 shadow-xl animate-enter">
            <div className="w-14 h-14 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center border border-[#006948]/20 shadow-xs">
              <ShieldCheck className="w-7 h-7 text-[#006948]" />
            </div>

            <div>
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  isIncompleteAuth
                    ? "bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]"
                    : "bg-[#006948]/10 text-[#006948] border-[#006948]/20"
                }`}
              >
                {isIncompleteAuth ? "Incomplete Profile Authorization" : "Already Signed In"}
              </span>
              <h3 className="font-['Hanken_Grotesk'] text-xl font-extrabold text-[#131b2e] mt-1.5">
                {isIncompleteAuth
                  ? `OTP Verified (${currentUser.email || "User"})`
                  : `Welcome Back, ${currentUser.name || currentUser.username || "Civic Hero"}!`}
              </h3>
              <p className="text-xs text-[#6d7a72] mt-0.5 font-medium">
                {isIncompleteAuth
                  ? "Your email is verified, but profile onboarding details are pending."
                  : currentUser.email}
              </p>
            </div>

            <div className="w-full bg-[#f2f3ff] rounded-xl p-3.5 border border-[#bccac0]/30 text-xs flex flex-col gap-1.5 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[#6d7a72] font-semibold">Auth Status:</span>
                <span className="font-mono font-bold text-[#006948]">
                  {isIncompleteAuth ? "Incomplete (Pending Onboarding)" : "Normal (Profile Completed)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6d7a72] font-semibold">Cookie Token:</span>
                <span className="font-mono font-bold text-[#006948]">Active JWT Cookie</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full pt-1">
              {isIncompleteAuth ? (
                <Link
                  href={`/onboarding?email=${encodeURIComponent(currentUser.email || "")}`}
                  className="btn-shimmer-hover w-full h-[48px] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-[#006948] hover:bg-[#00855d] text-white shadow-md transition-all cursor-pointer"
                >
                  <span>Continue Onboarding Form</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/"
                    className="btn-shimmer-hover w-full h-[48px] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-[#006948] hover:bg-[#00855d] text-white shadow-md transition-all cursor-pointer"
                  >
                    <span>Go to Home Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/feed"
                    className="w-full h-[44px] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-white hover:bg-[#f2f3ff] text-[#131b2e] border border-[#bccac0]/60 transition-all cursor-pointer"
                  >
                    <span>Enter Civic Feed</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={async () => {
                  await authApi.signOut();
                  setIsAlreadySignedIn(false);
                  setIsIncompleteAuth(false);
                  setCurrentUser(null);
                }}
                className="w-full h-[40px] text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-all cursor-pointer"
              >
                Sign Out &amp; Switch Account
              </button>
            </div>
          </div>
        ) : (
          /* Auth Glass Card */
          <div className="glass-card w-full rounded-[24px] p-6 mb-4 flex flex-col gap-5 relative z-10 border border-[#E2E7FF] bg-white/95 shadow-lg">
          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          {step === "email" && (
            <div className="flex bg-[#f2f3ff] p-1 rounded-xl border border-[#bccac0]/30">
              <button
                type="button"
                onClick={() => handleModeSwitch("sign-in")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === "sign-in"
                    ? "bg-[#006948] text-white shadow-sm"
                    : "text-[#6d7a72] hover:text-[#131b2e]"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch("sign-up")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === "sign-up"
                    ? "bg-[#006948] text-white shadow-sm"
                    : "text-[#6d7a72] hover:text-[#131b2e]"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Error Message Toast */}
          {errorMessage && (
            <div className="bg-[#ffdad6]/60 border border-[#ba1a1a]/40 text-[#93000a] text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-start gap-2 animate-enter">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === "email" ? (
            /* STEP 1: EMAIL ENTRY FORM */
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#006948]" />
                  <span>{mode === "sign-in" ? "Email Sign-In" : "Email Registration"}</span>
                </h3>
                <span className="font-mono text-[10px] text-[#6d7a72] uppercase font-bold">
                  Step 1 of 2
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="identity-input"
                    className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#6d7a72]" />
                    <span>Email Address</span>
                  </label>

                  {/* Input Wrapper */}
                  <div className="flex items-center h-[52px] bg-[#f2f3ff] rounded-xl border border-[#bccac0]/50 focus-within:border-[#006948] focus-within:ring-2 focus-within:ring-[#006948]/20 transition-all overflow-hidden px-4 group">
                    <Mail className="w-4 h-4 text-[#6d7a72] group-focus-within:text-[#006948] transition-colors mr-3 shrink-0" />

                    <input
                      ref={emailInputRef}
                      id="identity-input"
                      type="email"
                      autoComplete="email"
                      placeholder="your.email@domain.com"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full h-full bg-transparent border-none outline-none focus:outline-none text-sm font-medium text-[#131b2e] placeholder:text-[#6d7a72]/60"
                    />

                    {inputValue && (
                      <button
                        type="button"
                        onClick={handleClearEmail}
                        className="text-[#6d7a72] hover:text-[#131b2e] transition-colors p-1 shrink-0"
                        title="Clear input"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-shimmer-hover w-full h-[50px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 diffuse-shadow bg-[#006948] hover:bg-[#00855d] text-white active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === "sign-in" ? "Send Sign-In OTP" : "Send Verification OTP"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Or Divider */}
              <div className="flex items-center gap-3 my-0.5">
                <div className="h-px bg-[#bccac0]/40 flex-1"></div>
                <span className="text-xs text-[#6d7a72] font-medium uppercase tracking-wider">
                  or continue with
                </span>
                <div className="h-px bg-[#bccac0]/40 flex-1"></div>
              </div>

              {/* Social Sign-in Options */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="group w-full h-[46px] bg-white border border-[#e2e7ff] hover:border-[#006948]/50 hover:bg-[#f2f3ff] rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.97] hover:shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-semibold text-[#131b2e]">Continue with Google OAuth</span>
              </button>
            </>
          ) : (
            /* STEP 2: OTP VERIFICATION UI */
            <>
              {/* OTP Top Bar with Back */}
              <div className="flex items-center justify-between pb-1 border-b border-[#bccac0]/30">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="group text-xs text-[#6d7a72] hover:text-[#006948] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  <span>Change Email</span>
                </button>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#006948]/10 text-[#006948] border border-[#006948]/20 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  <span>Security OTP</span>
                </span>
              </div>

              {/* Recipient Details */}
              <div className="bg-[#f2f3ff] rounded-xl p-3 flex items-center justify-between border border-[#bccac0]/40">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-[#006948]/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#006948]" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-mono text-[#6d7a72] uppercase font-bold">
                      Sent OTP To
                    </span>
                    <span className="text-xs font-semibold text-[#131b2e] truncate">
                      {inputValue}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-[#006948] hover:text-[#00855d] p-1 rounded-lg hover:bg-white/60 transition-all shrink-0 cursor-pointer"
                  title="Edit email"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Resend Success Toast */}
              {resendSuccess && (
                <div className="bg-[#85f8c4]/30 border border-[#006948]/40 text-[#002114] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 animate-enter">
                  <CheckCircle2 className="w-4 h-4 text-[#006948]" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-[#6d7a72] uppercase tracking-wider font-semibold">
                      Enter 6-Digit Code
                    </label>
                  </div>

                  {/* 6-Digit PIN Grid */}
                  <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-full h-12 text-center text-lg font-mono font-bold rounded-xl border outline-none transition-all ${
                          digit
                            ? "border-[#006948] bg-white text-[#131b2e] ring-2 ring-[#006948]/20"
                            : "border-[#bccac0]/60 bg-[#f2f3ff] text-[#131b2e] focus:bg-white focus:border-[#006948] focus:ring-2 focus:ring-[#006948]/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Countdown Timer */}
                <div className="flex items-center justify-between text-xs text-[#6d7a72] font-medium pt-1">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-mono font-semibold text-[#006948] flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resend in 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[#006948] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                {/* Verify Action Button */}
                <button
                  type="submit"
                  disabled={isVerifying || verifySuccess}
                  className={`btn-shimmer-hover w-full h-[50px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 diffuse-shadow transition-all cursor-pointer ${
                    verifySuccess
                      ? "bg-[#00855d] text-white"
                      : "bg-[#006948] hover:bg-[#00855d] text-white"
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Code...</span>
                    </>
                  ) : verifySuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#85f8c4]" />
                      <span>Verification Successful! Proceeding...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === "sign-up" ? "Verify OTP & Continue Setup" : "Verify OTP & Sign In"}</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        )}
      </main>

      {/* Footer Section */}
      <footer className="w-full max-w-md mx-auto pt-2 pb-4 flex flex-col items-center gap-3">
        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[#3d4a42] font-medium cursor-default">
            <Lock className="w-3.5 h-3.5 text-[#006948]" />
            <span>Secure Cookie Auth</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#3d4a42] font-medium cursor-default">
            <MapPin className="w-3.5 h-3.5 text-[#006948]" />
            <span>GPS Ward Verified</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#3d4a42] font-medium cursor-default">
            <Leaf className="w-3.5 h-3.5 text-[#006948]" />
            <span>Community Trust</span>
          </div>
        </div>

        <p className="font-mono text-[10px] text-[#bccac0] text-center">
          © 2026 SafaiWatch Civic Hub • Backend Express Connected
        </p>
      </footer>

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
