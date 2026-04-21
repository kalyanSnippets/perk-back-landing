

## Ship the Customer First-Touch journey to production

Move the approved 10-screen prototype out of `/prototype` and into the real app as a live, mobile-first customer onboarding flow that starts when someone scans a merchant QR code.

---

### What the customer will experience

```text
Scan QR at counter
        │
        ▼
  /join/:merchantSlug
        │
   ┌────┴─────────────────────────────────────────┐
   │ Already signed in?                           │
   │   yes → link merchant → /customer/access-card│
   │   no  → continue ↓                           │
   └────┬─────────────────────────────────────────┘
        ▼
 Splash (1.2s brand moment)
        ▼
 Merchant Welcome (logo + hero + "Join now")
        ▼
 Onboarding carousel (3 slides, skippable)
        ▼
 Step 1 of 2 — Quick questions (name, mobile, DOB)
        ▼
 Step 2 of 2 — Create wallet (email + password, or Google/Apple)
        ▼
 Card Ready celebration (CRN + loyalty number revealed)
        ▼
 /customer/access-card  (wallet home)
```

Total time target: under 60 seconds from QR scan to wallet.

---

### What gets built

**New route**
- `/join/:merchantSlug` — single mobile-optimised page that orchestrates all 10 screens via internal step state. Desktop visitors see the same flow inside a centered mobile frame so the experience stays consistent.

**New page** `src/pages/CustomerJoin.tsx`
- Loads the merchant by slug (logo, name, industry, distance is optional).
- Manages step state: `splash → welcome → onboarding → questions → wallet → ready`.
- On submit: creates the Supabase auth user, writes the customer profile, generates CRN + loyalty number, links the customer to the merchant, then routes to `/customer/access-card`.

**Reused production components (extracted from the prototype)**
The 10 prototype screens become real, reusable components under `src/components/customer-join/`:
- `JoinSplash.tsx`
- `MerchantWelcome.tsx`
- `JoinOnboarding.tsx` (3-slide carousel, skippable)
- `QuickQuestionsForm.tsx` (React Hook Form + Zod)
- `CreateWalletForm.tsx` (email/password + Google + Apple)
- `CardReady.tsx` (celebration with real CRN + card number)

All copy from the approved prototype is carried over verbatim. Visual styling, gradients, photography, merchant logo treatment and animations match the prototype exactly.

**Auth integration**
- Email + password signup using existing Supabase auth (same pattern as `CustomerAuth.tsx`).
- Google and Apple OAuth using the existing providers already wired in `GetStarted`.
- After OAuth return, the user lands back on `/join/:merchantSlug?step=ready` and the merchant link + card generation completes automatically.

**Database work** (one migration)
- New table `customer_merchants (customer_id, merchant_id, joined_at, source)` with RLS so a customer can only see their own links and a merchant can only see customers linked to them.
- `slug` column added to `merchants` (auto-generated from `store_name` if missing) so QR codes can use friendly URLs like `/join/bean-society`.
- Reuse existing CRN + `loyalty_card_number` generation already in the `customers` table flow — no changes to that logic.

**QR code surface for merchants**
- A new "Counter QR" panel inside `MerchantSettings` that renders the merchant's `/join/:slug` URL as a downloadable PNG poster matching the prototype's poster design (logo, store name, "Scan to join", PerkBack footer). Merchants can print this and put it on the counter.

---

### Mobile-first behaviour

- Page always renders in a single-column mobile layout regardless of viewport (max-width 420px, centered, with the existing prototype-style chrome around it on desktop).
- Uses the same `safe-top` / `safe-bottom` utilities already in the codebase so it works inside the iOS PWA and the Capacitor native shell.

---

### Out of scope for this build (kept for v2)

- Geolocation distance ("120 m away") — shown as static for v1, wired to real geo in v2.
- "Add to Apple / Google Wallet" button on the Card Ready screen will route into the existing `apple-wallet-pass` / `google-wallet-pass` edge functions but its UI is unchanged.
- Merchant-side analytics for "joined via QR" — the `source` column is captured now so the dashboard widget can be added later.

---

### Acceptance criteria

- Visiting `/join/bean-society` on a phone shows the splash, then the full 10-screen flow exactly as in the prototype.
- A new customer can sign up with email/password OR Google OR Apple and lands on `/customer/access-card` with a real CRN and 10-digit loyalty number visible.
- An already-signed-in customer scanning a new merchant's QR is silently linked to that merchant and routed straight to `/customer/access-card` with a toast: "You're now earning at Bean Society".
- The customer–merchant link appears in `customer_merchants` and the merchant's customer count updates.
- The merchant can download their counter QR poster from Settings.
- All existing routes, auth flows, and dashboards continue to work unchanged.
- No regressions in the `/prototype` lab — the prototype stays as a reference.

