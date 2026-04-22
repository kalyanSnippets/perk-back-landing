
## Refine the customer mobile/PWA entry flow so it feels like a real PerkBack app

### What will change

#### 1. QR poster will open the PerkBack domain directly
- Update the counter QR poster generator so the encoded link uses `https://www.perkback.com.au/join/:slug` instead of the current runtime origin.
- Keep the on-screen poster preview and downloaded PNG consistent, so what the merchant sees is exactly what customers scan.
- This removes the “Lovable site first” behavior and sends customers straight to the PerkBack join experience.

#### 2. Splash screen will stay on screen a bit longer
- Increase the `/join/:merchantSlug` splash timing so it feels intentional instead of flashing away too quickly.
- Keep the existing branded look, but extend the delay before advancing.

#### 3. Customer onboarding will be simplified to one screen
- Replace the current 3-slide onboarding carousel in `CustomerJoin.tsx` with a single fixed-height onboarding screen.
- Preserve the strongest approved messaging:
  - what PerkBack is
  - why it helps
  - one clear CTA
- Keep the “Already on PerkBack? Sign in” path visible on this simple onboarding screen.

#### 4. Logged-in QR scanners will go straight to the card flow
- Keep the branded splash first.
- After splash, if the customer is already authenticated, immediately link them to the merchant and send them to `/customer/access-card`.
- Do not show welcome/onboarding/auth screens to already logged-in customers after a QR scan.

#### 5. The installed app / phone experience will stop opening to the marketing homepage
- Add a mobile-app-aware entry redirect so phone/PWA customers no longer land on `/`.
- New behavior on phone:
  - logged in customer → go straight to `/customer/access-card`
  - logged out user → go to `/get-started` in login mode
- This will make the app feel like a wallet/login app rather than a marketing website.

#### 6. Hide public website chrome on phone
- Remove the public top navbar and theme toggle on phone-sized views.
- Keep desktop marketing navigation intact.
- On phone, customer-facing routes will feel app-like rather than website-like.
- Public links like Home, Pricing, Testimonials, Blog, etc. will no longer sit in the top mobile nav.

#### 7. Move useful public links into a customer-accessible profile area
- Since public nav is being removed on phone, add a compact “Profile / More” section inside the customer experience.
- Include links there for pages you still want accessible separately, such as:
  - About Us
  - Pricing
  - Testimonials
  - Blog
  - Contact Us
  - Privacy
- This keeps those pages reachable without cluttering the app shell.

#### 8. Fix onboarding layout so it is locked to the phone screen
- Make the join splash/onboarding/auth screens use fixed full-height mobile layouts.
- Remove the accidental scrollable feel unless content truly overflows.
- Ensure CTA buttons stay pinned appropriately within the viewport.

---

### Files to update

#### `src/components/merchant/CounterQrPoster.tsx`
- Replace `window.location.origin` for QR/join URL generation with the fixed production domain `https://www.perkback.com.au`.
- Apply the same source for both preview copy and PNG export.

#### `src/pages/CustomerJoin.tsx`
- Lengthen splash timing.
- Simplify onboarding from 3 slides to 1 step.
- Ensure full-screen mobile-safe layout with no unintended page scroll.
- Tighten the signed-in auto-link logic so the post-splash route goes directly to the customer card.
- Keep the “Already on PerkBack? Sign in” path visible and clear.

#### `src/pages/GetStarted.tsx`
- Add support for a `next` redirect parameter so sign-in from `/join/:slug` returns users to the join flow instead of dropping them elsewhere.
- Add support for forcing login-first when launched from mobile/PWA entry.
- Update the back/home affordance for phone app mode so it behaves like an app, not a marketing funnel.

#### `src/components/Header.tsx`
- Detect phone-sized views and suppress the entire public mobile header/nav for app-like flows.
- Remove the mobile theme toggle.
- Keep desktop header behavior for the normal website.

#### `src/pages/Index.tsx`
- Add customer mobile entry redirect behavior so phone/PWA users do not stay on the landing page.
- Preserve normal desktop website behavior.

#### `src/pages/AccessCard.tsx`
- Make the customer card experience work cleanly without relying on the public header on phone.
- Add a small profile/more section for access to public informational pages and account actions.
- Preserve existing desktop/tablet behavior as much as possible.

#### `public/manifest.json`
- Change the installed app start URL away from `/` so the installed web app opens into the authentication/app flow instead of the landing page.
- Point it to the login-first experience.

---

### Expected final behavior

```text
Scan merchant QR
   ↓
www.perkback.com.au/join/:slug
   ↓
PerkBack splash (slightly longer)
   ↓
If logged in:
   link customer to merchant
   → /customer/access-card

If logged out:
   1-step onboarding
   → sign in / create account
   → link to merchant
   → /customer/access-card
```

```text
Open installed PerkBack app on phone
   ↓
If logged in:
   /customer/access-card

If logged out:
   /get-started (login-first)
```

---

### Technical notes
- No database schema change is required for these requests.
- The existing merchant join-source save behavior in `customer_merchants.source` remains intact.
- The main logic change is route handling, mobile shell behavior, and QR URL generation.
- I will preserve desktop marketing pages and merchant flows while making the phone customer experience behave like a native-style app shell.
