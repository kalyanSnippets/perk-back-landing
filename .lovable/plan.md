# Merchant Auth & Access — Gap Closure Plan

Implements the four selected gaps from the audit of User Stories 1.1, 1.2, and 1.3.

---

## 1. Story 1.1 — Owner Name + Onboarding Redirect

**Database**
- Add `owner_name TEXT` column to `public.merchants` (nullable for backward compat).
- Update `handle_new_user` trigger to read `raw_user_meta_data->>'owner_name'` and persist it.

**UI — `src/pages/MerchantAuth.tsx`**
- Add "Owner Name" input (required) above Store Name in signup form.
- Pass `owner_name` in `signUp` metadata.
- After successful signup, navigate to a new `/merchant/confirmation` route (instead of just toast).

**New page — `src/pages/MerchantConfirmation.tsx`**
- Mirrors `CustomerConfirmation` styling.
- "Check your email to verify your account" message + Resend link.
- After the user confirms email and logs in, the existing post-login flow takes them to `/merchant/dashboard`. First-time merchants whose profile is incomplete will already land in the onboarding banner inside `MerchantSettings` (already in the codebase).

**Routing — `src/App.tsx`**
- Add `<Route path="/merchant/confirmation" element={<MerchantConfirmation />} />`.

---

## 2. Story 1.2 — Password Hardening

**Auth config (`configure_auth`)**
- `password_hibp_enabled: true` → enables Have I Been Pwned check.
- Keep auto-confirm OFF (already off — confirmation email required).

**UI**
- Bump `minLength={6}` → `minLength={8}` on both `MerchantAuth.tsx` and `ResetPassword.tsx` password inputs.
- Add a short helper line under the password field: "At least 8 characters. Avoid common or breached passwords."
- Surface HIBP rejection messages from Supabase verbatim in the existing toast.

---

## 3. Story 1.3 — Tighten Rewards & Monthly Offers RLS

Today any authenticated user (including a competing merchant) can `SELECT` every active reward and monthly offer. Replace with merchant-scoped + customer-scoped policies.

**Migration**
- Drop `Authenticated users can view active rewards` on `public.rewards`.
- Drop `Authenticated users can view active monthly_offers` on `public.monthly_offers`.
- Drop `Authenticated users can view active product offers` on `public.product_offers`.
- Drop `Authenticated users can view active promotions` on `public.promotion_rules`.
- Recreate each as: `active = true AND merchant_id IN (SELECT cm.merchant_id FROM customer_merchants cm JOIN customers c ON c.id = cm.customer_id WHERE c.user_id = auth.uid())`.
- The existing "Merchants can manage own …" policy already covers the owning merchant's reads.

**Impact check**
- `ExploreTab` shows active rewards from merchants the customer is *not* yet enrolled with. To preserve discovery, create a security-definer RPC `get_public_rewards_for_discovery(_merchant_ids uuid[])` that returns minimal public reward fields (title, description, points_required, image_url) for any merchant. Call it from `ExploreTab` and `MerchantPreview`.
- Same pattern for monthly offers if they appear in discovery (verify usage).

---

## 4. POS API Key Management (+ Optional MFA)

**Database**
- Add to `public.merchants`: `api_key_hash TEXT`, `api_key_prefix TEXT`, `api_key_created_at TIMESTAMPTZ`, `api_key_last_used_at TIMESTAMPTZ`. Never store the raw key.
- New table `merchant_api_key_log` (merchant_id, action `created|rotated|revoked|used`, ip, user_agent, created_at) with merchant-scoped SELECT RLS + service-role insert.

**RPCs (security definer, `set search_path = public`)**
- `generate_merchant_api_key()` → returns the plaintext key **once** + stores hash; revokes any existing key. Verifies caller owns the merchant.
- `revoke_merchant_api_key()`.
- Edge functions verifying a POS request hash the incoming key with the same algorithm and update `api_key_last_used_at`.

**UI — new tab in `MerchantSettings.tsx` ("API Keys")**
- Show prefix (e.g. `pk_live_a1b2…`), created date, last used.
- "Generate Key" button (warns existing key will be revoked) → modal showing the plaintext once with copy-to-clipboard.
- "Revoke" button.
- Recent API key activity log (last 20 entries from `merchant_api_key_log`).

**MFA (optional toggle)**
- New "Security" sub-section in the same tab with "Enable two-step verification" using Supabase's built-in TOTP (`supabase.auth.mfa.enroll` / `challenge` / `verify`). Renders a QR code, accepts a 6-digit code, then marks the factor verified.
- After enrolment, `MerchantAuth` login flow detects `aal: aal1` and prompts for the TOTP code before navigating to dashboard.
- No DB changes — Supabase handles MFA factors.

---

## Technical Details

**Files to create**
- `src/pages/MerchantConfirmation.tsx`
- `src/components/merchant/ApiKeysTab.tsx`
- `src/components/merchant/MfaEnrollDialog.tsx`
- `src/components/merchant/MfaChallengeDialog.tsx`
- 1 migration: schema changes + dropped/recreated policies + new RPCs.

**Files to edit**
- `src/pages/MerchantAuth.tsx` — owner name field, redirect, MFA challenge on login, password helper.
- `src/pages/ResetPassword.tsx` — minLength 8.
- `src/pages/MerchantSettings.tsx` — add "API Keys" tab.
- `src/components/customer/ExploreTab.tsx` & `MerchantPreview.tsx` — switch reward fetch to new RPC.
- `src/App.tsx` — register `/merchant/confirmation` route.

**Auth config call**
- One `configure_auth` invocation with `password_hibp_enabled: true`, leaving other flags as-is.

**Out of scope (explicitly deferred)**
- Server-side rate-limiting on forgot-password requests (Supabase already throttles).
- Audit log of unauthorized access attempts (RLS denials are not loggable from the client).
- Email change re-verification flow.

---

## Acceptance verification after build
- Sign up new merchant → redirected to `/merchant/confirmation`; record has `owner_name`.
- Try password "password" → blocked by HIBP.
- Login as Merchant A, query `rewards` directly → only own rows returned. Customer enrolled with A still sees A's rewards. Discovery RPC still returns rewards for unenrolled merchants.
- Generate API key → shown once, prefix stored, log entry created. Revoke removes hash.
- Enable MFA → next login prompts for 6-digit code before dashboard loads.