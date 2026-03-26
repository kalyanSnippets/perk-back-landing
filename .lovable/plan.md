

## Fix Admin Panel Access — Two Bugs

### Bug 1: RLS chicken-and-egg on `user_roles`

The only SELECT policy on `user_roles` is "Admins can view user_roles" which uses `has_role(auth.uid(), 'admin')`. But `has_role` is a `SECURITY DEFINER` function that queries `user_roles` directly — it bypasses RLS. So `has_role` works fine.

However, `useIsAdmin` does a **direct client query** via `supabase.from("user_roles").select(...)`, which goes through RLS. Since the only SELECT policy requires `has_role(auth.uid(), 'admin')`, and that function works via security definer, this should actually work — BUT only for users who ARE admin. Let me re-examine...

Actually, `has_role` is `SECURITY DEFINER` so it bypasses RLS. The RLS policy `USING (has_role(auth.uid(), 'admin'))` calls this function which succeeds for admin users. So the direct query from `useIsAdmin` should return the row for Kalyan.

The real issue may be simpler: the hook only runs once on mount, before auth is ready.

### Bug 2: Hook doesn't react to auth changes (confirmed root cause)

`useIsAdmin` uses `useEffect([], [])` — runs once on mount. If Header mounts before the Supabase session is restored from localStorage, `getUser()` returns null, `isAdmin` stays false, and it never re-checks.

### Fix

**Migration** — Add a self-lookup SELECT policy as defense-in-depth:
```sql
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Update `src/hooks/useIsAdmin.ts`** — Add `onAuthStateChange` listener:
```typescript
useEffect(() => {
  const check = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    const { data } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  };
  check();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { check(); });
  return () => subscription.unsubscribe();
}, []);
```

### Files modified
- `src/hooks/useIsAdmin.ts` — add auth state listener + cleanup
- Migration — add "Users can view own roles" SELECT policy

