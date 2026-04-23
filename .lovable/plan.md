
Restore the profile tab’s original information architecture while keeping the newer visual styling aligned to your reference image.

### What to change

### 1. Keep the existing profile options and data exactly as before
Update `src/pages/AccessCard.tsx` so the profile tab preserves the same content set that existed before the redesign.

What this means:
- keep the original profile information/options already available in the profile section
- do not replace them with new categories or substitute different settings
- do not remove any existing profile information that was previously shown
- if any labels or values were changed during the redesign, restore them to the prior profile content model

Result:
- the profile section keeps the same options and account information as before
- only the appearance changes, not the profile content structure

### 2. Restyle the profile screen to match the shared mobile reference
Apply the visual language from your screenshot to the existing profile content.

What to update:
- keep the blue summary/header card at the top
- keep the cleaner grouped card/list presentation
- use simplified row styling with:
  - left icon
  - label/value content
  - right-side chevron or control
- tighten spacing, borders, radii, and shadows so it feels closer to the mobile design reference
- make the profile page feel visually modern and simplified without inventing new settings

Result:
- same profile options as before
- cleaner design that reflects the image you shared

### 3. Preserve real account data and prior actions
Use the real data already available in the page and make sure prior actions remain accessible.

Keep:
- customer identity/account details already shown in the old profile
- any existing navigational/account rows that were part of the prior profile section
- logout at the bottom
- delete account separate and lower priority

Result:
- nothing important disappears from the profile
- the page looks updated, but functionality stays familiar

### 4. Review section ordering so styling changes do not alter meaning
Reorder only if needed for visual polish, but do not change what the user can access.

Implementation rule:
- styling/layout can be modernized
- content inventory must match the earlier profile experience
- no newly invented replacement sections unless they map directly to the old rows/options

### Files to update
- `src/pages/AccessCard.tsx`

### Expected result
After this pass:
- the profile screen will look like the design reference
- the profile options/information will remain the same as the earlier version
- logout will stay at the bottom
- the redesign will be visual only, not a change to what the profile contains

### Technical notes
- The current profile tab in `AccessCard.tsx` already has a newer visual shell; the fix is to restore the previous profile content/options inside that styled presentation.
- The safest approach is to keep the summary card and polished row styling, but swap the current rewritten section definitions back to the earlier profile rows/data model.
