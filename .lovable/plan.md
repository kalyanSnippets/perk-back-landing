
## Plan: Kick off high-fidelity PerkBack SaaS loyalty prototypes

### Goal

Create a polished, modern, classy prototype system for PerkBack that includes:

- Interactive clickable prototypes inside the app
- Mobile-first customer and merchant flows
- Desktop SaaS marketing and dashboard views
- Downloadable PNG/PDF prototype boards
- No disruption to existing auth, dashboards, routing, or backend logic

The prototype will be built as a separate presentation layer so it can guide the full redesign without breaking the current production app.

---

## Deliverables

### 1. Interactive prototype route

Add a hidden public route:

```text
/prototype
```

This route will include:

- Mobile / Desktop device switcher
- Customer / Merchant / Marketing flow switcher
- Clickable screen navigation
- High-fidelity device frames
- Screen thumbnails or step indicators
- Polished PerkBack SaaS styling using the current navy, blue, gold, white, rounded-card design system

This route will not be added to the main navigation unless requested later.

---

### 2. Mobile-first customer prototype screens

Create attractive mobile screens for the customer experience:

1. Splash / brand intro
2. Onboarding
3. Login / signup
4. Customer home
5. Digital loyalty card
6. Rewards and offers
7. Explore nearby merchants
8. Receipt / transaction detail
9. Profile / settings

Design direction:

- Premium digital wallet feel
- Large points balance hero card
- Floating bottom navigation
- Gold reward highlights
- Card-style loyalty identity
- Barcode / QR-style visual zones
- Clean SaaS polish with strong mobile usability

---

### 3. Mobile-first merchant prototype screens

Create attractive mobile screens for merchant operations:

1. Merchant login
2. Dashboard overview
3. Add points
4. Scan customer card / QR
5. Customers list
6. Campaign builder
7. Insights snapshot
8. Settings / plan management

Design direction:

- Compact SaaS dashboard cards
- KPI tiles for loyalty ROI
- Quick action grid
- Customer activity feed
- Campaign suggestion cards
- Clear business-friendly copy
- Mobile-first workflows for fast in-store use

---

### 4. Desktop SaaS prototype screens

Create desktop frames for the broader platform:

1. Marketing homepage
2. Pricing section
3. Customer dashboard
4. Merchant dashboard
5. Merchant analytics / reports
6. Admin-style platform overview

Design direction:

- Spacious modern SaaS layout
- Premium hero section
- Rounded cards and soft shadows
- Strong conversion CTAs
- Desktop dashboards with KPI cards, charts, and side navigation
- Consistent visual language between public site and logged-in dashboards

---

## Implementation approach

### A. Add prototype data model

Create a typed screen registry:

```text
src/lib/prototypeScreens.ts
```

It will define:

- Screen IDs
- Titles
- Flow type
- Device type
- Step order
- Descriptions
- CTA target screen
- Component mapping

This keeps the prototype scalable and easy to expand.

---

### B. Add reusable prototype components

Create a new prototype component folder:

```text
src/components/prototype/
```

Likely components:

```text
PrototypeShell.tsx
PrototypeNav.tsx
DeviceFrame.tsx
PrototypeScreenCard.tsx
MobileCustomerPrototype.tsx
MobileMerchantPrototype.tsx
DesktopMarketingPrototype.tsx
DesktopDashboardPrototype.tsx
PrototypeControls.tsx
```

These components will be presentational only and will reuse existing PerkBack UI primitives where appropriate.

---

### C. Add prototype page

Create:

```text
src/pages/Prototype.tsx
```

Then add a lazy-loaded route in:

```text
src/App.tsx
```

New route:

```text
/prototype
```

The page will be public, hidden, and non-invasive.

---

### D. Build mobile prototypes first

Start with the mobile customer and merchant flows because the approved direction is mobile-first.

Priority order:

1. Mobile customer wallet flow
2. Mobile merchant dashboard/add-points flow
3. Mobile navigation and clickable transitions
4. Desktop SaaS views
5. Downloadable boards

---

### E. Generate downloadable design boards

Create downloadable files in:

```text
/mnt/documents/
```

Planned outputs:

```text
perkback-mobile-prototype-board.png
perkback-desktop-prototype-board.png
perkback-saas-loyalty-prototypes.pdf
```

The PDF will include:

1. Cover page
2. Mobile customer flow
3. Mobile merchant flow
4. Desktop SaaS flow
5. Visual design system summary

---

## Visual style

The prototypes will follow a modern SaaS loyalty-platform aesthetic:

- Deep navy trust base
- PerkBack blue for primary actions
- Gold/yellow for rewards and premium moments
- White and soft neutral cards
- DM Sans typography
- Large rounded surfaces
- Soft shadows
- Floating mobile navigation
- Clean dashboard spacing
- Minimal but premium iconography from `lucide-react`
- Business-friendly merchant copy
- Friendly customer-facing reward language

---

## Files to add

```text
src/pages/Prototype.tsx
src/lib/prototypeScreens.ts
src/components/prototype/PrototypeShell.tsx
src/components/prototype/PrototypeNav.tsx
src/components/prototype/DeviceFrame.tsx
src/components/prototype/PrototypeScreenCard.tsx
src/components/prototype/PrototypeControls.tsx
src/components/prototype/MobileCustomerPrototype.tsx
src/components/prototype/MobileMerchantPrototype.tsx
src/components/prototype/DesktopMarketingPrototype.tsx
src/components/prototype/DesktopDashboardPrototype.tsx
```

---

## Files to modify

```text
src/App.tsx
```

Possibly minor additions to:

```text
src/index.css
```

Only if prototype-specific utility styles are needed.

---

## What will not change

- No database schema changes
- No authentication logic changes
- No role-routing changes
- No production dashboard behavior changes
- No existing customer or merchant flows removed
- No backend functions changed
- No public navigation changes unless requested later

---

## QA checklist

After implementation, verify:

- `/prototype` loads successfully
- Mobile screens look polished at 390–440px widths
- Desktop screens look polished at 1280–1440px widths
- Device switcher works
- Flow switcher works
- Clickable prototype navigation works
- Existing production routes still load
- Existing auth routes remain unchanged
- No TypeScript or import errors
- Downloadable PNG/PDF artifacts are generated
- Each generated artifact is visually inspected for:
  - clipped text
  - overlapping cards
  - bad spacing
  - low contrast
  - broken alignment
  - incorrect ordering

---

## Kick-off sequence

### Step 1

Build the `/prototype` route and reusable prototype shell.

### Step 2

Build the mobile customer prototype screens.

### Step 3

Build the mobile merchant prototype screens.

### Step 4

Add desktop marketing and dashboard prototype screens.

### Step 5

Generate PNG and PDF design boards.

### Step 6

Perform visual QA and fix layout issues.

### Step 7

Deliver the interactive route and downloadable artifacts.
