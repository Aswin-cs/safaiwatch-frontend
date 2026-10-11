# SafaiWatch Frontend Web Application

SafaiWatch is an interactive civic engagement platform empowering citizens and local municipal coordinators to report, clean up, and monitor urban waste spots in real time. Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, and Leaflet, the frontend delivers a high-performance map-first experience, instant Socket.IO synchronization, and an anti-fraud verification workflow backed by Gemini AI.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Custom CSS Variables (Lumina Civic Design System)
- **Mapping & GIS**: [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/), and [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/)
- **Real-Time Communication**: [Socket.IO Client](https://socket.io/)
- **Icons & Typography**: [Lucide React](https://lucide.dev/), Google Material Symbols, Google Fonts (*Hanken Grotesk*, *Inter*, *JetBrains Mono*)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## Anti-Fraud Verification System (Gesture & Code)

To prevent users from uploading stock photos, fake AI-generated images, or old pictures from their galleries, SafaiWatch enforces a **Proof-of-Liveness & Proof-of-Presence** mechanism across both **Reporting a Spot** (`ReportWasteSpotModal`) and **Completing a Cleanup** (`CompleteWasteSpotModal`).

```
+------------------------------------------------------------------------+
|                        VERIFICATION WORKFLOW                           |
+------------------------------------------------------------------------+
|                                                                        |
|  [User opens Modal]                                                    |
|          |                                                             |
|          +---> Mode 1: Hand Gesture Mode (180s Countdown)               |
|          |     * System generates a randomized hand gesture reference  |
|          |     * User must show their hand performing this exact pose  |
|          |       in front of the waste spot                            |
|          |                                                             |
|          +---> Mode 2: Code Verification Mode (300s Countdown)         |
|                * System generates a unique 4-6 character code          |
|                * User must write the code on paper / display it        |
|                  physically within the camera frame                    |
|                                                                        |
|          +---> Live Camera / Photo Capture with Active Proof           |
|          +---> Auto-Cancellation on Dismiss (Frees pending token)      |
|          +---> Multi-Modal AI (Gemini) checks: Liveness + Waste + GPS   |
+------------------------------------------------------------------------+
```

### 1. Verification Modes

- **Hand Gesture Verification (`hand`)**:
  - The frontend fetches a randomized gesture reference image (e.g., *holding 3 fingers up*, *peace sign*, *open palm*, *thumbs up*) from `/api/v1/spots/gesture-verification`.
  - The user has **3 minutes (180 seconds)** to take a live photo of the waste spot with their hand performing the requested gesture clearly visible in frame.
- **Code Verification (`code`)**:
  - The frontend fetches a dynamic, time-limited verification code from `/api/v1/spots/code-verification`.
  - The user has **5 minutes (300 seconds)** to write the code on a piece of paper or notebook and capture it alongside the waste spot.

### 2. Expiry Countdowns & Anti-Brute-Force Rate Limiting

- **Live Countdown Timers**: Both modes feature real-time progress bars and countdown timers displaying the remaining validity period.
- **Rate-Limited Refresh**:
  - **Max 3 Refreshes before expiry**: Prevents users from repeatedly rolling the dice until they get a trivial pose.
  - **Max 2 Refreshes after expiry**: Gives the user a chance to regenerate without locking them out, while blocking automated bots.
- **Automatic Resource Cleanup**:
  - If the user closes or dismisses the modal without submitting, the frontend immediately fires `deleteOneTimeVerification` (`DELETE /api/v1/spots/:id/one-time`) to clean up the ephemeral server token and avoid database clutter.

### 3. Server-Side AI Vision Validation

Upon submission, the image, location coordinates, and verification token ID are processed by **Google Gemini Vision AI** on the backend:
1. Validates that real waste/garbage is present (or that the area is clean for completion).
2. Confirms the requested gesture or verification code is present and legible in the captured scene.
3. Verifies that the photo is an authentic capture rather than a re-photographed computer screen or AI generation.

---

## Project Architecture

```plaintext
frontend/
├── app/                             # Next.js App Router
│   ├── (auth)/                      # Authentication route group
│   │   ├── login/page.tsx           # OTP login & Google OAuth
│   │   └── onboarding/page.tsx      # Role selection, avatar & profile setup
│   ├── feed/page.tsx                # Community feed with Before/After sliders
│   ├── history/page.tsx             # User cleanup & spot reporting history
│   ├── notifications/page.tsx       # System & spot alert notifications
│   ├── profile/page.tsx             # User badges, tiers, and settings
│   ├── rewards/page.tsx             # Rewards store, coin redeem & leaderboards
│   ├── layout.tsx                   # Global layout, fonts & theme setup
│   ├── page.tsx                     # Map Dashboard & central control center
│   └── globals.css                  # Global design tokens & Tailwind imports
├── components/                      # Modular UI components
│   ├── BeforeAfterSlider.tsx        # Interactive before/after split slider
│   ├── BottomNav.tsx                # Mobile responsive navigation bar
│   ├── CompleteWasteSpotModal.tsx   # Cleanup submission with gesture/code proof
│   ├── ContestSpotReportModal.tsx   # Dispute submission & counter-evidence
│   ├── FeedCardSkeleton.tsx         # Skeleton loader for social cards
│   ├── HoldButton.tsx               # Press-and-hold interactive action button
│   ├── NotificationPopup.tsx        # Live toast popup alerts
│   ├── ReportWasteSpotModal.tsx     # New spot reporting with gesture/code proof
│   ├── SafaiWatchLogo.tsx           # Scalable SVG branding component
│   ├── ThemeToggle.tsx              # Dark / Light mode switcher
│   ├── landing/                     # Unauthenticated marketing landing
│   │   └── UnauthenticatedIntro.tsx
│   └── map/                         # Leaflet map implementation
│       ├── SafaiMap.tsx             # Dynamic client-only wrapper for Leaflet
│       └── SafaiMapInner.tsx        # Custom markers, layers, and routing machine
├── context/                         # React context providers
│   └── ThemeContext.tsx             # Persistent theme state (Dark / Light)
├── lib/                             # Core utilities and clients
│   ├── api.ts                       # Typed REST client with proxy rewriting
│   ├── citizenClaims.ts             # AI claim formatting & dispute handlers
│   └── socket.ts                    # Socket.IO client instance
├── public/                          # Static icons, logos & audio alerts
├── DESIGN.md                        # "Lumina Civic" design system specification
├── next.config.ts                   # Next.js rewrites, redirects & configuration
└── package.json                     # Dependencies and build scripts
```

---

## Design System: Lumina Civic

The UI follows the **Lumina Civic** design language detailed in [`DESIGN.md`](./DESIGN.md):

- **Daylight Philosophy**: Crisp white spaces, subtle hairline borders (`#E2E8F0`), and high-contrast typography designed for outdoor visibility under direct sunlight.
- **Curated Palette**:
  - **Emerald Green (`#006948`)**: Primary action color representing civic health, growth, and completion.
  - **Indigo (`#4B41E1`)**: Reserved for AI insight indicators, smart analytics, and automated verification badges.
  - **Warm Orange (`#CC4900`)**: Used for community engagement, active hot zones, and daily streaks.
  - **Crimson (`#BA1A1A`)**: Critical sanitation alerts, overdue spots, and dispute flags.
- **Typography**:
  - **Hanken Grotesk**: Editorial headlines with tight tracking.
  - **Inter**: Functional, ultra-legible body typography.
  - **JetBrains Mono**: Geolocation coordinates, IDs, and dynamic verification codes.

---

## Environment Variables

Create a `.env.local` file in the `frontend` root:

```bash
touch .env.local
```

Add the following environment variables:

```env
# URL of your running backend server (defaults to http://localhost:4000 if blank)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Optional custom Socket.IO URL (falls back to NEXT_PUBLIC_API_URL or http://localhost:4000)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

> **Note**: Next.js automatically rewrites any client calls made to `/api/*` directly to `NEXT_PUBLIC_API_URL/api/*` via `next.config.ts`, avoiding cross-origin issues in local development.

---

## Installation & Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or v20.x+)
- Running SafaiWatch Backend server (default: `http://localhost:4000`)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

### 3. Build for Production

```bash
npm run build
npm start
```

---

## App Routes & Pages

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | Main interactive Leaflet map dashboard with live spot markers, filter drawer, and quick report button. |
| `/login` | `app/(auth)/login/page.tsx` | Sign in / Sign up page with email OTP validation and Google OAuth. |
| `/onboarding` | `app/(auth)/onboarding/page.tsx` | New user profile setup, avatar configuration, address, and role assignment (`Civilian`, `Coordinator`, `Hybrid`). |
| `/feed` | `app/feed/page.tsx` | Community feed showcasing verified before/after cleanup stories, upvoting, and social impact. |
| `/history` | `app/history/page.tsx` | Historical timeline of spots reported and cleanups executed by the logged-in user. |
| `/rewards` | `app/rewards/page.tsx` | Gamified rewards marketplace, coin redemptions, and ward leaderboards. |
| `/notifications` | `app/notifications/page.tsx` | Notification center for spot assignments, cleanups, disputes, and earned points. |
| `/profile` | `app/profile/page.tsx` | User profile page showing tier ranking, civic statistics, streaks, and account settings. |

---

## Real-Time Features (Socket.IO)

The client automatically connects to the backend Socket.IO server on startup (`lib/socket.ts`):

- **Live Map Markers**: Updates map pins instantly whenever a spot is reported, claimed, or cleaned up by another user in the ward.
- **Audio & Visual Alerts**: Triggers real-time chime alerts and banner notifications (`NotificationPopup.tsx`) for status changes.
- **Social Feed Activity**: Updates like counters and community feed items in real time without requiring manual refreshes.

---

## Leaflet Map Integration

- **Custom SVG Pin Markers**: Differentiates spots based on status (*Pending Verification*, *Assigned / In Progress*, *Cleaned*, *Contested*).
- **Navigation & Routing**: Integrates Leaflet Routing Machine to calculate turn-by-turn walking and driving routes from the user's current GPS location to the target waste spot.
- **Boundary Clamping & Geolocation**: Uses the browser's Geolocation API to position the user on their local ward and verify proximity when submitting cleanups.
