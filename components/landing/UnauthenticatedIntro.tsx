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
} from "lucide-react";
import SafaiWatchLogo from "@/components/SafaiWatchLogo";

export default function UnauthenticatedIntro() {
  // Mobile menu open/close
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Live Hub Showcase Tab
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<
    "radar" | "verification" | "drives" | "karma"
  >("radar");

  // Interactive Before/After slider position (0 - 100)
  const [sliderPosition, setSliderPosition] = useState(55);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Selected mock spot in the radar demo
  const [selectedRadarSpot, setSelectedRadarSpot] = useState<number>(0);

  // Interactive Impact Calculator State
  const [calcCleanupsPerMonth, setCalcCleanupsPerMonth] = useState<number>(2);
  const [calcVolunteers, setCalcVolunteers] = useState<number>(6);

  // FAQ Accordion Active Index
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Selected How It Works Step
  const [activeStep, setActiveStep] = useState<number>(0);

  // Auto-cycle radar spots periodically if user isn't actively interacting
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedRadarSpot((prev) => (prev + 1) % radarSpots.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const radarSpots = [
    {
      id: 1,
      title: "Illegal Plastic Accumulation",
      ward: "Ward 14 • Connaught Market",
      type: "Plastic Debris",
      severity: "High",
      severityColor: "bg-red-500",
      coords: "28.6315° N, 77.2167° E",
      reportedBy: "Aarav S. (Civic Ranger)",
      aiScore: "98.4% Match",
      status: "Dispatched",
      volunteersCount: 4,
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
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Spot & Geotag in 5 Seconds",
      badge: "Instant AI GPS Lock",
      desc: "Snap a quick photo with your smartphone. SafaiWatch locks your exact GPS ward coordinates, extracts tamper-proof EXIF metadata, and uses AI vision to classify waste severity automatically.",
      highlight: "AI Vision duplicates check & auto-ward dispatch",
      icon: Camera,
      color: "from-emerald-500 to-teal-700",
    },
    {
      num: "02",
      title: "Mobilize Drive Squads & Tools",
      badge: "Ward Coordination Hub",
      desc: "Certified Ward Coordinators group nearby spots into focused weekend cleanup drives. Volunteers receive route alerts, required gear lists (gloves, bags, rakes), and safety protocols.",
      highlight: "Live volunteer roster & turn-by-turn routing",
      icon: Calendar,
      color: "from-teal-600 to-cyan-700",
    },
    {
      num: "03",
      title: "Verify with AI & Earn Karma",
      badge: "Zero-Fraud Civic Rewards",
      desc: "Upon cleanup completion, upload the 'After' photo. Our dual-camera neural audit model verifies actual trash removal, awards Karma XP, and upgrades your ward's public Cleanliness Index.",
      highlight: "+100 XP awarded instantly upon AI validation",
      icon: Award,
      color: "from-emerald-600 to-green-800",
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
    <div className="min-h-screen flex flex-col bg-[#FAF8FF] text-[#131b2e] antialiased selection:bg-[#85f8c4] selection:text-[#002114] overflow-x-hidden font-sans">
      {/* Background Ambient Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-gradient-to-b from-[#85f8c4]/25 via-[#006948]/10 to-transparent blur-3xl rounded-full opacity-70"></div>
        <div className="absolute top-[40%] -left-32 w-[500px] h-[500px] bg-[#00855d]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[65%] -right-32 w-[550px] h-[550px] bg-[#85f8c4]/15 blur-[140px] rounded-full pointer-events-none"></div>
      </div>

      {/* STICKY TOP NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[#E2E7FF]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="cursor-pointer group flex items-center gap-3">
            <SafaiWatchLogo variant="full" size="md" animated={true} />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#3d4a42]">
            <a
              href="#interactive-demo"
              className="hover:text-[#006948] transition-colors flex items-center gap-1.5 py-1"
            >
              <Zap className="w-4 h-4 text-[#006948]" />
              <span>Live Simulation</span>
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#006948] transition-colors flex items-center gap-1.5 py-1"
            >
              <Layers className="w-4 h-4 text-[#006948]" />
              <span>How It Works</span>
            </a>
            <a
              href="#modules"
              className="hover:text-[#006948] transition-colors flex items-center gap-1.5 py-1"
            >
              <Compass className="w-4 h-4 text-[#006948]" />
              <span>Modules</span>
            </a>
            <a
              href="#impact-calculator"
              className="hover:text-[#006948] transition-colors flex items-center gap-1.5 py-1"
            >
              <TrendingUp className="w-4 h-4 text-[#006948]" />
              <span>Impact Calculator</span>
            </a>
            <a
              href="#faq"
              className="hover:text-[#006948] transition-colors flex items-center gap-1.5 py-1"
            >
              <span>FAQ</span>
            </a>
          </nav>

          {/* Desktop Auth CTA Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-bold text-[#006948] hover:text-[#00855d] hover:bg-[#006948]/10 rounded-2xl transition-all cursor-pointer border border-[#006948]/20"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="relative group overflow-hidden px-6 py-2.5 bg-gradient-to-r from-[#006948] to-[#00855d] hover:from-[#005137] hover:to-[#006948] text-white text-sm font-bold rounded-2xl flex items-center gap-2 shadow-md shadow-[#006948]/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#006948]/30 active:scale-[0.98] cursor-pointer"
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold bg-[#006948] text-white rounded-xl"
            >
              Sign In
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#131b2e] hover:bg-[#E2E7FF]/50 rounded-xl transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#E2E7FF] bg-white/95 backdrop-blur-2xl px-6 py-6 space-y-4 shadow-xl animate-enter">
            <a
              href="#interactive-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-sm font-semibold text-[#131b2e] p-2 hover:bg-[#FAF8FF] rounded-xl"
            >
              <Zap className="w-4 h-4 text-[#006948]" />
              <span>Live Simulation</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-sm font-semibold text-[#131b2e] p-2 hover:bg-[#FAF8FF] rounded-xl"
            >
              <Layers className="w-4 h-4 text-[#006948]" />
              <span>How It Works</span>
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-sm font-semibold text-[#131b2e] p-2 hover:bg-[#FAF8FF] rounded-xl"
            >
              <Compass className="w-4 h-4 text-[#006948]" />
              <span>Platform Modules</span>
            </a>
            <a
              href="#impact-calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-sm font-semibold text-[#131b2e] p-2 hover:bg-[#FAF8FF] rounded-xl"
            >
              <TrendingUp className="w-4 h-4 text-[#006948]" />
              <span>Impact Calculator</span>
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-sm font-semibold text-[#131b2e] p-2 hover:bg-[#FAF8FF] rounded-xl"
            >
              <span>FAQ</span>
            </a>
            <div className="pt-4 border-t border-[#E2E7FF] flex flex-col gap-3">
              <Link
                href="/login"
                className="w-full py-3 text-center bg-[#006948] text-white font-bold rounded-xl text-sm"
              >
                Sign In to Civic Hub
              </Link>
              <Link
                href="/onboarding"
                className="w-full py-3 text-center bg-[#FAF8FF] text-[#131b2e] border border-[#E2E7FF] font-bold rounded-xl text-sm"
              >
                Set Up Ward Profile
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-grow z-10">
        {/* ============================================================
            HERO SECTION
            ============================================================ */}
        <section className="relative pt-8 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Live Activity Marquee Ticker */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md border border-[#85f8c4] px-4 py-2 rounded-full shadow-xs text-xs font-semibold text-[#005137]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00855d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006948]"></span>
              </span>
              <span>
                <strong>LIVE CIVIC NETWORK:</strong> 1,420+ Wards Monitored • 99.4% AI Verification
                Accuracy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#85f8c4]/30 px-3.5 py-1.5 rounded-full border border-[#006948]/20 text-[#006948] font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
                <span>Next-Gen Civic Action &amp; Cleanliness Grid</span>
              </div>

              <h1 className="font-['Hanken_Grotesk'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#131b2e] leading-[1.12]">
                Transform Your Ward into a{" "}
                <span className="bg-gradient-to-r from-[#006948] via-[#00855d] to-[#005137] bg-clip-text text-transparent underline decoration-[#85f8c4] decoration-wavy decoration-2">
                  Spotless, Accountable
                </span>{" "}
                Ecosystem
              </h1>

              <p className="text-base sm:text-lg text-[#3d4a42] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                SafaiWatch connects <strong>geotagged citizen reporting</strong>,{" "}
                <strong>AI-verified cleanup drives</strong>, <strong>volunteer karma ranks</strong>,
                and <strong>real-time OpenStreetMap heatmaps</strong> to empower citizens, ward
                leaders, and municipal teams.
              </p>

              {/* Key Highlights Pill Group */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 pt-2">
                <div className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#006948]" />
                  <span>Geotagged Photo Spotting</span>
                </div>
                <div className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#006948]" />
                  <span>AI Dual-Photo Audit</span>
                </div>
                <div className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#006948]" />
                  <span>Drive Dispatch &amp; Squads</span>
                </div>
                <div className="bg-white border border-[#E2E7FF] text-[#131b2e] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#a33900]" />
                  <span>Karma XP &amp; Ranger Tiers</span>
                </div>
              </div>

              {/* Hero Call-To-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#006948] to-[#00855d] hover:from-[#005137] hover:to-[#006948] text-white font-['Hanken_Grotesk'] text-base font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#006948]/25 hover:shadow-xl hover:shadow-[#006948]/35 transition-all duration-300 active:scale-[0.98] cursor-pointer group"
                >
                  <span>Sign In &amp; Launch Dashboard</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#interactive-demo"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#f2f3ff] text-[#131b2e] font-['Hanken_Grotesk'] text-base font-bold rounded-2xl border border-[#bccac0]/60 flex items-center justify-center gap-2.5 shadow-xs transition-all hover:shadow-sm cursor-pointer"
                >
                  <Zap className="w-5 h-5 text-[#006948]" />
                  <span>Try Interactive Demo</span>
                </a>
              </div>

              {/* User Trust & Social Proof Bar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-[#6d7a72]">
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
                    <span className="text-[#131b2e] font-extrabold ml-1">4.9 / 5</span>
                  </div>
                  <p className="text-[#6d7a72] font-medium">
                    Trusted by 35,000+ citizens, coordinators &amp; RWAs
                  </p>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Live Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E7FF] shadow-xl shadow-[#006948]/5">
                {/* Floating decorative badge */}
                <div className="absolute -top-3.5 -right-3 bg-gradient-to-r from-[#006948] to-[#00855d] text-white text-[11px] font-bold font-mono px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase">
                  <Radio className="w-3 h-3 text-[#85f8c4] animate-pulse" />
                  <span>Real-Time Ward Stream</span>
                </div>

                {/* Card Top Title Bar */}
                <div className="flex items-center justify-between border-b border-[#E2E7FF] pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-mono font-bold text-[#6d7a72] ml-2">
                      safaiwatch-hub://live-ward-14
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#006948] bg-[#006948]/10 px-2.5 py-0.5 rounded-md">
                    ONLINE
                  </span>
                </div>

                {/* Mini Simulated Interactive Map & Spot Radar */}
                <div className="relative bg-[#f8fafc] rounded-2xl border border-[#E2E7FF] p-4 overflow-hidden mb-4">
                  {/* Grid pattern */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        "radial-gradient(#006948 1px, transparent 1px), radial-gradient(#006948 1px, #f8fafc 1px)",
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 10px 10px",
                    }}
                  ></div>

                  {/* Ward Map simulated roads */}
                  <svg
                    className="w-full h-36 relative z-0 opacity-70"
                    viewBox="0 0 300 140"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M 10 30 Q 80 50 150 40 T 290 20"
                      stroke="#cbd5e1"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 40 120 Q 120 90 200 110 T 280 80"
                      stroke="#cbd5e1"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 150 10 L 150 130"
                      stroke="#94a3b8"
                      strokeWidth="4"
                      strokeDasharray="4 4"
                    />
                    <path d="M 80 10 L 120 130" stroke="#cbd5e1" strokeWidth="3" />
                    <path d="M 220 10 L 200 130" stroke="#cbd5e1" strokeWidth="3" />

                    {/* Ward Center Marker */}
                    <circle cx="150" cy="70" r="28" fill="#85f8c4" fillOpacity="0.2" />
                    <circle cx="150" cy="70" r="14" fill="#006948" fillOpacity="0.3" />
                    <circle cx="150" cy="70" r="5" fill="#006948" />
                  </svg>

                  {/* Spot 1 Pin */}
                  <button
                    onClick={() => setSelectedRadarSpot(0)}
                    className={`absolute top-6 left-16 p-1.5 rounded-full transition-all duration-300 ${
                      selectedRadarSpot === 0
                        ? "bg-red-500 scale-125 shadow-lg shadow-red-500/50 ring-4 ring-red-200"
                        : "bg-red-500/80 hover:scale-110"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Spot 2 Pin */}
                  <button
                    onClick={() => setSelectedRadarSpot(1)}
                    className={`absolute bottom-8 right-20 p-1.5 rounded-full transition-all duration-300 ${
                      selectedRadarSpot === 1
                        ? "bg-amber-500 scale-125 shadow-lg shadow-amber-500/50 ring-4 ring-amber-200"
                        : "bg-amber-500/80 hover:scale-110"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Spot 3 Pin */}
                  <button
                    onClick={() => setSelectedRadarSpot(2)}
                    className={`absolute top-12 right-12 p-1.5 rounded-full transition-all duration-300 ${
                      selectedRadarSpot === 2
                        ? "bg-emerald-600 scale-125 shadow-lg shadow-emerald-600/50 ring-4 ring-emerald-200"
                        : "bg-emerald-600/80 hover:scale-110"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </button>

                  {/* Mini radar pulse overlay */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#E2E7FF] text-[10px] font-bold text-[#006948] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>3 Active Hotspots in View</span>
                  </div>
                </div>

                {/* Spot Details Panel */}
                <div className="bg-[#FAF8FF] border border-[#E2E7FF] rounded-2xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${radarSpots[selectedRadarSpot].severityColor}`}
                        ></span>
                        <h4 className="font-['Hanken_Grotesk'] text-sm font-bold text-[#131b2e]">
                          {radarSpots[selectedRadarSpot].title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#6d7a72] mt-0.5">
                        {radarSpots[selectedRadarSpot].ward}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-[#85f8c4]/40 text-[#005137] px-2 py-0.5 rounded-md border border-[#006948]/20">
                      {radarSpots[selectedRadarSpot].aiScore}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#E2E7FF] pt-2.5 mt-2.5">
                    <div>
                      <span className="text-[10px] text-[#6d7a72] block">Severity &amp; Type</span>
                      <span className="font-semibold text-[#131b2e]">
                        {radarSpots[selectedRadarSpot].severity} •{" "}
                        {radarSpots[selectedRadarSpot].type}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6d7a72] block">Volunteers Assigned</span>
                      <span className="font-semibold text-[#006948]">
                        {radarSpots[selectedRadarSpot].volunteersCount} Active Rangers
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E2E7FF] flex items-center justify-between">
                    <span className="text-[11px] text-[#6d7a72] flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-[#006948]" />
                      <span>{radarSpots[selectedRadarSpot].reportedBy}</span>
                    </span>

                    <Link
                      href="/login"
                      className="text-xs font-bold text-[#006948] hover:text-[#00855d] flex items-center gap-1 group"
                    >
                      <span>Claim Spot</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Bottom Quick Metric strip */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-[#FAF8FF] p-2 rounded-xl border border-[#E2E7FF]">
                    <div className="text-[10px] text-[#6d7a72] font-medium">Cleanliness Index</div>
                    <div className="text-sm font-extrabold text-[#006948]">92.4% A+</div>
                  </div>
                  <div className="bg-[#FAF8FF] p-2 rounded-xl border border-[#E2E7FF]">
                    <div className="text-[10px] text-[#6d7a72] font-medium">Avg Response</div>
                    <div className="text-sm font-extrabold text-[#131b2e]">2.4 Hours</div>
                  </div>
                  <div className="bg-[#FAF8FF] p-2 rounded-xl border border-[#E2E7FF]">
                    <div className="text-[10px] text-[#6d7a72] font-medium">Karma Pool</div>
                    <div className="text-sm font-extrabold text-[#006948]">+45,200 XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Stats Banner Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#E2E7FF] shadow-sm">
            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <CheckCircle2 className="w-7 h-7 text-[#006948]" />
                <span>12,400+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#3d4a42] font-semibold mt-1.5">
                Verified Waste Spots Cleared
              </span>
              <span className="text-[11px] text-[#6d7a72] mt-0.5 font-mono">
                100% geotagged &amp; AI-audited
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4 border-l border-[#E2E7FF]">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <Calendar className="w-7 h-7 text-[#006948]" />
                <span>850+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#3d4a42] font-semibold mt-1.5">
                Community Drives Organized
              </span>
              <span className="text-[11px] text-[#6d7a72] mt-0.5 font-mono">
                Across 14+ metro municipal wards
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4 border-l border-[#E2E7FF]">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <Users className="w-7 h-7 text-[#006948]" />
                <span>35,000+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#3d4a42] font-semibold mt-1.5">
                Active Civic Volunteers
              </span>
              <span className="text-[11px] text-[#6d7a72] mt-0.5 font-mono">
                Civic Rangers &amp; Drive Leads
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start p-2 sm:p-4 border-l border-[#E2E7FF]">
              <div className="flex items-center gap-2 text-[#006948] font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold">
                <Flame className="w-7 h-7 text-[#a33900]" />
                <span>1.8M+</span>
              </div>
              <span className="text-xs sm:text-sm text-[#3d4a42] font-semibold mt-1.5">
                Karma XP Distributed
              </span>
              <span className="text-[11px] text-[#6d7a72] mt-0.5 font-mono">
                Gamified civic recognition
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            INTERACTIVE PLATFORM SIMULATOR / DEMO SECTION
            ============================================================ */}
        <section
          id="interactive-demo"
          className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E7FF]"
        >
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Hands-On Experience
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#131b2e] mt-4 mb-3">
              Explore the SafaiWatch Engine Live
            </h2>
            <p className="text-sm sm:text-base text-[#3d4a42]">
              Experience how SafaiWatch automates civic cleanliness from the initial camera capture
              to dual-photo AI validation.
            </p>
          </div>

          {/* Interactive Tabs Header */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
            <button
              onClick={() => setActiveShowcaseTab("radar")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "radar"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#3d4a42] border border-[#E2E7FF] hover:bg-[#FAF8FF]"
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
                  : "bg-white text-[#3d4a42] border border-[#E2E7FF] hover:bg-[#FAF8FF]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>2. AI Photo Verification Slider</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab("drives")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "drives"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#3d4a42] border border-[#E2E7FF] hover:bg-[#FAF8FF]"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>3. Drive Coordinator Dispatch</span>
            </button>

            <button
              onClick={() => setActiveShowcaseTab("karma")}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeShowcaseTab === "karma"
                  ? "bg-[#006948] text-white shadow-md shadow-[#006948]/20"
                  : "bg-white text-[#3d4a42] border border-[#E2E7FF] hover:bg-[#FAF8FF]"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>4. Karma XP &amp; Leaderboards</span>
            </button>
          </div>

          {/* Interactive Tab Showcase Content */}
          <div className="bg-white rounded-3xl border border-[#E2E7FF] p-6 sm:p-10 shadow-lg min-h-[420px] flex items-center justify-center">
            {/* TAB 1: RADAR */}
            {activeShowcaseTab === "radar" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Real-Time Waste Clustering</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                    Geotagged Accuracy Down to ±2 Meters
                  </h3>
                  <p className="text-sm text-[#3d4a42] leading-relaxed">
                    When you report a spot, SafaiWatch locks your physical device GPS, validates the
                    camera timestamp, and assigns it to the responsible ward polygon without
                    requiring manual form filling.
                  </p>

                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#131b2e]">
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

                  <div className="pt-4">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#006948] hover:text-[#00855d]"
                    >
                      <span>Sign in to test GPS reporting on your phone</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#FAF8FF] border border-[#E2E7FF] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-[#6d7a72]">
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
                          ? "bg-white border-[#006948] shadow-sm ring-2 ring-[#006948]/10"
                          : "bg-white/60 border-[#E2E7FF] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${spot.severityColor}`}
                        >
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-['Hanken_Grotesk'] text-xs font-bold text-[#131b2e]">
                            {spot.title}
                          </div>
                          <div className="text-[11px] text-[#6d7a72]">{spot.ward}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold bg-[#85f8c4]/30 text-[#005137] px-2 py-0.5 rounded">
                          {spot.severity}
                        </span>
                        <div className="text-[10px] text-[#6d7a72] mt-1">
                          {spot.volunteersCount} squad members
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
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                    AI Verifies True Cleanliness Before Awarding XP
                  </h3>
                  <p className="text-sm text-[#3d4a42] leading-relaxed">
                    Say goodbye to false reports. SafaiWatch compares initial spot photos against
                    post-cleanup submissions to ensure zero fraud. Try the interactive comparison
                    slider to see the transformation.
                  </p>

                  <div className="bg-[#FAF8FF] border border-[#E2E7FF] rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6d7a72]">Visual Similarity Index:</span>
                      <span className="font-mono font-bold text-[#006948]">99.1% Location Match</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#6d7a72]">Debris Reduction Delta:</span>
                      <span className="font-mono font-bold text-[#006948]">-100% Waste Cleared</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#6d7a72]">Karma Reward:</span>
                      <span className="font-mono font-bold text-amber-600">+100 XP (Verified ✓)</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-[#6d7a72] italic">
                      Tip: Drag the slider handle or click anywhere on the comparison preview.
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  {/* Interactive Before & After Showcase Box */}
                  <div
                    className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden shadow-md border border-[#E2E7FF] select-none cursor-ew-resize"
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
                      const touch = e.touches[0];
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
                      setSliderPosition((x / rect.width) * 100);
                    }}
                  >
                    {/* AFTER IMAGE (Background Clean State) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex flex-col items-center justify-center text-white p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-10 h-10 text-[#85f8c4]" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#85f8c4]">
                        AFTER: CLEANED &amp; RESTORED
                      </span>
                      <h4 className="font-['Hanken_Grotesk'] text-lg font-bold mt-1">
                        Connaught Ward 14 Clean Corridor
                      </h4>
                      <div className="mt-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono">
                        AI Verified Authentic ✓ • +100 XP
                      </div>
                    </div>

                    {/* BEFORE IMAGE (Foreground Dirty State with clip-path) */}
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-stone-800 via-amber-950 to-stone-900 flex flex-col items-center justify-center text-white p-6 text-center"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <div className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center mb-3">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
                        BEFORE: REPORTED ACCUMULATION
                      </span>
                      <h4 className="font-['Hanken_Grotesk'] text-lg font-bold mt-1">
                        120 kg Illegal Waste Spot
                      </h4>
                      <div className="mt-3 bg-red-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono">
                        Critical Severity • High Priority
                      </div>
                    </div>

                    {/* Slider Divider Line & Thumb */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#006948] text-[#006948]">
                        <Sliders className="w-4 h-4 rotate-90" />
                      </div>
                    </div>

                    {/* Left/Right Label Badges */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold pointer-events-none">
                      BEFORE
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold pointer-events-none">
                      AFTER
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DRIVES */}
            {activeShowcaseTab === "drives" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Drive Coordination Suite</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                    Rally Ward Volunteers in 3 Simple Steps
                  </h3>
                  <p className="text-sm text-[#3d4a42] leading-relaxed">
                    Coordinators can create targeted neighborhood clean-up drives, schedule dates,
                    broadcast gear requirements, and track squad attendance in real time.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div className="bg-[#FAF8FF] p-3 rounded-xl border border-[#E2E7FF]">
                      <div className="font-bold text-[#131b2e]">Tool Logistics</div>
                      <div className="text-[#6d7a72] mt-1">
                        Track trash grabbers, gloves, and safety jackets
                      </div>
                    </div>
                    <div className="bg-[#FAF8FF] p-3 rounded-xl border border-[#E2E7FF]">
                      <div className="font-bold text-[#131b2e]">Turn-By-Turn Routing</div>
                      <div className="text-[#6d7a72] mt-1">
                        Optimal cleanup paths powered by Leaflet Routing
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  {/* Clean-up Drive Sample Card */}
                  <div className="bg-[#FAF8FF] border border-[#E2E7FF] rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#006948] text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-full">
                        UPCOMING DRIVE
                      </span>
                      <span className="text-xs text-[#6d7a72] font-semibold">Sunday • 7:30 AM</span>
                    </div>

                    <div>
                      <h4 className="font-['Hanken_Grotesk'] text-base font-bold text-[#131b2e]">
                        Greenbelt Park Community Sweep #18
                      </h4>
                      <p className="text-xs text-[#6d7a72] mt-0.5">
                        Ward 14 • Meeting at Sector 4 Central Gazebo
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-[#131b2e]">
                        <span>Squad Capacity</span>
                        <span className="text-[#006948]">18 / 25 Volunteers Joined</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#E2E7FF] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#006948] to-[#85f8c4] rounded-full"
                          style={{ width: "72%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E7FF] text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#006948]" />
                        <span className="font-medium text-[#131b2e]">Lead: Priya Sharma</span>
                      </div>
                      <Link
                        href="/login"
                        className="px-3.5 py-1.5 bg-[#006948] hover:bg-[#00855d] text-white font-bold rounded-xl text-xs"
                      >
                        Join Squad
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KARMA */}
            {activeShowcaseTab === "karma" && (
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Civic Gamification Engine</span>
                  </div>
                  <h3 className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
                    Earn Karma Points, Unlock Ranks &amp; Win Ward Commendations
                  </h3>
                  <p className="text-sm text-[#3d4a42] leading-relaxed">
                    Civic participation is rewarded. Every report verified and every drive completed
                    earns you XP. Level up through Scout, Guardian, and Civic Sentinel tiers.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="bg-amber-100/80 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Eco Sentinel Badge</span>
                    </span>
                    <span className="bg-emerald-100/80 text-emerald-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      <span>10x Cleanup Streak</span>
                    </span>
                    <span className="bg-teal-100/80 text-teal-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Ward 14 Top 1% Hero</span>
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  {/* Mock Leaderboard */}
                  <div className="bg-[#FAF8FF] border border-[#E2E7FF] rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#6d7a72] border-b border-[#E2E7FF] pb-2">
                      <span>WARD 14 TOP CIVIC HEROES</span>
                      <span className="text-[#006948]">MONTHLY CYCLE</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-900 font-extrabold text-xs flex items-center justify-center">
                            1
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#131b2e]">Aarav Sharma</div>
                            <div className="text-[10px] text-[#6d7a72]">28 Spots Cleared</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-700">
                          3,450 XP
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border border-[#E2E7FF] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                            2
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#131b2e]">Dr. Meera Sen</div>
                            <div className="text-[10px] text-[#6d7a72]">19 Spots Cleared</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#006948]">
                          2,820 XP
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border border-[#E2E7FF] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 font-extrabold text-xs flex items-center justify-center">
                            3
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#131b2e]">Vikram Patel</div>
                            <div className="text-[10px] text-[#6d7a72]">14 Spots Cleared</div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#006948]">
                          2,150 XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS (3-STEP INTERACTIVE WORKFLOW)
            ============================================================ */}
        <section
          id="how-it-works"
          className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E7FF]"
        >
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Seamless Workflow
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#131b2e] mt-4 mb-3">
              How SafaiWatch Cleans Your City
            </h2>
            <p className="text-sm sm:text-base text-[#3d4a42]">
              From citizen snapshot to AI certificate, a frictionless 3-step pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`bg-white rounded-3xl p-8 border transition-all duration-300 relative group flex flex-col justify-between cursor-pointer ${
                    activeStep === idx
                      ? "border-[#006948] shadow-xl ring-2 ring-[#006948]/20 -translate-y-1"
                      : "border-[#E2E7FF] hover:border-[#006948]/40 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Step Number & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                      >
                        <IconComp className="w-7 h-7" />
                      </div>
                      <span className="font-['Hanken_Grotesk'] text-3xl font-extrabold text-[#E2E7FF] group-hover:text-[#85f8c4] transition-colors">
                        {step.num}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] font-bold text-[#006948] bg-[#006948]/10 px-2.5 py-1 rounded-md">
                      {step.badge}
                    </span>

                    <h3 className="font-['Hanken_Grotesk'] text-xl font-bold text-[#131b2e] mt-3 mb-3">
                      {step.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#3d4a42] leading-relaxed mb-4">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E2E7FF] flex items-center justify-between text-xs font-semibold text-[#006948]">
                    <span>{step.highlight}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            FOUR CORE ARCHITECTURAL MODULES
            ============================================================ */}
        <section id="modules" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Platform Architecture
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#131b2e] mt-4 mb-3">
              Four Interconnected Civic Pillars
            </h2>
            <p className="text-sm sm:text-base text-[#3d4a42]">
              A complete operating system for urban cleanliness, volunteer engagement, and civic
              transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Module 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-lg flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#006948] uppercase tracking-wider">
                  Module 01
                </span>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mt-1 mb-2">
                  Geotagged Spotting
                </h3>
                <p className="text-xs text-[#3d4a42] leading-relaxed">
                  Precision GPS locking, photo category tagging, and automatic ward polygon
                  detection. Zero manual address entry.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948] flex items-center justify-between">
                <span>1-TAP DISPATCH</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-lg flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#006948] uppercase tracking-wider">
                  Module 02
                </span>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mt-1 mb-2">
                  Drive Coordination
                </h3>
                <p className="text-xs text-[#3d4a42] leading-relaxed">
                  Coordinator command dashboard to schedule community drives, rally local crews, and
                  manage equipment logistics.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948] flex items-center justify-between">
                <span>SQUAD MANAGEMENT</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-lg flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#006948] uppercase tracking-wider">
                  Module 03
                </span>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mt-1 mb-2">
                  Volunteer Karma Grid
                </h3>
                <p className="text-xs text-[#3d4a42] leading-relaxed">
                  Gamified rewards, XP streak multipliers, and official certificates recognizing
                  active neighborhood custodians.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948] flex items-center justify-between">
                <span>XP &amp; CIVIC RANKS</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 4 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E7FF] hover:border-[#006948]/50 transition-all hover:shadow-lg flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#006948]/10 text-[#006948] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <MapIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#006948] uppercase tracking-wider">
                  Module 04
                </span>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#131b2e] mt-1 mb-2">
                  Live OSM Heatmaps
                </h3>
                <p className="text-xs text-[#3d4a42] leading-relaxed">
                  OpenStreetMap interactive heatmaps displaying ward cleanliness indices, active
                  cleanup routes, and resolved pins.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[#E2E7FF] text-[11px] font-mono font-bold text-[#006948] flex items-center justify-between">
                <span>REAL-TIME HEATMAP</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            INTERACTIVE IMPACT CALCULATOR WIDGET
            ============================================================ */}
        <section
          id="impact-calculator"
          className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E2E7FF]"
        >
          <div className="bg-gradient-to-br from-[#003927] to-[#002114] rounded-[36px] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Ambient background blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#85f8c4]/15 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="font-mono text-xs text-[#85f8c4] font-bold uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full border border-white/20">
                  Civic Potential Estimator
                </span>

                <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold leading-tight">
                  Calculate the Environmental Impact Your Squad Can Make
                </h2>

                <p className="text-sm sm:text-base text-[#85f8c4]/90 leading-relaxed">
                  Adjust the sliders to estimate how much waste you can clear, karma points you can
                  earn, and ward cleanliness boost you can achieve in 60 days.
                </p>

                {/* Slider 1: Cleanups per Month */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Cleanups Organised / Month</span>
                    <span className="font-mono text-[#85f8c4] font-bold">
                      {calcCleanupsPerMonth} Drives / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={calcCleanupsPerMonth}
                    onChange={(e) => setCalcCleanupsPerMonth(Number(e.target.value))}
                    className="w-full accent-[#85f8c4] h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>1 (Casual)</span>
                    <span>4 (Active)</span>
                    <span>8 (Super Squad)</span>
                  </div>
                </div>

                {/* Slider 2: Average Volunteers per drive */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Average Volunteers in Squad</span>
                    <span className="font-mono text-[#85f8c4] font-bold">
                      {calcVolunteers} Volunteers
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={calcVolunteers}
                    onChange={(e) => setCalcVolunteers(Number(e.target.value))}
                    className="w-full accent-[#85f8c4] h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>2 (Duo)</span>
                    <span>15 (Squad)</span>
                    <span>30 (Ward Army)</span>
                  </div>
                </div>
              </div>

              {/* Calculation Output Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center sm:text-left">
                  <div className="text-xs text-[#85f8c4] font-mono uppercase font-bold">
                    Est. Waste Cleared
                  </div>
                  <div className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold mt-1 text-white">
                    {wasteDivertedKg.toLocaleString()} kg
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    Diverted from city drains &amp; roadsides
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-center sm:text-left">
                  <div className="text-xs text-[#85f8c4] font-mono uppercase font-bold">
                    Karma XP Earned
                  </div>
                  <div className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold mt-1 text-amber-400">
                    +{karmaEarned.toLocaleString()} XP
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    Unlocks Sentinel Badge &amp; Certificates
                  </div>
                </div>

                <div className="sm:col-span-2 bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#85f8c4] font-mono uppercase font-bold">
                      Estimated Ward Cleanliness Boost
                    </div>
                    <div className="font-['Hanken_Grotesk'] text-2xl sm:text-3xl font-extrabold text-white">
                      +{wardIndexBoost}% Index Improvement
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-6 py-3 bg-[#85f8c4] hover:bg-white text-[#002114] font-bold rounded-xl text-xs sm:text-sm text-center transition-all shrink-0"
                  >
                    Start Making Impact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION
            ============================================================ */}
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs text-[#006948] font-bold uppercase tracking-wider bg-[#006948]/10 px-3.5 py-1.5 rounded-full border border-[#006948]/20">
              Clear Answers
            </span>
            <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl font-extrabold text-[#131b2e] mt-4 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#3d4a42]">
              Everything you need to know about joining, reporting, and organizing with SafaiWatch.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E2E7FF] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-['Hanken_Grotesk'] font-bold text-sm sm:text-base text-[#131b2e] hover:text-[#006948] transition-colors"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-[#006948] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#6d7a72] shrink-0" />
                  )}
                </button>

                {activeFaq === idx && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-[#3d4a42] leading-relaxed border-t border-[#E2E7FF] pt-4 animate-enter">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================
            BOTTOM HIGH-IMPACT CALL TO ACTION BANNER
            ============================================================ */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#006948] via-[#005137] to-[#003927] rounded-[36px] p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="font-mono text-xs text-[#85f8c4] font-bold uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
                Civic Access &amp; Ward Command
              </span>

              <h2 className="font-['Hanken_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Ready to Lead Cleanliness in Your Ward?
              </h2>

              <p className="text-sm sm:text-base text-[#85f8c4]/90 max-w-2xl mx-auto leading-relaxed">
                Join thousands of verified civic heroes, spot local waste hotspots, coordinate
                drives, and restore your neighborhood street by street.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-[#85f8c4] hover:bg-white text-[#002114] font-['Hanken_Grotesk'] text-base font-bold rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>Launch SafaiWatch Portal</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/onboarding"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-['Hanken_Grotesk'] text-base font-bold rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5 text-[#85f8c4]" />
                  <span>Register Ward Territory</span>
                </Link>
              </div>

              <div className="pt-6 text-xs text-[#85f8c4]/70 font-mono">
                ✓ No credit card required • Open to all wards • AI verified
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E2E7FF] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#6d7a72] z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <SafaiWatchLogo variant="full" size="sm" animated={false} />
            <p className="text-xs text-[#6d7a72] max-w-sm mt-2 leading-relaxed">
              SafaiWatch is an open civic action &amp; cleanliness network designed to empower
              residents, coordinators, and urban municipal bodies with real-time transparency and
              AI verification.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#131b2e] mb-3 uppercase tracking-wider font-mono text-[11px]">
              Platform Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#interactive-demo" className="hover:text-[#006948] transition-colors">
                  Geotagged Spot Radar
                </a>
              </li>
              <li>
                <a href="#interactive-demo" className="hover:text-[#006948] transition-colors">
                  AI Photo Audit
                </a>
              </li>
              <li>
                <a href="#modules" className="hover:text-[#006948] transition-colors">
                  Clean-Up Drive Suite
                </a>
              </li>
              <li>
                <a href="#modules" className="hover:text-[#006948] transition-colors">
                  OpenStreetMap Heatmaps
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#131b2e] mb-3 uppercase tracking-wider font-mono text-[11px]">
              Civic Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-[#006948] transition-colors">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-[#006948] transition-colors">
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

        <div className="max-w-7xl mx-auto pt-8 border-t border-[#E2E7FF] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SafaiWatch Civic Hub. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#006948] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
