

## Fix: Slow Page Loading and Routing

### Root Cause

Every page load is blocked by the `AuthContext` `loading` state, which stays `true` until **3 parallel database queries** complete (checking `user_roles`, `merchants`, `customers` tables). On top of that:

1. **Double execution** — Both `onAuthStateChange` AND `getSession` fire on mount, each calling `detectRole` with 3 DB queries = 6 queries total on every page load
2. **GetStarted page adds more** — It runs its own `checkSession` + `redirectByRole` (2 more DB queries) independently
3. **All pages blocked** — Even public pages (Home, About, Pricing) render inside `AuthProvider`, so they wait for auth + role detection to finish before rendering

### Fix

#### 1. Prevent double role detection in AuthContext
**File:** `src/contexts/AuthContext.tsx`
- Use a `ref` to track if `getSession` has already resolved. When `onAuthStateChange` fires for the initial session (which is the same session), skip the duplicate `detectRole` call.
- Pattern: `getSession` is the primary bootstrap path. `onAuthStateChange` only calls `detectRole` for subsequent auth changes (login, logout, token refresh).

#### 2. Don't block public page rendering on auth
**File:** `src/App.tsx`
- Move `AuthProvider` to wrap only the `Routes` (already done), but the real fix is in AuthContext: render `children` immediately and let `loading` only gate `ProtectedRoute`, not all page content.
- Public pages already don't use `ProtectedRoute`, but the `Header` component calls `useAuth()` which triggers a re-render when loading changes. This is fine — `Header` should just show the non-logged-in state while loading.

#### 3. Cache role in sessionStorage for instant restore
**File:** `src/contexts/AuthContext.tsx`
- On successful role detection, cache the result in `sessionStorage` (e.g., `perkback_role`)
- On mount, read the cached role immediately to set initial state — this makes protected pages render instantly on refresh
- Still run `detectRole` in background to verify/update the cache

#### 4. Remove duplicate session check from GetStarted
**File:** `src/pages/GetStarted.tsx`
- Replace the `checkSession` + `redirectByRole` useEffect with `useAuth()` — redirect based on `isCustomer`/`isMerchant` from context instead of making separate DB queries

### Files Changed
| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Prevent double detectRole, add sessionStorage cache for roles |
| `src/pages/GetStarted.tsx` | Use `useAuth()` instead of separate DB queries for redirect |

### What Stays Unchanged
- All routes, pages, UI, and design
- ProtectedRoute logic
- Auth flow (login/signup/reset)
- All dashboard functionality

