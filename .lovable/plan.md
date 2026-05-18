# Plan: 6-Digit OTP Verification for Signup (Customer + Merchant)

## Goal
After clicking "Create Account" (customer or merchant), the user is taken to a verification page where they enter the 6-digit code emailed to them. On success, they get logged in and continue through the normal post-signup flow (customer → access card / merchant → dashboard).

Login (returning users) stays as email + password. Only signup verification changes.

## How Supabase OTP works (technical note)
Supabase's standard email signup already generates a 6-digit token (`{{ .Token }}`) in addition to the confirmation link. The token is passed to our custom `auth-email-hook` as `payload.data.token` (already mapped in `auth-email-hook/index.ts`). We just need to:
1. Show the code in the signup email instead of (or alongside) the button.
2. Verify it client-side with `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.

No Supabase auth config change required. No magic-link setup required.

## Changes

### 1. Update signup email template
File: `supabase/functions/_shared/email-templates/signup.tsx`
- Add `token` to `SignupEmailProps`.
- Replace the "Get Started" button with a large, bold, letter-spaced 6-digit code block (styled in PerkBack navy `#0a1f5c`).
- Keep welcome heading and the "if you didn't sign up, ignore" footer.
- Add a short line: "Enter this code in the app to verify your email. It expires in 1 hour."
- Keep logo + DM Sans / brand colors.

File: `supabase/functions/auth-email-hook/index.ts`
- Already passes `token: payload.data.token` in `templateProps` — no change needed.

Deploy `auth-email-hook` after edits.

### 2. Create a shared verification page
New file: `src/pages/VerifyOtp.tsx`
- Route: `/verify` (handles both customer and merchant).
- Reads `email` and `role` (`customer` | `merchant`) from `location.state` (passed by the auth pages).
- Uses `<InputOTP>` (already in `src/components/ui/input-otp.tsx`) for a clean 6-digit input.
- On submit: `supabase.auth.verifyOtp({ email, token: code, type: 'signup' })`.
- On success: 
  - `customer` → navigate to `/customer/confirmation` (existing post-signup flow that issues loyalty card).
  - `merchant` → navigate to `/merchant/confirmation` (existing onboarding flow).
- "Resend code" button → `supabase.auth.resend({ type: 'signup', email })`.
- "Wrong email?" link → back to the relevant auth page.
- Branded UI matching PerkBack (navy header, rounded-2xl card, DM Sans).

Register route in `src/App.tsx`.

### 3. Update auth pages to route to verification
File: `src/pages/CustomerAuth.tsx` (signup branch)
- After `signUp()` succeeds, instead of `navigate("/customer/confirmation")`, do:
  `navigate("/verify", { state: { email, role: "customer" } })`.
- Replace the toast to: "We sent a 6-digit code to your email."

File: `src/pages/MerchantAuth.tsx` (signup branch, line ~129)
- Same change: `navigate("/verify", { state: { email, role: "merchant" } })`.

Login branches (existing email + password) are unchanged.

### 4. No database changes
No migrations. No new tables. No Supabase auth config changes.

## Out of scope (for this change)
- Login OTP (returning users keep password login).
- Password reset templates (already handled by `recovery.tsx`).
- Disabling password signup entirely.

## Files touched
- `supabase/functions/_shared/email-templates/signup.tsx` (edit)
- `src/pages/VerifyOtp.tsx` (new)
- `src/App.tsx` (add route)
- `src/pages/CustomerAuth.tsx` (redirect after signup)
- `src/pages/MerchantAuth.tsx` (redirect after signup)
- Deploy: `auth-email-hook`
