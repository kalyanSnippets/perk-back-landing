
## Fix the QR-code 404 by aligning the live domain with the current app build

### What I verified
- The current codebase does include the `/join/:merchantSlug` route in `src/App.tsx`.
- The QR poster currently generates `https://www.perkback.com.au/join/:slug` in `src/components/merchant/CounterQrPoster.tsx`.
- Fetching the live URL `https://www.perkback.com.au/join/cafe-shop-kk` returns the app’s 404 screen, not the join flow.
- That means the problem is not the QR slug format itself — it is that the live frontend currently serving `www.perkback.com.au` is not serving the new route correctly.

### Most likely root cause
The live/custom-domain deployment is behind the current code. In this setup, frontend route changes only go live after publishing/updating the site. The code has the route, but the live domain is still behaving like an older build where `/join/:slug` falls into `NotFound`.

### Implementation plan

#### 1. Confirm the join route is present in the shipped frontend bundle
- Rebuild the frontend and ensure the generated app includes the `/join/:merchantSlug` route from `src/App.tsx`.
- Verify that no route guard or lazy-loading issue is preventing `CustomerJoin` from being loaded in production.

#### 2. Publish the latest frontend so the custom domain gets the new route
- Push the current frontend changes live by updating the published deployment.
- Re-check both:
  - `https://perk-back-landing.lovable.app/join/cafe-shop-kk`
  - `https://www.perkback.com.au/join/cafe-shop-kk`
- Expected result: both should open the PerkBack splash/join flow instead of the 404 page.

#### 3. Keep the QR generator pointed at the correct production domain
- Preserve the fixed production join base URL in `CounterQrPoster.tsx`.
- Verify the generated QR payload exactly matches:
  - `https://www.perkback.com.au/join/<merchant-slug>`
- Ensure the previewed poster and downloaded PNG use the exact same URL.

#### 4. Add one source of truth for customer join URLs
- Refactor the join URL creation into a shared constant/helper so the app does not mix preview origins, runtime origins, and production URLs in different places.
- Use that shared helper anywhere merchant join links are created or displayed.

#### 5. Verify the full live flow end-to-end after publish
- Test a real merchant slug on the live domain.
- Verify these outcomes:
  - unauthenticated user sees splash, then the simplified onboarding/login flow
  - authenticated customer goes from splash directly to access card
  - no 404 on direct load or refresh of `/join/:slug`
  - merchant link/source still saves correctly to `customer_merchants`

#### 6. Check for any stale mobile-installed app behavior
- Since phone users are scanning from camera/apps, verify the issue is not just an old installed app session opening an outdated deployment.
- Confirm direct browser navigation to the custom-domain join URL works first, then confirm installed/PWA behavior separately.

### Files involved
- `src/App.tsx` — production route registration for `/join/:merchantSlug`
- `src/components/merchant/CounterQrPoster.tsx` — QR destination URL generation
- `src/pages/CustomerJoin.tsx` — live join experience rendered at that route
- `src/pages/NotFound.tsx` — current fallback proving live traffic is missing the route
- optionally a new shared URL helper such as `src/lib/customerJoinUrl.ts`

### Expected final result
```text
Scan merchant QR
   ↓
https://www.perkback.com.au/join/cafe-shop-kk
   ↓
PerkBack splash screen
   ↓
customer join / login flow
   ↓
access card
```

### Technical note
This looks like a deployment mismatch, not a database or QR-format bug. The route is present in code, but the live domain is still serving a build that resolves the path to `NotFound`. Once approved, I’ll implement the shared URL hardening if needed and verify the live deployment path end-to-end.
