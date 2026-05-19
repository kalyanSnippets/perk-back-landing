
## Background

The product has already moved technically to white-label cards: each merchant has a `merchant_card_designs` row, customers see a wallet of branded `MerchantLoyaltyCard`s in `MerchantCardWallet`, and merchants edit their card in `CardDesignTab`. What is still stuck in the old "one card / one wallet" world is (a) the public marketing copy and (b) a handful of supporting features that were designed around a single PerkBack-branded card.

Below is everything I'd change, grouped by area.

---

## 1. Marketing & content rewrites (copy-only)

Every place that says "One card. One wallet." needs to be reframed around "your store's own branded loyalty card, in one app."

Files and exact phrases:

- `src/components/HeroSection.tsx` (line 59–66)
  - Headline: "Earn rewards everywhere. **One card. One wallet.**"
  - Subhead positions PerkBack as a consumer wallet.
  - New direction: "**Your store. Your card. Your customers.**" with merchant-led subhead, e.g. "PerkBack gives every business a fully branded digital loyalty card — and gives customers one app to carry them all."
- `src/components/Footer.tsx` (line 15) — "Earn rewards everywhere. One card. One wallet." → "Branded loyalty cards for every business. One app for every customer."
- `src/components/BenefitsSection.tsx` (line 5) — "One card for everything / All your loyalty programs in a single digital wallet" → reframe customer benefit as "**Every store, beautifully branded** — each merchant's card looks and feels like their brand."
- `src/pages/AboutUs.tsx` (line 58) — Simplicity copy "One card, one wallet — no complexity" → "Every brand, beautifully presented — no generic cards."
- `src/components/onboarding/OnboardingCarousel.tsx` (line 14) — eyebrow "One card" → "Your store's card" (and rewrite the slide body).
- `src/pages/CustomerJoin.tsx` and `src/components/prototype/CustomerJoinPrototype.tsx` — review the join hero text; customer should expect "you're getting **{StoreName}**'s loyalty card", not a generic PerkBack card.
- `src/components/prototype/MobileCustomerPrototype.tsx` — same; prototype mockups should show a branded card, not the generic PerkBack one.

Add a new merchant-facing benefit (replacing or sitting alongside customer benefits in `BenefitsSection`):
- "Fully branded card" — your colours, logo, background image.
- "Owned customer relationship" — customers see your brand, not ours.
- "Works with your POS / Square / NFC out of the box."

SEO follow-ups in `index.html` and per-page `<title>` / meta description: shift from "digital loyalty wallet" keywords to "white-label / branded digital loyalty card for small business."

---

## 2. Visual assets that still show the old unified card

- `src/components/HeroSection.tsx` hero illustration / `LoyaltyCard` previews — anywhere a generic navy PerkBack card is rendered as a marketing visual, swap to a small carousel or stack of 2–3 differently branded cards (cafe / retail / restaurant) to communicate "white-label" at a glance.
- `RewardsShowcase`, `HowItWorks`, prototype screens — same treatment: show multiple coloured cards, not one.
- Onboarding carousel illustrations and screenshots in `MobileCustomerPrototype` / `CustomerJoinPrototype`.
- OG/social share image (whatever `index.html` references) — regenerate showing several branded cards.

This is the single biggest perception change. Copy alone won't shift the story.

---

## 3. Customer-side product gaps

Most of the runtime is already white-labelled, but a few touch points still feel "PerkBack-first":

