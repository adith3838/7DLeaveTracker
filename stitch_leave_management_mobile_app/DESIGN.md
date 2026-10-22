---
name: Kinetic Enterprise Mobility
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for high-velocity enterprise human resource workflows, self-service leave requests, and workforce management. The emotional tone combines executive confidence with consumer-grade frictionlessness: authoritative yet empowering, swift, and transparent.

The design movement bridges **Corporate / Modern** precision with **Native Tactile** mobile conventions. Drawing inspiration from modern mobile frameworks, it employs platform-adaptive conventions: crisp layered surfaces, subtle elevation, tactile touch targets, and high-legibility typographic hierarchies. Visual clutter is stripped away in favor of high-contrast status messaging, effortless card-based scannability, and frictionless submission patterns.

## Colors

The palette establishes an immediate semantic dialogue with the user:

- **Primary (`#4F46E5` - Modern Violet-Blue):** Directs primary intent, interactive actions, floating controls, and primary brand touchpoints.
- **Secondary / Success (`#10B981` - Emerald Green):** Represents approved states, accrued balance credits, active status, and successful synchronization.
- **Tertiary / Warning (`#F59E0B` - Amber Gold):** Communicates pending review, escalation alerts, awaiting approval stages, and draft policies.
- **Destructive / Error (`#EF4444` - Rose Red):** Used strictly for rejected requests, cancelled leaves, critical policy warnings, and session terminations.
- **Canvas & Neutral Surfaces:**
  - Base Background: `#F8FAFC` (Slate 50) creates a calm, glare-free working canvas.
  - Surface Elevation 01: `#FFFFFF` (Pure White) delivers crisp foreground contrast for cards and sheets.
  - Borders & Dividers: `#E2E8F0` (Slate 200) for structural lines, keeping contrast accessible without harshness.
  - Text Hierarchy: Primary text at `#0F172A` (Slate 900), secondary at `#475569` (Slate 600), and muted placeholders at `#94A3B8` (Slate 400).

## Typography

Inter serves as the foundational typeface across all operational roles, providing native SF Pro / Roboto parity on mobile runtimes while ensuring uniform tabular figure alignments for dates, balances, and operational hours.

- **Large Titles (`headline-lg`, `headline-lg-mobile`):** Anchor view transitions, balance overviews, and parent headers.
- **Section Headers (`headline-md`, `headline-sm`):** Group segmented leave types, approval lists, and profile settings.
- **Body (`body-lg`, `body-md`, `body-sm`):** Tuned with optimal optical sizes for rapid parsing of supervisor comments, policy documentation, and metadata strings.
- **Labels (`label-lg`, `label-md`, `label-sm`):** Set with uppercase or medium-to-bold weights for badges, pill chips, tab bars, and segmented button titles.

## Layout & Spacing

The application conforms to a hybrid mobile-first single-column container model on handheld devices, scaling gracefully up to a structured card canvas on tablets and foldables.

- **Mobile (< 768px):** Single-column layout with fixed outer margins of `16px` (`margin`). Card gutters set to `16px` (`gutter`). Elements prioritize vertical scannability with thumb-accessible trigger points located in the bottom 40% of the viewport.
- **Tablet / Large Foldable (≥ 768px):** Two-column split layout (master-detail paradigm). Left pane displays the scrollable leave records (`360px` fixed), right pane hosts detail expansion and audit logs with `24px` gutter gaps.
- **Component Padding Scale:**
  - `space-xs` (4px): Fine alignment between iconography and text labels.
  - `space-sm` (8px): Inner compact pill badge padding, list item vertical gaps.
  - `space-md` (16px): Standard container padding within cards and interactive rows.
  - `space-lg` (24px): Section boundaries and bottom-sheet margins.
  - `space-xl` (32px): Modal and state empty-screen spacing.

## Elevation & Depth

Visual hierarchy uses a refined ambient shadow stack combined with low-contrast borders to prevent visual vibration on high-density OLED and Retina screens.

