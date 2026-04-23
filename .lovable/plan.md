Refine the customer profile and mobile page-navigation flow so the profile only shows meaningful options, the editable field is date of birth, and profile-linked pages open in a phone-friendly in-app view without the public header/footer.

### What to change

### 1. Clean up the profile rows so only real actions look clickable

Update `src/pages/AccessCard.tsx` so the current non-working chevrons disappear from rows that are only informational.

What to adjust:

- remove the `Full Name`, `CRN`, and `Card Number` rows from the tappable profile list
- keep those values visible only in the top summary/profile card where they belong
- make informational content non-clickable and remove the chevron from non-action rows
- keep the list focused on things the user can actually do

Result:

- no fake arrows
- no confusing non-working rows
- cleaner profile structure

### 2. Add editable Name and Date of Birth to the profile

Use the existing customer `date_of_birth` field and current customer RLS policy to let the logged-in customer update their own DOB from the profile.

Update `src/pages/AccessCard.tsx`:

- add a `Date of Birth` row to the profile section
- make that row open an edit UI (dialog or bottom sheet on mobile)
- save the updated DOB back to the `customers` table
- refresh local customer state after save and show success/error feedback

Implementation notes:

- use a proper form flow with validation
- use the shadcn datepicker for the DOB editor
- ensure the calendar uses `pointer-events-auto` as required
- prevent future dates and clearly display the currently saved DOB

Result:

- DOB is editable
- name/CRN/card number are no longer misleadingly shown as editable items

### 3. Remove the Account Settings section and move Merchant Dashboard near logout

Update the profile grouping in `src/pages/AccessCard.tsx`:

What to change:

- remove the `Account Settings` section entirely
- keep the existing `Pages` section
- place `Merchant Dashboard` as a standalone action near the bottom if the logged-in user is also a merchant
- order the bottom actions as:
  - Merchant Dashboard (if applicable)
  - Log out
  - Delete my account

Result:

- less clutter in the profile
- merchant shortcut stays available
- bottom actions match the intended hierarchy

### 4. Make profile-linked pages open in a mobile in-app content mode

The current profile links go to full public pages, which still render the website chrome. Add a mobile-specific embedded mode for pages opened from the profile.

Update:

- `src/pages/AboutUs.tsx`
- likely the other profile-linked public pages as well:
  - `src/pages/Pricing.tsx`
  - `src/pages/TestimonialsPage.tsx`
  - `src/pages/ReviewPage.tsx`
  - `src/pages/Blog.tsx`
  - `src/pages/ContactUs.tsx`
  - `src/pages/PrivacyPolicy.tsx`

What to implement:

- keep using the `?web=1` query flag from the profile links
- detect mobile + `web=1`
- in that mode:
  - hide `Header`
  - hide `Footer`
  - render only the content area
  - add a top `Back` button that returns to `/customer/access-card` with the profile tab active
- on desktop/tablet:
  - preserve the current full public-page layout with header/footer

Recommended routing behavior:

```text
Mobile profile -> page link -> embedded page view
Back button -> returns to customer access card profile
Desktop/tablet -> normal website layout remains unchanged
```

Result:

- profile-linked pages feel like part of the mobile app
- no extra website chrome on phone
- desktop and tablet keep the normal marketing-site presentation

### 5. Preserve current routing and tab context when returning from embedded pages

To make the back flow feel correct, update the access-card page so it can reopen directly on the Profile tab when navigated back from an embedded page.

Update `src/pages/AccessCard.tsx`:

- read a lightweight route/search hint like `?tab=profile`
- initialize `activeMainTab` from that value when present
- keep existing default behavior for normal visits

Result:

- tapping Back from About/Pricing/etc returns users to the Profile tab instead of a different section

### Files to update

- `src/pages/AccessCard.tsx`
- `src/pages/AboutUs.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/TestimonialsPage.tsx`
- `src/pages/ReviewPage.tsx`
- `src/pages/Blog.tsx`
- `src/pages/ContactUs.tsx`
- `src/pages/PrivacyPolicy.tsx`

### Expected result

After this pass:

- the profile will no longer show non-working arrows for name/CRN/card number
- date of birth will be editable
- the Account Settings section will be removed
- Merchant Dashboard will sit near the bottom above logout
- profile-linked pages will open without header/footer on phone
- those pages will include a Back button to return to the profile section
- desktop/tablet will still use the normal full-site page layout

### Technical notes

- No database schema change is needed: `customers.date_of_birth` already exists and customers already have permission to update their own record.
- The cleanest implementation is to reuse the existing `?web=1` intent and combine it with `useIsMobile()` so only phone-sized embedded views suppress the public site chrome.
- If multiple public pages share the same mobile embedded behavior, extracting a small reusable “embedded public page” wrapper will keep the code consistent and easier to maintain.