- **AccessCard "My Card" tab**: confirm it uses `MerchantCardWallet` everywhere and that the empty state ("Visit a store on Explore to add your first loyalty card") is the primary message for new customers. Today the legacy `LoyaltyCardFlip` (single PerkBack card) is still present as a fallback — recommend deleting it so we never accidentally render the unified card.
- **Customer dashboard hero / points widget** (`HeroPointsCard`, etc.): currently shows a single global points number. Under white-label this should default to **points per merchant**, with global only as a secondary roll-up — otherwise customers ask "why does my Cafe X balance not match the big number?"
- **Mobile app (`perkback-mobile/`)**: `app/(tabs)/my-card.tsx` and `src/components/ui/LoyaltyCard.tsx` still render the old unified PerkBack card with global `points_balance`. Needs the same `MerchantCardWallet` treatment + per-merchant points.
- **Wallet passes (Apple/Google)**: today they are unified PerkBack-branded. Memory already flags this as Phase 2. For white-label to feel real to the customer, this is the next big build — one wallet pass per enrolled merchant, using that merchant's colours/logo. Until then, add UI copy that explains the wallet pass is the "universal" version.
- **Loyalty card number / CRN**: we kept one global card number so POS/NFC/Square keep working. Worth documenting on the marketing site ("one scannable code, every store's card visually") so customers don't expect a different barcode per merchant.

---

## 4. Merchant-side product gaps

- **Onboarding**: after the existing branding step (logo, address, industry), add a "**Design your card**" step that walks the merchant through `CardDesignTab` before they land in the dashboard. First impression should be "I just made my own card."
- **Card Design tab polish**: ensure live preview, contrast warning, and a "Reset to PerkBack default" exist. Add a "Preview as customer" link.
- **Merchant share / QR poster** (`CounterQrPoster`): currently generic. Should render with the merchant's card design so the printed poster matches what the customer sees in-app.
- **Plan gating**: decide whether custom backgrounds / advanced card styling are a Pro/Growth feature. If yes, wire it through `merchant_feature_overrides` + `LockedFeature`.
- **Email templates** (`supabase/functions/_shared/email-templates/*`): welcome/recovery emails currently use PerkBack branding only. For white-label, customer-facing transactional emails sent in the context of a specific merchant (e.g. reward redeemed, points earned) should co-brand with the merchant's colours/logo. This needs a small templating pass.

---

## 5. New things to build (recommended, not yet in repo)

1. **Per-merchant wallet pass** (Apple + Google) — biggest gap; requires generating one pass per `customer_merchants` row with that merchant's design.
2. **Merchant card preview share link** — public URL `/card-preview/{slug}` that renders the branded card so the merchant can show it off / share on socials.
3. **Branded customer landing page per merchant** (`/m/{slug}` or `/join/{slug}`): already partly there via `CustomerJoin`, but it should be skinned in the merchant's colours, not PerkBack navy.
4. **"Designed by {Store}" footer** in customer views when looking at a specific merchant's context, with a soft "Powered by PerkBack" line — the inverse of today's hierarchy.
5. **Marketing page section: "How white-label works"** — 3-step explainer (Upload logo → Pick colours → Customers get your card) on the home page and a dedicated `/white-label` page for SEO.
6. **Case study / testimonials rewrite** — current testimonials likely talk about "one wallet." Rewrite around "my customers see *my* brand."

---

## 6. Cleanup

- Delete or archive `src/components/customer/LoyaltyCardFlip.tsx` once nothing imports it (memory already notes it's safe to remove).
- Remove the generic PerkBack `LoyaltyCard` in `perkback-mobile/src/components/ui/LoyaltyCard.tsx` once the mobile wallet view is in place.
- Audit any blog posts in `blogs` table for unified-card language.

---

## What this plan does *not* include

- No database schema changes — `merchant_card_designs` already exists and is sufficient.
- No changes to POS/Square/NFC integration — the shared global `loyalty_card_number` stays (this is by design, per memory).
- No pricing changes — only flagged as a question (should card customisation be plan-gated?).

---

## Suggested execution order

1. **Copy + hero visual swap** on `HeroSection`, `BenefitsSection`, `Footer`, `AboutUs`, onboarding carousel. (1 pass, high impact.)
2. **Customer dashboard**: make per-merchant points the primary number, delete `LoyaltyCardFlip`.
3. **Mobile app `my-card.tsx`** white-label parity.
4. **Merchant onboarding "Design your card" step** + branded QR poster.
5. **New `/white-label` marketing page + SEO meta updates.**
6. **Phase 2 — per-merchant wallet passes** (largest engineering effort).
7. **Co-branded transactional emails.**

Want me to start with step 1 (copy + visuals across the marketing site), or would you prefer I tackle a different slice first?
