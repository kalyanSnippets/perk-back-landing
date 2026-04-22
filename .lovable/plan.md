
## Rework the customer access-card navigation and tighten auth handling across direct opens

### What will change

#### 1. Move customer navigation to the top of the Access Card page
- Replace the current mobile bottom navigation in `src/pages/AccessCard.tsx` with a top tab navigation that is visible on phone as well as desktop/tablet.
- Expand the tab model from:
  - My Rewards
  - My Card
  - Explore
- to:
  - Rewards
  - Card
  - Explore
  - Profile
- Use one shared `activeMainTab` state for all breakpoints so the same view logic drives every layout.

#### 2. Create a proper Profile tab inside the customer access-card flow
- Move the current account/settings content out of the card tab and into a dedicated `Profile` tab.
- The new profile tab will contain:
  - account settings section
  - logout action
  - account deletion entry
  - main website links currently living in “More”:
    - About Us
    - Pricing
    - Testimonials
    - Blog
    - Contact
    - Privacy
- Keep the delete-account dialog wired exactly as it is today, but launch it from the Profile tab instead of the card tab.

#### 3. Simplify the Card tab so it only contains card-related content
- Keep the digital card, barcode/QR, share/copy, wallet buttons, and card details in the Card tab.
- Remove the current “Account Settings” and “More” cards from the Card tab so the tab is focused and cleaner.

#### 4. Make auth behavior consistent when opening the app directly in Chrome
- Audit the customer entry flow so protected customer screens never appear accessible without a valid session.
- Standardize redirect behavior so unauthenticated users who open protected customer URLs directly are sent to the login screen, not to the landing page.
- Preserve the intended return path by redirecting to login with a `next` parameter when appropriate, so after sign-in the user comes back to the requested customer screen.
- Align route guards and in-page auth fallbacks so they do not fight each other or create inconsistent navigation.

#### 5. Keep session behavior correct across screens
- Preserve the current persistent-auth behavior for signed-in users.
- Ensure customer routes continue to work when:
  - opening the app directly
  - refreshing a protected page
  - entering via Chrome on mobile
  - returning from sign-in
- Prevent cases where one screen treats the user as authenticated while another bounces them unexpectedly.

---

### Files I will update

- `src/pages/AccessCard.tsx`
  - add the new top navigation model
  - introduce the Profile tab
  - remove the bottom floating nav
  - move logout / delete / links into Profile
- `src/components/shared/FloatingBottomNav.tsx`
  - likely no longer needed by Access Card after this change
- `src/components/ProtectedRoute.tsx`
  - improve unauthenticated redirects to preserve intended destination where needed
- `src/pages/GetStarted.tsx`
  - ensure redirect-after-login works cleanly for direct-open protected pages
- potentially `src/pages/Index.tsx` and/or other customer auth redirect points
  - only if needed to remove inconsistent landing-page fallbacks

---

### Behavior after the change

```text
Customer opens /customer/access-card directly
  ├─ if logged in → opens access card normally
  └─ if logged out → opens login screen first

After login
  └─ returns to the intended customer page
```

```text
Access Card page
  ├─ Top nav: Rewards | Card | Explore | Profile
  ├─ Rewards tab: rewards content
  ├─ Card tab: loyalty card only
  ├─ Explore tab: discovery content
  └─ Profile tab: settings, logout, website links, delete account
```

---

### Technical notes
- No database schema change is required for this request.
- Existing authentication/session persistence will be preserved.
- Existing delete-account backend behavior remains intact; this is a UX and routing refactor.
- I will keep the customer mobile experience app-like while making the navigation clearer and auth handling more reliable.
