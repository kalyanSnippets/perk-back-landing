

## Admin Panel + Testimonial Submission + Blog Management

### Overview

Build three things:
1. A role-based admin system using a `user_roles` table
2. A customer testimonial submission form (admin approves before publishing)
3. An admin panel with blog management (rich text editor) and testimonial moderation

---

### Phase 1: Database — Admin Roles

**Migration:**
- Create enum `app_role` with values: `admin`, `moderator`, `user`
- Create `user_roles` table (id, user_id, role, unique constraint on user_id+role)
- Enable RLS on `user_roles`
- Create `has_role` security definer function
- Add RLS policies: admin SELECT on user_roles, no public access
- Add INSERT/UPDATE policies on `blogs` and `testimonials` for admin role
- Add UPDATE policy on `testimonials` for `is_published` (admin only)

---

### Phase 2: Testimonial Submission

**Update `src/pages/AccessCard.tsx`** (customer dashboard):
- Add a "Write a Review" button/section
- Form: message (textarea), rating (1-5 stars clickable)
- Auto-fills name from customer profile
- Inserts into `testimonials` with `is_published = false`
- Success toast: "Thank you! Your testimonial will be reviewed."

**Migration:** Add INSERT policy on `testimonials` for authenticated users (with check `is_published = false` to prevent self-publishing)

---

### Phase 3: Admin Panel

**Create `src/pages/AdminPanel.tsx`** (`/admin`):
- Protected route: checks `has_role(auth.uid(), 'admin')` via RPC or direct query
- If not admin, redirect to home

**Tabs:**

1. **Blog Management**
   - List all blogs (published and drafts)
   - Create/Edit blog form: title, slug (auto-generated from title), excerpt, content (rich text editor using a lightweight library like `react-quill` or `@tiptap/react`), featured image URL, author name, published_at, is_published toggle
   - Delete blog option
   - Rich text editor for content field

2. **Testimonial Moderation**
   - List all testimonials (show published status)
   - Toggle `is_published` on/off
   - Edit capability (name, role, business_name, message, rating)
   - Delete option

3. **Contact Messages** (read-only)
   - List submitted contact form messages
   - Show name, email, business, message, date
   - Add SELECT policy on `contact_messages` for admin role

**Add route** `/admin` in `App.tsx`

---

### Phase 4: Navigation

- Add "Admin" link in Header (only visible when user has admin role)
- Use a hook or context to check admin status

---

### Technical Details

- **Rich text editor**: Use `@tiptap/react` with `@tiptap/starter-kit` — lightweight, modern, good DX
- **Blog content rendering**: In `BlogPost.tsx`, render HTML content safely using `DOMPurify` + `dangerouslySetInnerHTML` (admin-authored content is trusted but sanitized as defense-in-depth)
- **Admin check**: Create a reusable `useIsAdmin` hook that queries `user_roles` table
- **Star rating input**: Build a simple clickable star component for testimonial submission

### Files Created
- `src/pages/AdminPanel.tsx`
- `src/hooks/useIsAdmin.ts`
- `src/components/StarRating.tsx`

### Files Modified
- `src/pages/AccessCard.tsx` (add testimonial submission)
- `src/pages/BlogPost.tsx` (render rich text content)
- `src/components/Header.tsx` (admin nav link)
- `src/App.tsx` (add `/admin` route)

### Migrations
- Create `app_role` enum + `user_roles` table + `has_role` function
- Add INSERT policy on `testimonials` for authenticated users
- Add INSERT/UPDATE/DELETE/SELECT policies on `blogs` for admin
- Add UPDATE/DELETE policy on `testimonials` for admin
- Add SELECT policy on `contact_messages` for admin

### NPM Packages
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image` (rich text editor)
- `dompurify` + `@types/dompurify` (HTML sanitization for blog rendering)

