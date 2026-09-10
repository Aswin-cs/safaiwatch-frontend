---
name: Lumina Civic
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#a33900'
  on-tertiary: '#ffffff'
  tertiary-container: '#cc4900'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7f2b00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built for premium civic engagement and urban navigation. The brand personality is authoritative yet approachable, prioritizing clarity, transparency, and high-efficiency information density. 

The aesthetic follows a **Modern Corporate** direction with elements of **Minimalism**. It utilizes a "Daylight" philosophy—heavy use of pure white space, crisp hairline strokes, and high-contrast typography to ensure accessibility in high-glare outdoor environments. The interface should feel like a high-end digital utility: precise, reliable, and optimistic.

## Colors

The palette is anchored by **Emerald Green**, signaling growth and civic "go" states. The neutral scale is shifted toward cold grays to maintain a professional, tech-forward feel.

- **Primary (Emerald):** Used for main actions, positive status indicators, and active navigation paths.
- **Indigo (AI/Logic):** Reserved for automated insights, data visualizations, and smart suggestions.
- **Warm Orange (Streaks/Activity):** Used for gamification, community contributions, and active "hot" zones.
- **Crimson (Alerts):** Strictly for urgent infrastructure issues, warnings, and error states.
- **Typography:** Headlines use **Deep Charcoal (#0F172A)** for maximum legibility; body text uses **Slate Grey (#64748B)** to reduce visual fatigue.

## Typography

The typography strategy blends contemporary Swiss-style grotesques with utilitarian monospaced accents.

- **Headlines:** Hanken Grotesk provides a sharp, high-end feel with tight tracking for a modern "editorial" look in civic reporting.
- **Body:** Inter is used for all functional text to ensure cross-platform consistency and high readability at small sizes.
- **Metadata:** JetBrains Mono is utilized for IDs, timestamps, and coordinates to evoke a sense of precision and data-driven accuracy.

## Layout & Spacing

The design system employs a **Fixed Grid** on desktop (12 columns, 1200px max-width) and a **Fluid Fluid** on mobile (4 columns). 

- **The 8px Rule:** All margins and paddings must be multiples of 8px to maintain vertical rhythm.
- **Generous Whitespace:** Content blocks should be separated by a minimum of 48px on desktop to prevent information overload.
- **Map Context:** When used in a map view, UI panels should hover with a 24px margin from the screen edge, never touching the browser chrome.

## Elevation & Depth

This system uses a **Tonal Layering** approach combined with soft ambient shadows to define hierarchy.

1.  **Level 0 (Base):** Map canvas or background (#F8FAFC).
2.  **Level 1 (Card):** Pure White (#FFFFFF) with a 1px border (#E2E8F0) and no shadow. Used for secondary information.
3.  **Level 2 (Floating):** Pure White (#FFFFFF) with a soft shadow (`0 8px 30px rgba(15, 23, 42, 0.08)`). This is the primary state for interactive panels.
4.  **Level 3 (Modal):** Pure White (#FFFFFF) with a deeper shadow (`0 20px 50px rgba(15, 23, 42, 0.12)`).

Avoid heavy blurs; maintain a "paper-on-glass" crispness. All borders are 1px and strictly #E2E8F0.

## Shapes

The shape language is characterized by **large, friendly radii** for containers and **tighter, more functional radii** for interactive elements.

- **Containers/Cards:** Use a consistent 24px radius (`rounded-xl` / `rounded-2xl` equivalent) to evoke a modern, soft hardware feel (reminiscent of contemporary mobile OS).
- **Interactive Elements:** Buttons and inputs use a 12px radius to feel distinct from the outer container.
- **Icons:** Use 24px bounding boxes with a 1.5px stroke weight. Avoid filled icons unless indicating an "Active" state.

## Components

### Buttons
- **Primary:** Emerald Green background, White text. No gradient. 12px radius.
- **Secondary:** Transparent background, 1px #E2E8F0 border, #0F172A text.
- **Ghost:** No border or background, #64748B text, shifts to #0F172A on hover.

### Input Fields
- White background with a 1px #E2E8F0 border.
- On focus: Border changes to Emerald Green (#059669) with a 2px outer glow of the same color at 10% opacity.
- Labels use the `label-caps` typography style.

### Cards & Panels
- 24px rounded corners.
- 1px hairline border in #E2E8F0.
- Soft shadow for floating panels; flat for inline list items.

### Chips/Badges
- Small, 100px (pill) roundedness.
- Subtle background (10% opacity of the accent color) with full-opacity text of the same color.

### Iconography
- Use a consistent 1.5px stroke.
- Ends should be rounded for a friendlier civic feel.
- Default color: Slate Grey (#64748B). Active color: Emerald (#059669).