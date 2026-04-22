
## Streamline the installed-app entry flow and upgrade the customer dashboard store/profile experience

### What will change

#### 1. Opening the installed mobile app will go straight to the correct destination
- Update the mobile app entry logic so the installed app does not show the onboarding splash, hero page, or landing page before routing.
- When the app is opened in mobile app mode:
  - if the user is already logged in as a customer → go directly to `/customer/access-card`
  - if the user is not logged in → go directly to `/get-started?app=1`
- Keep the normal marketing website behavior for standard browser visits and desktop use.

#### 2. Skip the global splash/onboarding overlay for app-mode opens
- Adjust the first-visit gate so it does not render the global splash/onboarding when the app is opened in app/mobile mode.
- This prevents the current sequence:
  - splash
  - landing page
  - redirect to access card
- The result will feel like a real installed app instead of a website boot flow.

#### 3. Tighten the root-page redirect logic for mobile app mode
- Refine the home page redirect behavior so app-mode routing happens immediately and consistently after auth is ready.
- Preserve the current role-aware behavior, but prioritize customer app entry:
  - signed-in customer → access card
  - signed-out user → login
- Avoid showing the landing page content during this transition.

#### 4. Add Profile actions requested in the customer dashboard
- Extend the Profile tab in `src/pages/AccessCard.tsx` to include:
  - Reviews link
  - Merchant Dashboard button
- Per your choice, the Merchant Dashboard button will be hidden unless that user also has a merchant account.
- Keep logout and delete-account controls in the same Profile tab.

#### 5. Turn “My Store” into a clearer exclusive store section
- Keep the current store selection model, but redesign it so selecting a store creates a much more obvious “exclusive store section” inline inside the Rewards tab.
- When a customer selects one store, I’ll show a focused store-only block near the top that feels dedicated to that merchant, with:
  - store branding / logo / industry / address
  - store-specific points balance
  - rewards for that store
  - campaigns for that store
  - monthly offers for that store
  - stamp/status modules when available
  - recent store activity / transactions for that store
- This will build on the existing filtering logic already driven by `selectedMerchantId`, but make it feel like a real merchant hub rather than just a silent filter.

#### 6. Make store selection more understandable
- Improve the “My Stores” interaction so it is obvious that tapping a store opens its dedicated inline section.
- Add clearer selected-state messaging and stronger visual separation between:
  - all-store overview
  - one-store focused view
- Keep “All Stores” as the escape/back state.

---

### Files I will update

- `src/components/onboarding/FirstVisitGate.tsx`
  - skip splash/onboarding when the app is opened in mobile app mode
- `src/pages/Index.tsx`
  - harden the installed-app redirect behavior so users do not see the landing page first
- `src/pages/AccessCard.tsx`
  - add Reviews link in Profile
  - conditionally show Merchant Dashboard button for dual-role users only
  - upgrade the selected-store experience into a clearer inline exclusive store section
- potentially `src/contexts/AuthContext.tsx`
  - only if needed to avoid auth-ready timing causing a flash of the landing screen during app opens

---

### Final behavior after the change

```text
Installed mobile app opens
  ├─ logged-in customer → /customer/access-card immediately
  └─ logged-out user → /get-started?app=1 immediately
```

```text
Customer dashboard
  ├─ Top tabs: Rewards | Card | Explore | Profile
  ├─ Profile includes:
  │   ├─ reviews link
  │   ├─ logout
  │   ├─ delete account
  │   └─ merchant dashboard button (only if user also has merchant account)
  └─ My Stores:
      ├─ all stores = overall rewards view
      └─ selected store = dedicated inline store section with exclusive store content
```

---

### Technical notes
- No database schema change is required for this request.
- Existing auth/session persistence will be preserved.
- The exclusive store experience can be implemented with the current customer/store/reward/campaign/offer data already being loaded in `AccessCard.tsx`.
- I will preserve normal website behavior on desktop and regular browser visits while making the installed mobile app open like a true app.
