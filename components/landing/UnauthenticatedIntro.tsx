"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Camera,
  Calendar,
  HeartHandshake,
  Map as MapIcon,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  MapPin,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  Layers,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Sliders,
  Globe2,
  Radio,
  Eye,
  Menu,
  X,
  Compass,
  Navigation,
  Shield,
  Star,
  Activity,
  UserCheck,
  Crosshair,
  Share2,
  ThumbsUp,
  Target,
  Smartphone,
  Truck,
  Building2,
  Sparkle,
} from "lucide-react";
import SafaiWatchLogo from "@/components/SafaiWatchLogo";

export default function UnauthenticatedIntro() {
  // Mobile menu open/close
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero interactive action console mode: "spot" | "drive" | "radar"
  const [heroMode, setHeroMode] = useState<"spot" | "drive" | "radar">("spot");

  // Selected Ward in Hyperlocal Search
  const [selectedWardQuery, setSelectedWardQuery] = useState("Connaught Place • Ward 14");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectedMsg, setLocationDetectedMsg] = useState<string | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#location-picker-container")) {
        setLocationDropdownOpen(false);
      }
    };
    if (locationDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [locationDropdownOpen]);

  // Interactive Live Hub Showcase Tab
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<
    "radar" | "verification" | "drives" | "karma"
  >("radar");

  // Role showcase tab: "civilian" | "coordinator" | "municipal"
  const [activeRoleTab, setActiveRoleTab] = useState<
    "civilian" | "coordinator" | "municipal"
  >("civilian");

  // Interactive Before/After slider position (0 - 100)
  const [sliderPosition, setSliderPosition] = useState(52);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Selected mock spot in the radar demo
  const [selectedRadarSpot, setSelectedRadarSpot] = useState<number>(0);

  // Live rotating ticker index
  const [tickerIndex, setTickerIndex] = useState(0);

  // Interactive Impact Calculator State
  const [calcCleanupsPerMonth, setCalcCleanupsPerMonth] = useState<number>(3);
  const [calcVolunteers, setCalcVolunteers] = useState<number>(8);

  // FAQ Accordion Active Index
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Popular quick-select ward presets
  const popularWards = [
    { name: "Ward 14 • Connaught Place, New Delhi", short: "Ward 14 (CP)", score: "94.2% A+", activeRangers: 18, activeDrives: 3 },
    { name: "Ward 82 • Indiranagar, Bengaluru", short: "Ward 82 (Blr)", score: "96.5% A+", activeRangers: 24, activeDrives: 5 },
    { name: "Ward 12 • Bandra West, Mumbai", short: "Ward 12 (Mum)", score: "91.8% A", activeRangers: 15, activeDrives: 2 },
    { name: "Ward 35 • Sector 14, Gurugram", short: "Ward 35 (Ggn)", score: "89.4% B+", activeRangers: 11, activeDrives: 1 },
  ];

  // Live civic activity stream ticker
  const liveActivities = [
    { user: "Rohan K. (Drive Lead)", action: "completed cleanup in Ward 14", impact: "52 kg waste cleared", time: "2m ago", badge: "Verified ✓" },
    { user: "Priya S. (Civic Ranger)", action: "reported critical hotspot in Sector 4", impact: "AI confidence 99.1%", time: "5m ago", badge: "Hotspot Logged" },
    { user: "Karan M. (Volunteer)", action: "earned +100 XP & Ward Guardian badge", impact: "Cleanliness Streak: 5 drives", time: "8m ago", badge: "Badge Unlocked" },
    { user: "Ward 82 Squad (14 Rangers)", action: "dispatched cleanup gear to Lakefront", impact: "Turn-by-turn route active", time: "12m ago", badge: "Squad Active" },
  ];

  // Periodic ticker rotation
  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveActivities.length);
    }, 4000);
    return () => clearInterval(tickerTimer);
  }, []);

  // Periodic radar spot cycling
  useEffect(() => {
    const radarTimer = setInterval(() => {
      setSelectedRadarSpot((prev) => (prev + 1) % radarSpots.length);
    }, 5000);
    return () => clearInterval(radarTimer);
  }, []);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationDetectedMsg(null);
    setTimeout(() => {
      setIsDetectingLocation(false);
      setSelectedWardQuery("Ward 14 • Connaught Place, New Delhi");
      setLocationDetectedMsg("📍 GPS Ward Locked: Ward 14 • Accuracy ±3m");
      setTimeout(() => setLocationDetectedMsg(null), 4000);
    }, 900);
  };

  const radarSpots = [
    {
      id: 1,
      title: "Illegal Plastic Accumulation",
      ward: "Ward 14 • Connaught Market",
      type: "Plastic Debris",
      severity: "High",
      severityColor: "bg-rose-500",
      coords: "28.6315° N, 77.2167° E",
      reportedBy: "Aarav S. (Civic Ranger)",
      aiScore: "98.4% Match",
      status: "Dispatched",
      volunteersCount: 4,
      eta: "14 mins",
      leadAvatar: "AS",
      leadRating: "4.9 ★",
    },
    {
      id: 2,
      title: "Construction Debris & Dry Waste",
      ward: "Ward 08 • Sector 4 Greenbelt",
      type: "Construction Waste",
      severity: "Medium",
      severityColor: "bg-amber-500",
      coords: "28.6180° N, 77.2090° E",
      reportedBy: "Priya M. (Resident)",
      aiScore: "96.1% Match",
      status: "Assigned",
      volunteersCount: 7,
      eta: "28 mins",
      leadAvatar: "PM",
      leadRating: "4.8 ★",
    },
    {
      id: 3,
      title: "Overflowing Civic Bins",
      ward: "Ward 22 • Lakefront Promenade",
      type: "Organic & Mixed",
      severity: "Critical",
      severityColor: "bg-red-600",
      coords: "28.6420° N, 77.2280° E",
      reportedBy: "Rohan K. (Drive Lead)",
      aiScore: "99.2% Match",
      status: "In Cleanup",
      volunteersCount: 12,
      eta: "Squad on Site",
      leadAvatar: "RK",
      leadRating: "5.0 ★",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Spot & Geotag in 5 Seconds",
      tagline: "Instant AI Optical Lock",
      desc: "Point your smartphone camera at municipal waste. SafaiWatch pins the exact GPS polygon, parses tamper-proof metadata, and computes waste severity with anti-duplicate validation.",
      highlight: "Zero paperwork • Auto-polygon assignment",
      icon: Camera,
      color: "from-emerald-600 to-teal-700",
      actionText: "Report Spot",
    },
    {
      num: "02",
      title: "Mobilize Drive Squads & Gear",
      tagline: "On-Demand Squad Dispatch",
      desc: "Certified Ward Coordinators group adjacent spots into weekend drives. Volunteers receive squad routes, safety supply lists (gloves, bins, rakes), and turn-by-turn navigation.",
      highlight: "Real-time squad roster & safety protocols",
      icon: Users,
      color: "from-teal-600 to-cyan-700",
      actionText: "Join Squad",
    },
    {
      num: "03",
      title: "AI Dual-Photo Audit & Karma XP",
      tagline: "Cryptographic Cleanliness Proof",
      desc: "Post cleanup, snap the 'After' photo. Our dual-camera neural vision engine checks angle consistency and debris removal before minting Karma XP and boosting ward health indices.",
      highlight: "Zero false claims • Verified XP rewards",
      icon: Award,
      color: "from-emerald-700 to-green-900",
      actionText: "Earn Karma",
    },
  ];

  const faqs = [
    {
      q: "How does the AI Photo Verification work?",
      a: "SafaiWatch utilizes computer vision models trained specifically on municipal waste and urban cleanliness benchmarks. It compares the initial geotagged report photo with the post-cleanup submission, verifying optical angles, lighting consistency, and genuine debris removal while flagging stock photos or digitally altered images.",
    },
    {
      q: "Is SafaiWatch free for residents and volunteer groups?",
      a: "Yes! SafaiWatch is 100% free for all citizens, resident welfare associations (RWAs), youth clubs, and environmental volunteer groups. You can report spots, join local drives, track your civic karma, and climb the leaderboard without any subscription fees.",
    },
    {
      q: "What is the difference between a Civilian and a Drive Coordinator?",
      a: "Civilians can report waste spots anywhere within their verified GPS perimeter, join public cleanup events, and earn Karma XP. Drive Coordinators can schedule official neighborhood drives, manage volunteer rosters, assign squads to critical hotspots, and submit final cleanup completions.",
    },
    {
      q: "Can local municipal bodies and sanitation contractors use this platform?",
      a: "SafaiWatch provides open data heatmaps, exportable ward cleanliness indices, and real-time hotspot resolution timestamps designed to assist urban local bodies (ULBs) and sanitation departments in allocating manpower efficiently.",
    },
    {
      q: "How do Karma Points and Badges translate into real-world impact?",
      a: "Karma Points measure your verified environmental contributions. Top-ranking Ward Rangers earn civic commendation certificates, special badges, and recognition on the city-wide transparency leaderboard.",
    },
  ];

  // Calculations for impact widget
  const wasteDivertedKg = Math.round(calcCleanupsPerMonth * calcVolunteers * 18.5);
  const karmaEarned = calcCleanupsPerMonth * calcVolunteers * 150 + 200;
  const wardIndexBoost = (calcCleanupsPerMonth * 1.8 + calcVolunteers * 0.4).toFixed(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#0F172A] antialiased selection:bg-[#85f8c4] selection:text-[#002114] overflow-x-hidden font-sans">
      {/* Background Soft Glow & Grid Accent */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-[#85f8c4]/30 via-[#006948]/12 to-transparent blur-3xl rounded-full opacity-80"></div>
        <div className="absolute top-[35%] -left-48 w-[600px] h-[600px] bg-[#00855d]/10 blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[65%] -right-48 w-[650px] h-[650px] bg-[#85f8c4]/20 blur-[150px] rounded-full pointer-events-none"></div>
      </div>

      {/* ============================================================
          TOP STICKY NAVBAR (SWIGGY / UBER CONSUMER APP AESTHETICS)
          ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Brand Logo & Swiggy-style Interactive Location Selector */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/" className="cursor-pointer group flex items-center shrink-0">
              <SafaiWatchLogo variant="full" size="sm" animated={true} />
            </Link>

            {/* Subtle Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 shrink-0" />

            {/* Swiggy / Uber Hyperlocal Ward Dropdown Trigger */}
            <div id="location-picker-container" className="relative hidden md:block">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocationDropdownOpen(!locationDropdownOpen);
                }}
                className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-left cursor-pointer ${
                  locationDropdownOpen
                    ? "bg-slate-100 border-slate-300 ring-2 ring-emerald-500/20"
                    : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 hover:border-slate-300"
                }`}
                title="Select civic ward or detect GPS location"
              >
                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="flex flex-col leading-tight min-w-0 max-w-[150px] lg:max-w-[180px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    Active Ward
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${locationDropdownOpen ? "rotate-180 text-emerald-600" : ""}`} />
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {selectedWardQuery.split("•")[0]?.trim() || selectedWardQuery}
                  </span>
                </div>
              </button>

              {/* Swiggy-style Location Selection Popover Card */}
              {locationDropdownOpen && (
                <div className="absolute top-full left-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Select Civic Ward</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocationDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* GPS Auto-detect Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDetectLocation();
                      setLocationDropdownOpen(false);
                    }}
                    disabled={isDetectingLocation}
                    className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Navigation className={`w-4 h-4 ${isDetectingLocation ? "animate-spin" : ""}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-emerald-950">
                        {isDetectingLocation ? "Locking GPS Coordinates..." : "Use Current GPS Location"}
                      </div>
                      <div className="text-[11px] text-emerald-700">Auto-detect ward polygon & civic unit</div>
                    </div>
                  </button>

                  {/* Popular Wards List */}
                  <div className="mt-3.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Popular Monitored Wards
                    </span>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {popularWards.map((w, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedWardQuery(w.name);
                            setLocationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            selectedWardQuery.includes(w.short) || selectedWardQuery === w.name
                              ? "bg-emerald-50/60 border border-emerald-300 text-slate-900 font-semibold"
                              : "hover:bg-slate-50 border border-transparent text-slate-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="truncate text-xs">
                              <div className="font-semibold text-slate-800">{w.name.split("•")[0]?.trim()}</div>
                              <div className="text-[11px] text-slate-500 truncate">{w.name.split("•")[1]?.trim()}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 border border-emerald-200 shrink-0 ml-2">
                            {w.score}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop Nav Links (Guaranteed whitespace-nowrap & sleek pill hover) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] xl:text-sm font-semibold text-slate-600 shrink-0">
            <a
              href="#services"
              className="px-3 py-1.5 rounded-lg hover:text-emerald-700 hover:bg-emerald-50/70 transition-all whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#live-radar"
              className="px-3 py-1.5 rounded-lg hover:text-emerald-700 hover:bg-emerald-50/70 transition-all whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Radar</span>
            </a>
            <a
              href="#how-it-works"
              className="px-3 py-1.5 rounded-lg hover:text-emerald-700 hover:bg-emerald-50/70 transition-all whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#roles"
              className="px-3 py-1.5 rounded-lg hover:text-emerald-700 hover:bg-emerald-50/70 transition-all whitespace-nowrap shrink-0"
            >
              Roles
            </a>
            <a
              href="#impact"
              className="hidden xl:inline-block px-3 py-1.5 rounded-lg hover:text-emerald-700 hover:bg-emerald-50/70 transition-all whitespace-nowrap shrink-0"
            >
              Impact Calc
            </a>
            <a
              href="#faq"
              className="hidden xl:inline-block px-3 py-1.5 rounded-lg hover:text-emerald-700 hover:bg-emerald-50/70 transition-all whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons (Sign In + Primary CTA) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="group relative px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-xl">
            <div
              onClick={() => {
                handleDetectLocation();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{selectedWardQuery}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">
                Auto Detect
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700 pt-1">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-center border border-slate-100 whitespace-nowrap"
              >
                Services
              </a>
              <a
                href="#live-radar"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-center border border-slate-100 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Radar</span>
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-center border border-slate-100 whitespace-nowrap"
              >
                How It Works
              </a>
              <a
                href="#roles"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-center border border-slate-100 whitespace-nowrap"
              >
                Roles
              </a>
              <a
                href="#impact"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-center border border-slate-100 whitespace-nowrap"
              >
                Impact Calc
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-center border border-slate-100 whitespace-nowrap"
              >
                FAQ
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Get Started / Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN BODY CONTENT */}
      <main className="flex-grow z-10">
        {/* ============================================================
            HERO SECTION (UBER / SWIGGY SIGNATURE DOCK + LIVE HUD)
            ============================================================ */}
        <section className="relative pt-8 sm:pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Top Live Ticker Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-[#85f8c4] px-4 py-1.5 rounded-full shadow-xs text-xs font-semibold text-[#005137]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006948]"></span>
              </span>
              <span>
                <strong>LIVE CIVIC NETWORK:</strong> 1,420+ Wards Monitored • 99.4% AI Verification Accuracy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Uber/Swiggy-style Hero & Booking Card */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 bg-[#85f8c4]/30 px-3.5 py-1.5 rounded-full border border-[#006948]/20 text-[#006948] font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
                <span>On-Demand Civic Action Platform</span>
              </div>

              {/* Bold High-Impact Headline */}
              <h1 className="font-['Hanken_Grotesk'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                Clean Your City{" "}
                <span className="bg-gradient-to-r from-[#006948] via-[#00855d] to-[#005137] bg-clip-text text-transparent">
                  With a Single Tap.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#334155] leading-relaxed max-w-2xl font-normal">
                Geotagged waste spotting, rapid cleanup squad dispatch, and anti-fraud AI verification — built with the speed, transparency, and reliability of your favorite ride &amp; delivery apps.
              </p>

              {/* SWIGGY / UBER STYLE ACTION CONSOLE DOCK */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xl shadow-slate-200/50 space-y-4">
                {/* 3 Action Tabs: Spot Waste | Join Squad | Ward Radar */}
                <div className="grid grid-cols-3 gap-1.5 bg-[#F1F5F9] p-1.5 rounded-2xl">
                  <button
                    onClick={() => setHeroMode("spot")}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      heroMode === "spot"
                        ? "bg-white text-[#006948] shadow-sm font-extrabold"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Camera className="w-4 h-4 text-[#006948]" />
                    <span className="truncate">Spot Waste</span>
                  </button>

                  <button
                    onClick={() => setHeroMode("drive")}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      heroMode === "drive"
                        ? "bg-white text-[#006948] shadow-sm font-extrabold"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-[#006948]" />
                    <span className="truncate">Join Squad</span>
                  </button>

                  <button
                    onClick={() => setHeroMode("radar")}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      heroMode === "radar"
                        ? "bg-white text-[#006948] shadow-sm font-extrabold"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Radio className="w-4 h-4 text-[#006948]" />
                    <span className="truncate">Ward Radar</span>
                  </button>
                </div>

                {/* Hyperlocal Ward Search Input Bar (Swiggy / Uber style) */}
                <div className="space-y-2">
                  <div className="relative flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-1.5 focus-within:border-[#006948] focus-within:ring-2 focus-within:ring-[#006948]/15 transition-all">
                    <div className="pl-3 pr-2 text-[#006948]">
                      <MapPin className="w-5 h-5 text-[#006948]" />
                    </div>
                    <input
                      type="text"
                      value={selectedWardQuery}
                      onChange={(e) => setSelectedWardQuery(e.target.value)}
                      placeholder="Enter your ward, colony, or landmark..."
                      className="w-full bg-transparent text-sm font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none py-2"
                    />
                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="shrink-0 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#006948] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isDetectingLocation ? "animate-spin text-[#006948]" : ""}`} />
                      <span className="hidden sm:inline">GPS Lock</span>
                    </button>
                  </div>

                  {locationDetectedMsg && (
                    <div className="text-[11px] font-bold text-[#006948] flex items-center gap-1 pl-2 animate-enter">
                      <span>✓</span>
                      <span>{locationDetectedMsg}</span>
                    </div>
                  )}

                  {/* Popular Ward Quick Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[11px] font-semibold text-[#64748B] mr-1">Popular:</span>
                    {popularWards.map((w, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedWardQuery(w.name)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedWardQuery === w.name
                            ? "bg-[#006948] text-white shadow-2xs"
                            : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155]"
                        }`}
                      >
                        {w.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button that adapts to chosen mode */}
                <div className="pt-1">
                  <Link
                    href="/login"
                    className="w-full py-4 px-6 bg-[#006948] hover:bg-[#00855d] text-white font-['Hanken_Grotesk'] text-base font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#006948]/25 hover:shadow-xl transition-all duration-300 active:scale-[0.99] cursor-pointer group"
                  >
                    {heroMode === "spot" && (
                      <>
                        <Camera className="w-5 h-5 text-[#85f8c4]" />
                        <span>Open Camera &amp; Report Waste Spot in 5s</span>
                      </>
                    )}
                    {heroMode === "drive" && (
                      <>
                        <Users className="w-5 h-5 text-[#85f8c4]" />
                        <span>Find Cleanup Drives in {selectedWardQuery.split("•")[0].trim()}</span>
                      </>
                    )}
                    {heroMode === "radar" && (
                      <>
                        <Radio className="w-5 h-5 text-[#85f8c4] animate-pulse" />
                        <span>View Live Ward Heatmap &amp; Hotspots</span>
                      </>
                    )}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>

                {/* Micro Metrics Strip inside Console */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Spot Time</div>
                    <div className="text-xs font-extrabold text-[#006948]">5 Seconds</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">AI Audit</div>
                    <div className="text-xs font-extrabold text-[#006948]">99.4% Dual-Cam</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Avg Response</div>
                    <div className="text-xs font-extrabold text-slate-900">&lt; 2.4 Hours</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-medium">Karma Reward</div>
                    <div className="text-xs font-extrabold text-[#006948]">+100 XP / Spot</div>
                  </div>
                </div>
              </div>

              {/* User Trust & Social Proof Bar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-start gap-4 text-xs text-[#64748B]">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center border-2 border-white text-[11px] shadow-xs">
                    AS
                  </div>
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center border-2 border-white text-[11px] shadow-xs">
                    PM
                  </div>
                  <div className="w-9 h-9 rounded-full bg-emerald-900 text-white font-bold flex items-center justify-center border-2 border-white text-[11px] shadow-xs">
                    RK
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#85f8c4] text-[#002114] font-bold flex items-center justify-center border-2 border-white text-[10px] shadow-xs">
                    +35k
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    {"★".repeat(5)}
                    <span className="text-[#0F172A] font-extrabold ml-1">4.9 / 5</span>
                  </div>
                  <p className="text-[#64748B] font-medium">
                    Trusted by 35,000+ residents, drive leads &amp; municipal RWAs
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Uber/Ola-Inspired "Live City Dispatch & Radar HUD" */}
            <div className="lg:col-span-5">
              <div className="relative bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-2xl shadow-slate-300/40">
                {/* Floating Live Dispatch Badge */}
                <div className="absolute -top-3.5 right-6 bg-[#006948] text-white text-[11px] font-bold font-mono px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase">
                  <Radio className="w-3 h-3 text-[#85f8c4] animate-pulse" />
                  <span>Real-Time Ward Stream</span>
                </div>

                {/* HUD Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-mono font-bold text-slate-500 ml-1.5">
                      safaiwatch-hub://live-ward-14
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#006948] bg-[#006948]/10 px-2 py-0.5 rounded-md font-mono">
                    LIVE DISPATCH
                  </span>
                </div>

                {/* Simulated Radar Map Viewport (Ola / Uber Map style) */}
                <div className="relative bg-[#0F172A] rounded-2xl border border-slate-800 p-4 overflow-hidden mb-4">
                  {/* Neon Grid Lines */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "radial-gradient(#85f8c4 1px, transparent 1px), radial-gradient(#85f8c4 1px, #0F172A 1px)",
                      backgroundSize: "24px 24px",
                      backgroundPosition: "0 0, 12px 12px",
                    }}
                  ></div>

                  {/* Ward Road Network Map */}
                  <svg
                    className="w-full h-40 relative z-0 opacity-80"
                    viewBox="0 0 320 160"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Road Arteries */}
                    <path d="M 10 40 Q 90 60 160 50 T 310 30" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 10 40 Q 90 60 160 50 T 310 30" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 40 140 Q 130 100 210 120 T 300 90" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 40 140 Q 130 100 210 120 T 300 90" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 160 10 L 160 150" stroke="#1E293B" strokeWidth="6" strokeDasharray="6 6" />
                    <path d="M 80 15 L 120 145" stroke="#334155" strokeWidth="3" />
                    <path d="M 230 15 L 200 145" stroke="#334155" strokeWidth="3" />

                    {/* Active Dispatch Route Polyline (Uber style route line) */}
                    <path
                      d="M 60 45 Q 110 55 160 80 T 250 45"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />

                    {/* Center Radar Scanner Circle */}
                    <circle cx="160" cy="80" r="45" stroke="#85f8c4" strokeOpacity="0.25" strokeWidth="1" />
                    <circle cx="160" cy="80" r="24" stroke="#85f8c4" strokeOpacity="0.4" strokeWidth="1" />
                    <circle cx="160" cy="80" r="7" fill="#85f8c4" />
                  </svg>

                  {/* Hotspot Pin 1 (High Plastic) */}
                  <button
                    onClick={() => setSelectedRadarSpot(0)}
                    className={`absolute top-8 left-16 p-2 rounded-full transition-all duration-300 cursor-pointer ${
                      selectedRadarSpot === 0
                        ? "bg-rose-500 scale-125 shadow-lg shadow-rose-500/80 ring-4 ring-rose-300/40"
                        : "bg-rose-500/90 hover:scale-110"
                    }`}
                    title="Spot #1: Plastic Accumulation"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Hotspot Pin 2 (Construction Waste) */}
                  <button
                    onClick={() => setSelectedRadarSpot(1)}
                    className={`absolute bottom-8 right-24 p-2 rounded-full transition-all duration-300 cursor-pointer ${
                      selectedRadarSpot === 1
                        ? "bg-amber-500 scale-125 shadow-lg shadow-amber-500/80 ring-4 ring-amber-300/40"
                        : "bg-amber-500/90 hover:scale-110"
                    }`}
                    title="Spot #2: Construction Debris"
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Hotspot Pin 3 (Civic Bins) */}
                  <button
                    onClick={() => setSelectedRadarSpot(2)}
                    className={`absolute top-10 right-14 p-2 rounded-full transition-all duration-300 cursor-pointer ${
                      selectedRadarSpot === 2
                        ? "bg-emerald-500 scale-125 shadow-lg shadow-emerald-500/80 ring-4 ring-emerald-300/40"
                        : "bg-emerald-500/90 hover:scale-110"
                    }`}
                    title="Spot #3: Overflowing Bins"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Top Left Live Status Chip */}
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold text-[#85f8c4] flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Ward 14: 3 Hotspots Active</span>
                  </div>

                  {/* Moving Volunteer Squad Marker (Uber driver car equivalent) */}
                  <div className="absolute bottom-3 left-3 bg-[#006948] text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-[#85f8c4]/30 shadow-xs">
                    <Truck className="w-3 h-3 text-[#85f8c4]" />
                    <span>Squad #4 Dispatched (ETA: 14m)</span>
                  </div>
                </div>

                {/* Hotspot Detail Card (Uber ride details card style) */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${radarSpots[selectedRadarSpot].severityColor}`}></span>
                        <h4 className="font-['Hanken_Grotesk'] text-sm font-bold text-[#0F172A]">
                          {radarSpots[selectedRadarSpot].title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                        {radarSpots[selectedRadarSpot].ward}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-[#85f8c4]/40 text-[#005137] px-2 py-0.5 rounded-md border border-[#006948]/20">
                      {radarSpots[selectedRadarSpot].aiScore}
                    </span>
                  </div>

                  {/* Hotspot Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/80 pt-2.5 mt-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Category &amp; Hazard</span>
                      <span className="font-semibold text-[#0F172A]">
                        {radarSpots[selectedRadarSpot].severity} • {radarSpots[selectedRadarSpot].type}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Volunteer Squad Lead</span>
                      <span className="font-semibold text-[#006948] flex items-center gap-1">
                        <span>{radarSpots[selectedRadarSpot].reportedBy}</span>
                        <span className="text-[10px] text-amber-500 font-bold">{radarSpots[selectedRadarSpot].leadRating}</span>
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action strip */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#006948]" />
                      <span>ETA: {radarSpots[selectedRadarSpot].eta}</span>
                    </span>

                    <Link
                      href="/login"
                      className="text-xs font-bold text-[#006948] hover:text-[#00855d] flex items-center gap-1 group py-1 px-2.5 rounded-lg bg-[#006948]/10 hover:bg-[#006948]/15 transition-all"
                    >
                      <span>Claim Spot</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Rotating Live Activity Feed (Swiggy Order Updates style) */}
                <div className="mt-3 bg-[#F1F5F9] p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition-all">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate text-slate-700">
                      <strong>{liveActivities[tickerIndex].user}:</strong> {liveActivities[tickerIndex].action} ({liveActivities[tickerIndex].impact})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                    {liveActivities[tickerIndex].time}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Stats Banner Bar (Uber / Swiggy Platform scale) */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <CheckCircle2 className="w-7 h-7 text-[#006948]" />
                <span>12,400+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#0F172A] font-bold mt-1.5">
                Verified Waste Spots Cleared
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                100% geotagged &amp; AI-audited
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4 border-l border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <Calendar className="w-7 h-7 text-[#006948]" />
                <span>850+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#0F172A] font-bold mt-1.5">
                Community Drives Organized
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                Across 14+ metro municipal wards
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4 border-l border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <Users className="w-7 h-7 text-[#006948]" />
                <span>35,000+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#0F172A] font-bold mt-1.5">
                Active Civic Volunteers
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                Civic Rangers &amp; Drive Leads
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4 border-l border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <Flame className="w-7 h-7 text-[#cc4900]" />
                <span>1.8M+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#0F172A] font-bold mt-1.5">
                Karma XP Distributed
              </span>
              <span className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                Gamified civic recognition
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            SWIGGY-INSPIRED "CORE SERVICES" BENTO GRID
            ============================================================ */}
        <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E8F0]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Civic Services At Your Fingertips
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-4 mb-3">
              Everything You Need to Reclaim Your Neighborhood
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Built with the on-demand simplicity of consumer apps and the rigor of forensic municipal audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service Card 1: 5-Second Spotting */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006948] border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-[#006948]" />
                </div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0F172A]">
                  5-Second Geotag Spotting
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Snap a photo on your phone. SafaiWatch locks device GPS, reads camera EXIF, and auto-detects waste category without cumbersome forms.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#006948] font-bold">±2m Accuracy</span>
                <Link href="/login" className="font-bold text-[#006948] flex items-center gap-1 group-hover:underline">
                  <span>Try It</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Service Card 2: Community Cleanup Drives */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00855d] border border-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-[#00855d]" />
                </div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0F172A]">
                  Volunteer Squad Dispatch
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Assemble neighborhood cleanup squads, coordinate route alerts, and requisition municipal gear (gloves, bags, rakes) with real-time RSVPs.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#00855d] font-bold">Turn-by-Turn GPS</span>
                <Link href="/login" className="font-bold text-[#00855d] flex items-center gap-1 group-hover:underline">
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Service Card 3: Neural Dual-Photo Audit */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-800 border border-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-cyan-800" />
                </div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0F172A]">
                  Neural Dual-Photo Audit
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Our anti-fraud vision model compares original vs cleaned photos. Optical consistency guarantees actual trash remediation before unlocking rewards.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-cyan-800 font-bold">99.4% Anti-Fraud</span>
                <Link href="/login" className="font-bold text-cyan-800 flex items-center gap-1 group-hover:underline">
                  <span>View Proof</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Service Card 4: Karma XP & Ranks */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0F172A]">
                  Civic Karma &amp; Tiers
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Earn XP for every verified cleanup. Climb the transparency leaderboard from Green Scout to Master Arbitrator with official commendations.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-amber-600 font-bold">4 Ranger Ranks</span>
                <Link href="/login" className="font-bold text-amber-600 flex items-center gap-1 group-hover:underline">
                  <span>Leaderboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            INTERACTIVE PLATFORM SIMULATOR / DEMO SECTION
            ============================================================ */}
        <section
          id="live-radar"
          className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E8F0]"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Interactive Engine
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-4 mb-3">
              Experience the SafaiWatch Core Live
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Toggle through the interactive modules below to test our real-time GPS tracking and neural photo audit sliders.
            </p>
          </div>

          {/* Interactive Tabs Header */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
            <button
              onClick={() => setActiveShowcaseTab("radar")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "radar"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-slate-50"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>1. Geotagged Spot Radar</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab("verification")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "verification"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>2. AI Photo Audit Slider</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab("drives")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "drives"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>3. Squad Dispatch Console</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab("karma")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "karma"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#475569] border border-[#CBD5E1] hover:bg-slate-50"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>4. Karma XP &amp; Leaderboards</span>
            </button>
          </div>

          {/* Interactive Tab Showcase Content */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-lg min-h-[440px] flex items-center justify-center">
            {/* TAB 1: RADAR */}
            {activeShowcaseTab === "radar" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Real-Time Waste Clustering</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                    Geotagged Accuracy Down to ±2 Meters
                  </h3>
                  <p className="text-sm text-[#334155] leading-relaxed">
                    When you report a spot, SafaiWatch locks your device GPS, parses the optical timestamp, and assigns it to the responsible ward polygon without manual form filling.
                  </p>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#0F172A]">
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#85f8c4]/40 text-[#006948] flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <span>Automatic duplicate detection prevents spam submissions</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#85f8c4]/40 text-[#006948] flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <span>Severity categorization (Critical, High, Medium, Low)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#85f8c4]/40 text-[#006948] flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <span>Instant notification to nearby ward volunteer squads</span>
                    </li>
                  </ul>

                  <div className="pt-3">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#006948] hover:text-[#00855d]"
                    >
                      <span>Sign in to test GPS reporting on your phone</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                    <span>ACTIVE RADAR CLUSTER</span>
                    <span className="text-[#006948] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>SCANNING GPS</span>
                    </span>
                  </div>

                  {radarSpots.map((spot, idx) => (
                    <div
                      key={spot.id}
                      onClick={() => setSelectedRadarSpot(idx)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedRadarSpot === idx
                          ? "bg-white border-[#006948] shadow-sm ring-2 ring-[#006948]/15"
                          : "bg-white/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${spot.severityColor}`}
                        >
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-['Hanken_Grotesk'] text-xs font-bold text-[#0F172A]">
                            {spot.title}
                          </div>
                          <div className="text-[11px] text-slate-500">{spot.ward}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold bg-[#85f8c4]/30 text-[#005137] px-2 py-0.5 rounded">
                          {spot.severity}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {spot.volunteersCount} rangers nearby
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: BEFORE/AFTER VERIFICATION */}
            {activeShowcaseTab === "verification" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-[#85f8c4]/30 text-[#006948] px-3 py-1 rounded-full text-xs font-bold font-mono border border-[#006948]/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Neural Photo Audit</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                    AI Verifies True Cleanliness Before Awarding XP
                  </h3>
                  <p className="text-sm text-[#334155] leading-relaxed">
                    Say goodbye to fraudulent claims. SafaiWatch compares the initial geotagged photo against post-cleanup submissions using optical forensics. Drag the slider to see it in action.
                  </p>

                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Visual Similarity Index:</span>
                      <span className="font-mono font-bold text-[#006948]">99.4% Location Match</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Debris Reduction Delta:</span>
                      <span className="font-mono font-bold text-[#006948]">-100% Waste Cleared</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Karma Reward:</span>
                      <span className="font-mono font-bold text-amber-600">+100 XP (Verified ✓)</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-slate-500 italic">
                      Tip: Drag the center slider handle or click anywhere to compare.
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  {/* Interactive Before & After Slider Box */}
                  <div
                    className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden shadow-md border border-[#E2E8F0] select-none cursor-ew-resize"
                    onMouseMove={(e) => {
                      if (isDraggingSlider) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                        setSliderPosition((x / rect.width) * 100);
                      }
                    }}
                    onMouseDown={() => setIsDraggingSlider(true)}
                    onMouseUp={() => setIsDraggingSlider(false)}
                    onTouchMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
                      setSliderPosition((x / rect.width) * 100);
                    }}
                  >
                    {/* Background: CLEAN "AFTER" VIEW */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 flex items-center justify-center p-6 text-white text-center">
                      <div className="space-y-3 z-0">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-[#85f8c4] flex items-center justify-center mx-auto border-2 border-[#85f8c4]/40">
                          <CheckCircle2 className="w-8 h-8 text-[#85f8c4]" />
                        </div>
                        <h4 className="font-['Hanken_Grotesk'] text-lg font-bold">
                          AFTER: Spotless Public Pavement
                        </h4>
                        <p className="text-xs text-emerald-100 max-w-xs mx-auto">
                          Remediated by Ward 14 Squad • 100% waste bagged &amp; municipal recycling routed.
                        </p>
                      </div>

                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-lg shadow-sm">
                        AFTER (CLEANED)
                      </div>
                    </div>

                    {/* Foreground: DIRTY "BEFORE" VIEW (Clipped by slider position) */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-slate-900 via-stone-800 to-amber-950 flex items-center justify-center p-6 text-white text-center overflow-hidden border-r-2 border-white"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <div className="space-y-3 z-0 w-80 shrink-0">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 text-rose-300 flex items-center justify-center mx-auto border-2 border-rose-400/40">
                          <AlertTriangle className="w-8 h-8 text-rose-300" />
                        </div>
                        <h4 className="font-['Hanken_Grotesk'] text-lg font-bold">
                          BEFORE: Overflowing Debris
                        </h4>
                        <p className="text-xs text-stone-300 max-w-xs mx-auto">
                          Reported by citizen • High severity mixed plastics blocking pedestrian access.
                        </p>
                      </div>

                      <div className="absolute top-4 left-4 bg-rose-600 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-lg shadow-sm">
                        BEFORE (REPORTED)
                      </div>
                    </div>

                    {/* Slider Drag Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full bg-white text-[#006948] shadow-xl flex items-center justify-center border-2 border-[#006948]">
                        <Sliders className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SQUAD DISPATCH */}
            {activeShowcaseTab === "drives" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Drive Coordinator Dispatch</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                    Turn Nearby Hotspots into Coordinated Weekend Drives
                  </h3>
                  <p className="text-sm text-[#334155] leading-relaxed">
                    Certified Coordinators group reported spots into actionable clean drives, send push alerts to nearby volunteers, and track real-time squad RSVPs.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <strong className="block text-slate-900 font-bold">Equipment Routing</strong>
                      <span className="text-slate-500">Bags, safety gloves &amp; rakes requisitioned</span>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <strong className="block text-slate-900 font-bold">Live Route Map</strong>
                      <span className="text-slate-500">Turn-by-turn squad navigation</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#006948] hover:text-[#00855d]"
                    >
                      <span>Sign in to register as a Drive Coordinator</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-[#006948]/10 text-[#006948] px-2.5 py-1 rounded-md">
                        DRIVE #412 • SUNDAY 8:00 AM
                      </span>
                      <span className="text-xs font-bold text-slate-900">12 / 15 Volunteers</span>
                    </div>

                    <h4 className="font-['Hanken_Grotesk'] font-bold text-sm text-[#0F172A]">
                      Connaught Outer Circle Greenery Cleanup
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#006948]" />
                      <span>Starting at Radial Road 3 • 4 Hotspots Covered</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                          A
                        </div>
                        <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                          R
                        </div>
                        <div className="w-6 h-6 rounded-full bg-cyan-700 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                          P
                        </div>
                        <div className="w-6 h-6 rounded-full bg-slate-400 text-white font-bold text-[9px] flex items-center justify-center border border-white">
                          +9
                        </div>
                      </div>

                      <Link
                        href="/login"
                        className="px-3 py-1.5 bg-[#006948] hover:bg-[#00855d] text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Join Drive
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KARMA & LEADERBOARD */}
            {activeShowcaseTab === "karma" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Gamified Civic Karma</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                    Climb the City Leaderboard &amp; Earn Official Ranger Badges
                  </h3>
                  <p className="text-sm text-[#334155] leading-relaxed">
                    Every verified report earns you +20 XP. Every completed cleanup awards +100 XP. Top volunteers are recognized on municipal commendation boards and unlock higher audit credentials.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">TIER 1</span>
                      <strong className="text-slate-900">Green Scout (0-500 XP)</strong>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">TIER 2</span>
                      <strong className="text-slate-900">Ward Guardian (500+ XP)</strong>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">TIER 3</span>
                      <strong className="text-[#006948]">Civic Ranger (2,000+ XP)</strong>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-mono block">TIER 4</span>
                      <strong className="text-amber-700">Master Arbitrator (5,000+)</strong>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500 mb-1">
                    <span>TOP WARD RANGERS</span>
                    <span className="text-amber-600 font-bold">LIVE RANKINGS</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center text-xs">
                        #1
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Aarav Sharma</div>
                        <div className="text-[10px] text-slate-500">Ward 14 • 48 Drives</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#006948]">4,250 XP</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-extrabold flex items-center justify-center text-xs">
                        #2
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Priya Mehra</div>
                        <div className="text-[10px] text-slate-500">Ward 82 • 36 Drives</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#006948]">3,680 XP</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center text-xs">
                        #3
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Rohan Kapoor</div>
                        <div className="text-[10px] text-slate-500">Ward 22 • 29 Drives</div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#006948]">2,940 XP</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            ROLE SELECTOR SECTION (UBER RIDER VS DRIVER STYLE)
            ============================================================ */}
        <section id="roles" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E8F0]">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Tailored Experiences
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-4 mb-3">
              Built for Everyone in the Ward
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Whether you are an active citizen, a community drive lead, or an urban local body administrator.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveRoleTab("civilian")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeRoleTab === "civilian"
                    ? "bg-white text-[#006948] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Civilian Resident
              </button>
              <button
                onClick={() => setActiveRoleTab("coordinator")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeRoleTab === "coordinator"
                    ? "bg-white text-[#006948] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Drive Coordinator
              </button>
              <button
                onClick={() => setActiveRoleTab("municipal")}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeRoleTab === "municipal"
                    ? "bg-white text-[#006948] shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3. Municipal / RWA Ops
              </button>
            </div>
          </div>

          {/* Role Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-md max-w-4xl mx-auto">
            {activeRoleTab === "civilian" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006948] flex items-center justify-center border border-emerald-100">
                    <Smartphone className="w-6 h-6 text-[#006948]" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#0F172A]">
                    For Concerned Residents &amp; Citizens
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Spot waste on your street, pin the location in seconds, join weekend volunteer cleanups, and watch your neighborhood transform while earning civic badges.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-center gap-2">✓ 5-second geotag photo reporting</li>
                    <li className="flex items-center gap-2">✓ Real-time status alerts when trash is cleared</li>
                    <li className="flex items-center gap-2">✓ Earn verified Karma XP for civic recognition</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="px-6 py-3 bg-[#006948] hover:bg-[#00855d] text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-sm"
                    >
                      <span>Join as Civilian</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 text-sm">Citizen Workflow:</div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    1. Spot illegal dumping on your morning commute
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    2. Take 1 photo with camera gesture verification
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    3. Local ward squad clears the hotspot on Saturday
                  </div>
                  <div className="p-3 bg-emerald-50 text-[#006948] rounded-xl border border-emerald-200 font-bold">
                    4. Verified completion notification +100 XP
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === "coordinator" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                    <Users className="w-6 h-6 text-teal-700" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#0F172A]">
                    For Community Drive Coordinators
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Lead environmental drives in your ward. Group clusters of reported waste into clean drives, mobilize volunteers, and submit verified completion proof.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-center gap-2">✓ Schedule and manage volunteer rosters</li>
                    <li className="flex items-center gap-2">✓ Requisition municipal gear &amp; disposal trucks</li>
                    <li className="flex items-center gap-2">✓ Lead the transparency leaderboard in your ward</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="px-6 py-3 bg-[#006948] hover:bg-[#00855d] text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-sm"
                    >
                      <span>Become a Drive Lead</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 text-sm">Coordinator Tools:</div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    • Cluster analysis of 5 nearest pending hotspots
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    • Broadcast route map &amp; safety instructions
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    • Direct submission of remediated 'After' proof
                  </div>
                  <div className="p-3 bg-teal-50 text-teal-800 rounded-xl border border-teal-200 font-bold">
                    • Multi-user Karma disbursement upon AI pass
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === "municipal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center border border-cyan-100">
                    <Building2 className="w-6 h-6 text-cyan-800" />
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl font-bold text-[#0F172A]">
                    For Municipal Bodies &amp; RWAs
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Gain unprecedented visibility into ward cleanliness indices. Access exportable heatmaps, identify chronic waste hotspots, and optimize contractor routes.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-center gap-2">✓ Open data cleanliness scorecards by ward polygon</li>
                    <li className="flex items-center gap-2">✓ Chronic illegal dumping heatmaps</li>
                    <li className="flex items-center gap-2">✓ SLA and turnaround-time verification dashboards</li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="px-6 py-3 bg-[#006948] hover:bg-[#00855d] text-white font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-sm"
                    >
                      <span>Explore Municipal Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 text-sm">Governance Capabilities:</div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    • Real-time ward cleanliness benchmark rating
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    • Manpower allocation based on AI optical heatmaps
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    • Dispute arbitration logs with full photo audit history
                  </div>
                  <div className="p-3 bg-cyan-50 text-cyan-900 rounded-xl border border-cyan-200 font-bold">
                    • Exportable compliance metrics for civic audits
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS SECTION (UBER 1-2-3 SIMPLICITY)
            ============================================================ */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E8F0]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Zero Complexity Workflow
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-4 mb-3">
              How SafaiWatch Works in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Designed for speed. No bureaucracy, no waiting weeks for municipal email tickets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st, i) => {
              const IconComp = st.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-7 border border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-extrabold text-[#006948]">
                        {st.num}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[#85f8c4]/30 text-[#005137] px-2.5 py-1 rounded-md">
                        {st.tagline}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006948] flex items-center justify-center">
                      <IconComp className="w-6 h-6 text-[#006948]" />
                    </div>

                    <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#0F172A]">
                      {st.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#006948]">
                      ✓ {st.highlight}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            INTERACTIVE IMPACT CALCULATOR (SWIGGY/UBER STYLE SLIDERS)
            ============================================================ */}
        <section id="impact" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E8F0]">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-8 sm:p-12 text-white shadow-xl">
            <div className="max-w-3xl mb-10">
              <span className="font-mono text-xs text-[#85f8c4] font-bold uppercase tracking-wider bg-[#85f8c4]/15 px-3.5 py-1.5 rounded-full border border-[#85f8c4]/30">
                Civic Impact Predictor
              </span>
              <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-2">
                Calculate Your Community's Cleanup Impact
              </h2>
              <p className="text-sm text-slate-300">
                Adjust cleanups and team size to see projected municipal debris diversion and Karma XP growth.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders on Left */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-200">
                      Cleanups Organized per Month
                    </label>
                    <span className="font-mono text-sm font-bold text-[#85f8c4] bg-slate-800 px-3 py-1 rounded-lg">
                      {calcCleanupsPerMonth} Drives
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={calcCleanupsPerMonth}
                    onChange={(e) => setCalcCleanupsPerMonth(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#85f8c4]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 drive</span>
                    <span>6 drives</span>
                    <span>12 drives</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-200">
                      Average Volunteers per Squad
                    </label>
                    <span className="font-mono text-sm font-bold text-[#85f8c4] bg-slate-800 px-3 py-1 rounded-lg">
                      {calcVolunteers} Volunteers
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    value={calcVolunteers}
                    onChange={(e) => setCalcVolunteers(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#85f8c4]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>2 rangers</span>
                    <span>15 rangers</span>
                    <span>30 rangers</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono pt-2">
                  * Calculated based on municipal audit averages: ~18.5kg debris diverted per volunteer drive.
                </div>
              </div>

              {/* Metrics Output on Right */}
              <div className="lg:col-span-5 bg-slate-800/80 rounded-2xl p-6 border border-slate-700 space-y-4">
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80">
                  <span className="text-[11px] text-slate-400 font-medium block">Debris Diverted per Month</span>
                  <span className="text-3xl font-extrabold text-[#85f8c4] font-['Hanken_Grotesk']">
                    {wasteDivertedKg.toLocaleString()} kg
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Equivalent to ~{Math.round(wasteDivertedKg * 42)} plastic bottles</span>
                </div>

                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80">
                  <span className="text-[11px] text-slate-400 font-medium block">Total Karma XP Pool</span>
                  <span className="text-2xl font-extrabold text-amber-400 font-['Hanken_Grotesk']">
                    +{karmaEarned.toLocaleString()} XP
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Disbursed automatically to squad</span>
                </div>

                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/80">
                  <span className="text-[11px] text-slate-400 font-medium block">Ward Health Index Boost</span>
                  <span className="text-xl font-bold text-white font-['Hanken_Grotesk']">
                    +{wardIndexBoost}% Overall Cleanliness Score
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FAQ SECTION
            ============================================================ */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#E2E8F0]">
          <div className="text-center mb-12">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Got Questions?
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#0F172A] mt-4 mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#475569]">
              Everything you need to know about reporting, volunteering, and AI verification.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-5 text-left font-['Hanken_Grotesk'] font-bold text-sm sm:text-base text-[#0F172A] flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform ${
                      activeFaq === i ? "rotate-180 text-[#006948]" : ""
                    }`}
                  />
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            FINAL HERO CTA BANNER (UBER / SWIGGY GRADE)
            ============================================================ */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#006948] via-[#005137] to-[#0A2E20] p-8 sm:p-14 text-white text-center shadow-xl">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="font-mono text-xs text-[#85f8c4] font-bold uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
                Ready To Clean Your City?
              </span>

              <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Transform Your Ward into a Spotless Ecosystem Today.
              </h2>

              <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
                Join 35,000+ citizens, drive coordinators, and RWAs making neighborhood cleanliness transparent, accountable, and rewarding.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-[#85f8c4] hover:bg-white text-[#002114] font-['Hanken_Grotesk'] text-base font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>Launch Dashboard Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-['Hanken_Grotesk'] text-base font-bold rounded-2xl border border-white/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5 text-[#85f8c4]" />
                  <span>Register Ward Territory</span>
                </Link>
              </div>

              <div className="pt-4 text-xs text-[#85f8c4]/80 font-mono">
                ✓ 100% Free for Citizens &amp; RWAs • Zero Subscription Fees • AI Verified
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER (SWIGGY / UBER STYLE CLEAN MODERN)
          ============================================================ */}
      <footer className="bg-white border-t border-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <SafaiWatchLogo variant="full" size="sm" animated={false} />
            <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
              SafaiWatch is an open civic action &amp; cleanliness network designed to empower residents, coordinators, and urban municipal bodies with real-time transparency and AI verification.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#0F172A] mb-3 uppercase tracking-wider font-mono text-[11px]">
              Platform Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#live-radar" className="hover:text-[#006948] transition-colors">
                  Geotagged Spot Radar
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#006948] transition-colors">
                  AI Photo Audit
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[#006948] transition-colors">
                  Volunteer Squad Dispatch
                </a>
              </li>
              <li>
                <a href="#impact" className="hover:text-[#006948] transition-colors">
                  Impact Calculator
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#0F172A] mb-3 uppercase tracking-wider font-mono text-[11px]">
              Civic Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-[#006948] transition-colors">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#006948] transition-colors">
                  Ward Territory Setup
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#006948] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SafaiWatch Civic Hub. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#006948] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational • Live Network Active</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
