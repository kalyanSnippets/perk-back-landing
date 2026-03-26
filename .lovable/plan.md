

## PerkBack Platform Major Update

This is a large scope covering navigation, 5 new pages, database tables, dashboard updates, settings, and fixes. I recommend implementing in 3-4 batches, but here's the full plan.

---

### Phase 1: Database Migrations

Create 3 new tables with RLS:

**`contact_messages`** — id, name, email, business_name, message, created_at. RLS: allow anonymous INSERT (public form), no SELECT for public.

**`testimonials`** — id, name, role, business_name, message, rating (int), profile_image_url, is_published (bool, default false), created_at. RLS: public SELECT where `is_published = true`, authenticated INSERT/UPDATE for admin (future).

**`blogs`** — id, title, slug (unique), excerpt, content (text), featured_image_url, author_name, published_at, is_published (bool, default false), created_at. RLS: public SELECT where `is_published = true`, authenticated INSERT/UPDATE for admin (future).

**`merchants` table** — Add column `profile_image_url` (text, nullable).

**Storage bucket** — Create `profile-images` bucket (public) with RLS for authenticated uploads.

---

### Phase 2: Navigation & Homepage

**Header.tsx** — Update navLinks:
- Remove: "How It Works", "Rewards"
- Change to route-based links: About Us → `/about`, Contact Us → `/contact`, Testimonials → `/testimonials`, Pricing → `/pricing`, Blog → `/blog`

**Index.tsx** — Remove `<Testimonials />` import and component from homepage.

**Footer.tsx** — Update links to match new pages (Contact Us, Testimonials, Pricing, Blog).

---

### Phase 3: New Pages (5 pages)

1. **`src/pages/ContactUs.tsx`** (`/contact`)
   - Form: Name, Email, Business Name, Message
   - Zod validation, submit to `contact_messages` table
   - Success toast on submit
   - Uses Header + Footer

2. **`src/pages/TestimonialsPage.tsx`** (`/testimonials`)
   - Fetch from `testimonials` table where `is_published = true`
   - Card grid: name, role/business, message, rating (stars)
   - Uses Header + Footer

3. **`src/pages/Pricing.tsx`** (`/pricing`)
   - 3 static pricing cards: Free, Growth (highlighted), Pro
   - Features as listed in requirements
   - CTA buttons linking to `/get-started`
   - Uses Header + Footer

4. **`src/pages/Blog.tsx`** (`/blog`)
   - Fetch from `blogs` table where `is_published = true`
   - Card grid: title, image, excerpt, date, "Read More"
   - Uses Header + Footer

5. **`src/pages/BlogPost.tsx`** (`/blog/:slug`)
   - Fetch single blog by slug
   - Full content display
   - Uses Header + Footer

**App.tsx** — Add routes for `/contact`, `/testimonials`, `/pricing`, `/blog`, `/blog/:slug`.

---

### Phase 4: Customer Dashboard Update

**AccessCard.tsx**:
- Hide Coffee Stamps section (wrap in `{false && ...}` to preserve code)
- Keep: Loyalty Card, Points Balance, Transactions, Active Offers (which serves as Campaigns/Rewards)

---

### Phase 5: Merchant Settings Page

**`src/pages/MerchantSettings.tsx`** (`/merchant/settings`)

Three sections in tabs or accordion:

1. **Change Password** — New password + confirm, calls `supabase.auth.updateUser({ password })`. No "current password" field (Supabase doesn't support verifying old password client-side; user is already authenticated).

2. **Business Info** — Editable: store_name, address, phone (contact_number), industry_type. Updates `merchants` table. Instant UI refresh via state.

3. **Profile** — Display name (updates auth metadata + merchants.store_name), profile image upload to `profile-images` bucket, stores URL in `merchants.profile_image_url`.

**MerchantDashboard.tsx** — Update Settings quick action to navigate to `/merchant/settings`.

**App.tsx** — Add route `/merchant/settings`.

---

### Phase 6: Merchant Dashboard Fixes

**MerchantDashboard.tsx + AccessCard.tsx** — Replace old text logo blocks with the uploaded logo image (already done in Header/Footer, needs doing in dashboard headers too).

**MerchantTransactions.tsx** — Add Transaction ID search support (search also filters by `tx.id`).

---

### Phase 7: Data Sync (Already Working)

The existing `add_points_to_customer` RPC already:
- Creates transaction records visible to both merchant and customer
- Updates customer `points_balance` immediately
- No additional work needed for basic sync

Campaigns/Rewards from merchants → currently hardcoded "Active Offers" in customer dashboard. Full dynamic campaigns would require a new `campaigns` table — this can be a future enhancement.

---

### Technical Details

- All new pages use consistent design: Header + Footer wrapper, card-based layout, PerkBack branding, mobile-responsive
- Zod validation on Contact form
- All nav links are route-based (`isRoute: true`) for new pages
- Blog content rendered safely (no `dangerouslySetInnerHTML` — use pre-formatted text or a markdown renderer)
- RLS policies ensure contact form is insert-only, testimonials/blogs are read-only for public

### Files Created
- `src/pages/ContactUs.tsx`
- `src/pages/TestimonialsPage.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/Blog.tsx`
- `src/pages/BlogPost.tsx`
- `src/pages/MerchantSettings.tsx`

### Files Modified
- `src/components/Header.tsx` (nav links)
- `src/components/Footer.tsx` (links)
- `src/pages/Index.tsx` (remove Testimonials)
- `src/pages/AccessCard.tsx` (hide coffee stamps, update header logo)
- `src/pages/MerchantDashboard.tsx` (settings link, update header logo)
- `src/App.tsx` (new routes)

### Migrations
- Create `contact_messages`, `testimonials`, `blogs` tables with RLS
- Add `profile_image_url` to `merchants`
- Create `profile-images` storage bucket

