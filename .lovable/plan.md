

## Plan: 5 Feature Requests Implementation

### Overview
This plan covers: (1) Stripe payment integration for pricing plans, (2) digital wallet guidance, (3) testimonials in customer nav, (4) reward images with merchant logo in customer dashboard + reward editing for merchants, and (5) SMS notifications for birthday/monthly offers via Twilio.

---

### 1. Enable Stripe + Payment Flow for Pricing Page

**Prerequisite:** Enable Stripe using the `stripe--enable_stripe` tool. This will collect the Stripe secret key and expose further Stripe tools for creating products/prices and checkout sessions.

**After Stripe is enabled:**
- Create Stripe products + prices for Growth ($29/mo) and Pro ($79/mo) plans
- Create an edge function `create-checkout-session` that:
  - Accepts `plan` (growth/pro), creates a Stripe Checkout session
  - Sets `success_url` and `cancel_url` back to the app
  - On success, updates `merchant_subscriptions` table
- Create a webhook edge function `stripe-webhook` to handle `checkout.session.completed` and `customer.subscription.updated` events, updating the merchant's plan in the database
- Update `src/pages/Pricing.tsx`: Growth/Pro CTAs call the checkout edge function instead of linking to `/get-started`. Free plan still links to signup.

**Files:** `src/pages/Pricing.tsx`, new edge functions `create-checkout-session` + `stripe-webhook`, migration if needed for Stripe customer ID on merchant_subscriptions

---

### 2. Digital Wallet Integration

Apple Wallet and Google Wallet require external developer credentials:
- **Apple Wallet:** Requires Apple Developer Program ($99/yr), a Pass Type ID certificate, and signing infrastructure to generate `.pkpass` files
- **Google Wallet:** Requires Google Pay API access and a service account to create JWT-based save links

I will document the setup steps and create placeholder buttons that explain the requirements. Full implementation needs these credentials provided by the user.

**Files:** Informational — no code changes until credentials are available

---

### 3. Add Testimonials to Customer Dashboard Navigation

**Current state:** The Header already filters out "Pricing" and "Testimonials" for `/customer/*` routes.

**Change:** Keep "Testimonials" visible for customer pages — only filter out "Pricing".

**Files:** `src/components/Header.tsx` (line 27: remove `"Testimonials"` from the filter)

---

### 4. Reward Images in Customer Dashboard + Merchant Logo + Reward Editing

**4a. Show reward images in customer Access Card:**
- In the rewards section of `AccessCard.tsx`, display `image_url` from rewards as banner-style cards instead of plain text cards
- In the promo carousel, include rewards that have images as visual slides

**4b. Merchant logo for reward banner generation:**
- Add `logo_url` column to `merchants` table (migration)
- In `MerchantSettings.tsx`, add a logo upload field (using the existing `profile-images` storage bucket)
- Update the `ai-merchant-assistant` edge function's `generate_image` mode to accept a `logo_url` parameter and include it in the prompt so the AI generates reward banners incorporating the merchant's logo

**4c. Reward editing for merchants:**
- In `MerchantRewards.tsx`, add an "Edit" button on each reward row
- On click, populate the creation form with the reward's existing data
- Change the form submit to call `UPDATE` instead of `INSERT` when editing
- Add an `editingRewardId` state to track edit mode

**Files:** `src/pages/AccessCard.tsx`, `src/pages/MerchantRewards.tsx`, `src/pages/MerchantSettings.tsx`, `supabase/functions/ai-merchant-assistant/index.ts`, migration for `merchants.logo_url`

---

### 5. SMS Notifications for Birthday and Monthly Offers (Twilio)

**Prerequisite:** Connect Twilio via the `standard_connectors--connect` tool. The user needs a Twilio account with a phone number.

**After Twilio is connected:**
- Create edge function `send-sms-notification` that:
  - Accepts `type` (birthday/monthly_offer), `customer_phone`, `message`
  - Calls Twilio API via the connector gateway to send SMS
- In `MerchantBirthdayOffers.tsx`, add a "Send SMS to birthday customers" button that:
  - Fetches customers with birthdays matching the configured window
  - Calls the SMS edge function for each
- In `MerchantMonthlyOffers.tsx`, add a "Notify Customers" button on each offer that:
  - Fetches all customers with phone numbers who have transacted with this merchant
  - Sends them an SMS about the offer
- Add a `phone` field requirement note in customer signup to ensure phone numbers are collected

**Files:** New edge function `send-sms-notification`, `src/pages/MerchantBirthdayOffers.tsx`, `src/pages/MerchantMonthlyOffers.tsx`

---

### Implementation Order
1. Request 3 — Testimonials nav fix (1-line change)
2. Request 1 — Enable Stripe, then implement payment flow
3. Request 4 — Reward images + logo + editing
4. Request 5 — Twilio SMS (requires connector setup)
5. Request 2 — Digital wallet guidance

### Files Summary
| File | Change |
|------|--------|
| `src/components/Header.tsx` | Keep Testimonials visible for customers |
| `src/pages/Pricing.tsx` | Stripe Checkout integration |
| `src/pages/MerchantRewards.tsx` | Add edit functionality |
| `src/pages/AccessCard.tsx` | Show reward images as banners |
| `src/pages/MerchantSettings.tsx` | Logo upload |
| `src/pages/MerchantBirthdayOffers.tsx` | SMS send button |
| `src/pages/MerchantMonthlyOffers.tsx` | SMS notify button |
| `supabase/functions/ai-merchant-assistant/index.ts` | Accept logo_url in image generation |
| `supabase/functions/create-checkout-session/index.ts` | New — Stripe checkout |
| `supabase/functions/stripe-webhook/index.ts` | New — Stripe webhook handler |
| `supabase/functions/send-sms-notification/index.ts` | New — Twilio SMS sender |
| Migration | Add `logo_url` to merchants, Stripe fields to merchant_subscriptions |

