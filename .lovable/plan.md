

## Problem

The signup flow calls `supabase.auth.signUp()` for merchant registration, but the email already exists as a customer account. Supabase returns `422: User already registered`. The code doesn't handle this gracefully.

## Solution

Modify the signup handler in `GetStarted.tsx` to handle the "user already exists" scenario:

### Changes to `src/pages/GetStarted.tsx`

1. **In `handleSignUp`**: Catch the "User already registered" error (status 422 / error code `user_already_exists`)
2. **When caught**: Automatically attempt to sign the user in with their password, then create the missing profile (merchant or customer) for them
3. **Show a helpful message**: e.g. "Account exists — we've added your merchant profile. Redirecting..."

### Detailed logic change in `handleSignUp`:

```
try signUp(email, password, metadata)
if error.message includes "User already registered":
  → sign in with email + password
  → check if the role-specific profile exists
  → if not, create it (e.g. insert into merchants table)
  → redirect to appropriate dashboard
  → toast: "Merchant profile added to your existing account!"
else if other error:
  → throw as before
```

### Migration: None needed

The `merchants` table already has an INSERT RLS policy (`auth.uid() = user_id`), and the user will be authenticated at the point of insert, so no DB changes are required.

### Files modified
- `src/pages/GetStarted.tsx` — update `handleSignUp` to handle existing user case

