

## Unified Login + Role-Based Signup + Role Chooser + Account Switcher

### Overview

Restructure the GetStarted page so there's **one unified login form** (email + password only, no role selection) and **two separate signup forms** (Customer / Merchant with role-specific fields). After login, auto-detect roles and redirect accordingly. If user has both roles, show a role chooser page. Nav shows both role links for dual-account users.

---

### Changes

#### 1. Restructure `src/pages/GetStarted.tsx`

**Login tab:**
- Remove the Customer/Merchant role selector when in login mode
- Show only email + password + forgot password
- After successful login, auto-detect role:
  - Check both `merchants` and `customers` tables
  - If **both** exist → navigate to `/choose-role`
  - If only merchant → `/merchant/dashboard`
  - If only customer with loyalty card → `/customer/access-card`
  - If only customer without card → `/customer/confirmation`
  - If neither → sign out + error

**Signup tab:**
- Keep the Customer/Merchant role selector (only visible during signup)
- Customer signup: full name, email, password, phone, DOB
- Merchant signup: store name, email, password, address, contact, industry

#### 2. Create `src/pages/ChooseRole.tsx`

- Simple page with two cards: "Continue as Customer" and "Continue as Merchant"
- Customer card → `/customer/access-card`
- Merchant card → `/merchant/dashboard`
- Uses shared Header, consistent styling with rest of site
- Only accessible when logged in

#### 3. Update `src/components/Header.tsx`

- Show **both** "My Card" and "Dashboard" links when user has both `isCustomer` and `isMerchant` (remove the `!isMerchant` condition on line 69 and 128)

#### 4. Update `src/App.tsx`

- Add `/choose-role` route (protected, any authenticated user)

---

### Files
- **Modified:** `src/pages/GetStarted.tsx` — restructure login/signup tabs
- **Created:** `src/pages/ChooseRole.tsx` — role chooser for dual-account users
- **Modified:** `src/components/Header.tsx` — show both role links for dual users
- **Modified:** `src/App.tsx` — add choose-role route