- **Level 0 (Flat / Canvas):** Applied to the base canvas (`#F8FAFC`). No shadow.
- **Level 1 (Card & Content Blocks):** 
  - Style: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`
  - Outlines: Border 1px solid `#F1F5F9`.
  - Application: Standard leave cards, metric tiles, list groupings.
- **Level 2 (Active Touch & Segmented States):**
  - Style: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`
  - Application: Pressed card states, segmented controls selected pill, dropdown selectors.
- **Level 3 (Sticky Headers & Modals):**
  - Style: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`
  - Application: Action sheets, date pickers, sticky approval footer bars.
- **Floating Action Elevation (FAB):**
  - Style: `0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.2)`
  - Accentuated indigo ambient bloom gives the primary creation button clear separation from background cards.

## Shapes

The geometry balances structured modernism with ergonomic physical hardware corners:

- **Cards and Containers:** Fixed at `12px` to `16px` corner radiuses (`rounded-lg`), mirroring device edge curvatures.
- **Interactive Inputs and Text Areas:** Set at `10px` to `12px` for focused, accessible touch targets.
- **Segmented Controls and Filter Tabs:** Embedded within an `8px` to `10px` wrapper track.
- **Badges, Status Chips, and Floating Action Buttons:** Rendered as full pills (`rounded-full` / `9999px`) to establish instant visual contrast against rectangular card layouts.

## Components

### Buttons
- **Primary:** Full-width mobile trigger or compact header action. Background `#4F46E5`, foreground `#FFFFFF`, border-radius `12px`, height `48px` to ensure ergonomic touch target criteria. Active states dim to `#4338CA`.
- **Secondary / Soft:** Background `#EEF2FF`, foreground `#4F46E5`, border-radius `12px`, height `48px`.
- **Destructive:** Background `#FEE2E2`, foreground `#EF4444`, hover/active `#FCA5A5`.

### Floating Action Button (FAB)
- Centered or bottom-right anchored (`bottom: 24px`, `right: 20px`).
- Circular `56px × 56px` with `#4F46E5` fill and elevated indigo shadow.
- Icon: Crisp `24px` plus (`+`) glyph in white. Extends into an extended pill on downward scroll containing `New Request` label.

### Status Badges & Pill Chips
- **Approved:** Background `#ECFDF5`, text `#065F46`, border 1px solid `#A7F3D0`.
- **Pending:** Background `#FFFBEB`, text `#92400E`, border 1px solid `#FDE68A`.
- **Rejected:** Background `#FEF2F2`, text `#991B1B`, border 1px solid `#FECACA`.
- Form Factor: Height `24px`, horizontal padding `8px`, radius `9999px`, typographic scale `label-sm`.

### Segmented Controls (iOS / Material Hybrid)
- Background track in `#F1F5F9` with `4px` internal padding.
- Sliding active indicator: Solid white (`#FFFFFF`) with Level 1 elevation and `8px` corner radius.
- Inactive segment label in `#64748B`, active segment label in `#0F172A` with `label-md` bolding.

### Cards (Leave Item & Balance Tile)
- Background `#FFFFFF`, border 1px solid `#F1F5F9`, border-radius `14px`, padding `16px`.
- Structure: Header row containing leave category and pill status badge; central metric row showing date ranges and calculated days; footer row containing manager avatar and submission timestamp.

### Inputs & Date Selectors
- Background `#F8FAFC`, border 1px solid `#CBD5E1`, radius `10px`, height `48px`.
- Focus state: Surface turns `#FFFFFF`, border changes to `2px solid #4F46E5` with `0 0 0 3px rgba(79, 70, 229, 0.15)` focus ring.
- Inline calendar selectors adopt native mobile sheet pickers with selected date ranges highlighted in primary indigo.

### Lists & Cell Groups
- Native grouped inset style with `16px` horizontal margin.
- Individual cells separated by a `1px` partial divider (`#E2E8F0`) inset by `16px` to avoid cutting through icons.
- Right chevron accessory (`#94A3B8`) indicating drill-down availability.