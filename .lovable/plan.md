
The user wants to bootstrap `madurikalyan27@gmail.com` as the first platform admin so they can access `/admin` and manage other admins via the existing Users tab.

This is a one-row data insert into `public.user_roles` — no schema change, no code change. After this, the user logs in with that account and sees the Admin Panel.

## Plan

1. Look up the `user_id` for `madurikalyan27@gmail.com` in `auth.users`.
2. Insert a row into `public.user_roles` with that `user_id` and role `'admin'` (idempotent — skip if already exists).
3. Confirm by re-querying `user_roles` joined with `auth.users`.

## After it's applied

- Log out, then log back in as `madurikalyan27@gmail.com`.
- Navigate to `/admin` — you'll now see the Admin Panel with all 6 tabs (Platform, Blogs, Reviews, Messages, Users, Plans).
- Open the **Users** tab to grant/revoke admin on any other account using the existing toggle UI.

No code files will change.
