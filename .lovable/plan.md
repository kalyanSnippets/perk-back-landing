

## Diagnosis

**The user `madurikalyan@gmail.com` does not exist in the database.** Only `madurikalyan27@gmail.com` exists. So "invalid credentials" for `madurikalyan@gmail.com` is correct — there is no such account.

**The "redirect to merchant dashboard after customer signup" issue** is caused by `handle_new_user` trigger + `GetStarted.tsx` signup flow:

1. The merchant account `madurikalyan27@gmail.com` already exists (one auth user, with both a `customers` row AND a `merchants` row — created automatically by `handle_new_user` trigger when role=merchant).
2. When the user opens GetStarted and tries to "Sign up as Customer" with the **same email + password** as the existing merchant:
   - Supabase returns `422 user_already_exists`.
   - `handleSignUp()` (line 161-194) detects this, calls `signInWithPassword`, succeeds (since password matches), then checks if a `customers` row exists. It already does (created by trigger), so no insert happens.
   - It calls `window.location.reload()`.
3. After reload, `AuthProvider` re-detects roles: user has BOTH merchant and customer rows → `userRole = "merchant"` (line 87 of AuthContext: `isMerchant ? "merchant" : isCustomer ? "customer"`).
4. `GetStarted` useEffect (line 50) sees both → routes to `/choose-role`. But if the customer was on a clean tab, they'd be sent to merchant dashboard because `isMerchant` short-circuits.

The real bug: **the system silently merges a "customer signup" into an existing merchant account and never lands the user in the customer flow they explicitly chose.** No confirmation page is ever shown.

## Fix Plan

### 1. `src/pages/GetStarted.tsx` — `handleSignUp()` (existing-user branch)
After signing the user in to their existing account and ensuring the customer row exists:
- Do NOT call `window.location.reload()`.
- Explicitly navigate to `/customer/confirmation` when `role === "customer"` was the chosen signup intent.
- Show a clearer toast: *"Welcome back! We've added a customer profile to your existing account."*
- Symmetrically, for merchant intent on an existing account → navigate to `/merchant/dashboard` (or onboarding) instead of reload.

### 2. `src/pages/GetStarted.tsx` — auto-redirect useEffect (lines 47-57)
Add a guard so the auto-redirect does NOT fire while the user is mid-signup. Use a `signupInProgress` ref/state set true at the start of `handleSubmit` and cleared after the explicit `navigate()` call. This prevents the dual-role auto-route from overriding the intentional post-signup destination.

### 3. `handleLogin()` (lines 203-220) — same email login behaviour
Currently a dual-role login goes to `/choose-role`, which is correct. No change needed, BUT add: if user came from a "Sign up as Customer" intent and only one role exists post-merge, route to that role's landing page directly.

### 4. UX clarification on the existing-account merge
Before silently merging, surface a confirmation toast + slight delay so the user understands a customer profile was added to their existing merchant login (rather than a brand-new account being created).

### 5. Regarding `madurikalyan@gmail.com` "invalid credentials"
No code fix needed. That email has no account. User should either:
- Sign up fresh with that email, OR
- Use the existing `madurikalyan27@gmail.com` account.

### Files to modify
- `src/pages/GetStarted.tsx` — adjust post-signup navigation in the existing-user branch and guard the auto-redirect effect.

No DB, edge function, or other component changes needed.

### Validation
1. Log out completely.
2. Open GetStarted → Sign up as Customer using `madurikalyan27@gmail.com` + the merchant's password.
3. Expect: toast "customer profile added", land on `/customer/confirmation` (or access card), NOT merchant dashboard.
4. Log out, log back in with same email → land on `/choose-role` (both profiles present).

