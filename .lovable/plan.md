

I need to inspect the uploaded zip first to see the prototype designs before I can plan a redesign. I can't unzip in plan mode, so the plan below is a two-stage approach.

## Stage 1 — Unzip & catalog the prototype designs

1. Copy `user-uploads://Perkback.zip` → `/tmp/Perkback.zip`
2. Unzip to `/tmp/perkback_unzip/`
3. List tree, identify file types (PNG/JPG mockups, Figma export, PDF, HTML, etc.)
4. View every image / parse every doc
5. Extract design tokens: color palette, typography, spacing, corner radius, shadows, button styles, card styles, iconography, illustration style, motion cues
6. Map each prototype screen to existing PerkBack pages (Home, Pricing, Auth, Customer Card, Merchant Dashboard, etc.)
7. Save a reference doc to `/mnt/documents/perkback-redesign-spec.md` and copy reusable images to `src/assets/redesign/`

Then I pause and present **Stage 2** with the concrete redesign plan based on what's actually in the zip.

## Stage 2 — Site-wide redesign (preview of approach)

Once tokens are extracted, the redesign will roll out in this order to keep the app working at every step:

**A. Design system foundation (no visual change yet)**
- Update `src/index.css` HSL tokens (`--primary`, `--accent`, surfaces, gradients, shadows) to match prototype palette
- Update `tailwind.config.ts` (font family, radius, custom shadows, animation curves)
- Add new font via `index.html` preconnect + `<link>` if prototype uses something other than DM Sans
- All existing components automatically pick up new tokens — no per-component edits for color

**B. Shared primitives (shadcn variants)**
- Restyle `Button`, `Card`, `Input`, `Badge`, `Tabs`, `Dialog` variants to match prototype
- Update `Header` and `Footer` layouts to prototype structure
- Update `HeroSection`, `BenefitsSection`, `HowItWorks`, `RewardsShowcase`, `Testimonials` on the landing page

**C. Auth & onboarding**
- Restyle `GetStarted`, `ChooseRole`, `ResetPassword`

**D. Customer surfaces**
- `AccessCard` (card visual is the hero of the prototype — biggest visual change)
- `ExploreTab`, `MerchantPreview`, `ReceiptDetail`, `StampCardProgress`

**E. Merchant surfaces**
- `MerchantDashboard` KPI cards, `MerchantNav`, all `Merchant*` pages
- Reuse the new shared primitives so changes are mostly token-driven

**F. Admin & secondary pages**
- `AdminPanel`, `Pricing`, `AboutUs`, `Blog`, `BlogPost`, `ContactUs`, `TestimonialsPage`, `PrivacyPolicy`, `NotFound`

**G. Motion & polish**
- Update `ScrollReveal` defaults, `animate-*` keyframes in `index.css` to match prototype motion language
- Replace decorative shapes / blobs with prototype's illustration style

### Out of scope (until you ask)
- No content/copy changes
- No new pages or routes
- No DB or auth logic changes
- Mobile-shell + Capacitor work (separate prototype previously discussed) stays paused unless you want to combine

### What Stage 1 delivers back to you
A short summary of:
- Extracted color palette + typography
- Number of prototype screens and which existing pages they map to
- A flagged list of any prototype screens that don't have an equivalent in PerkBack today (so you decide: build new, skip, or repurpose)

