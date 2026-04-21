
## UI/prototype direction: customer mobile first, merchant desktop/tablet first

### Product focus

PerkBack should feel like two connected products sharing one brand system:

1. **Customer experience**
   - Primary device: mobile
   - Goal: make PerkBack feel like a premium loyalty wallet customers can open quickly at checkout
   - Priority: speed, clarity, trust, rewards excitement, simple navigation

2. **Merchant experience**
   - Primary devices: desktop and iPad/tablet
   - Goal: make PerkBack feel like a loyalty operating system for local businesses
   - Priority: ROI visibility, customer management, campaign creation, reporting, operational efficiency

The prototype set should be adjusted around that hierarchy. The existing `/prototype` route already has a strong foundation, but the next pass should shift the merchant prototype away from being mainly mobile and toward richer desktop/tablet SaaS screens.

---

## Recommended experience model

```text
Customer = Mobile loyalty wallet
Merchant = Desktop/tablet loyalty command centre
Admin/Platform = Desktop-only internal overview
```

### Customer design principle

The customer app should feel closer to:

```text
Apple Wallet + Starbucks Rewards + local discovery marketplace
```

Not a traditional dashboard.

Key feeling:
- Open app
- See points instantly
- Show card instantly
- Find rewards instantly
- Discover nearby merchants easily
- Understand what to do next without thinking

### Merchant design principle

The merchant app should feel closer to:

```text
Shopify admin + Square dashboard + loyalty CRM
```

Not just a list of transactions.

Key feeling:
- See today’s loyalty performance
- Know what action to take next
- Add points quickly
- Understand customer segments
- Launch campaigns without marketing knowledge
- Track repeat visits and retained revenue

---

## Customer journey map

### 1. Awareness / entry

Customer discovers PerkBack through:
- Merchant QR code at counter
- SMS invite
- Email invite
- Website
- Shared reward link
- Wallet/pass link

Prototype screens:
```text
Customer invite / landing
Splash
Onboarding
```

Design notes:
- Keep this very visual
- Explain the promise in one sentence
- Avoid heavy feature explanations
- Use reward examples, not abstract SaaS language

Core message:
```text
One loyalty wallet for your favourite local places.
```

---

### 2. Signup / login

Customer signs up with:
- Full name
- Email
- Phone
- DOB

Prototype screens:
```text
Customer login
Customer signup
DOB verification
Create wallet confirmation
```

Design notes:
- Mobile form must feel short and safe
- Use progressive disclosure
- Avoid long forms on one screen
- Make DOB login feel deliberate and trustworthy

Important UX rule:
```text
The customer should never feel like they are signing up for business software.
```

---

### 3. Wallet home

This should become the customer’s main screen.

Prototype screens:
```text
Customer home
Points hero
Tier progress
Ready rewards
Nearby merchants
Recent activity
```

Recommended structure:
```text
Top: greeting + notification
Hero: total points + tier progress
Middle: ready rewards + active offers
Lower: nearby merchants + recent receipts
Bottom: floating nav
```

Primary mobile nav:
```text
Wallet
Rewards
Explore
Profile
```

Design notes:
- The current high-fidelity prototype is directionally good
- Make this the emotional centre of the customer app
- The points card should feel premium and instantly understandable
- Rewards should feel tangible, not like database records

---

### 4. Show card / earn points

This is the most important checkout moment.

Prototype screens:
```text
Digital loyalty card
QR identity
Barcode identity
Wallet pass prompt
NFC tap prompt
```

Recommended hierarchy:
```text
Primary: QR code / scan identity
Secondary: barcode / card number
Support: CRN, tier, customer name
Action: Add to Apple/Google Wallet
```

Design notes:
- This screen must be extremely clean
- Avoid clutter around the QR/barcode
- Use high contrast
- Make the merchant scanning moment obvious
- Add “works at participating stores” copy

Core UX rule:
```text
At checkout, the customer should open the card and understand it in under 2 seconds.
```

---

### 5. Rewards and redemption

Prototype screens:
```text
Rewards list
Reward detail
Redeem confirmation
Redemption code
Expired/used state
```

Recommended reward card structure:
```text
Reward title
Merchant name
Required points
Expiry/status
Redeem button
```

Design notes:
- Use gold/accent treatment for redeemable rewards
- Separate “ready to use” from “keep earning”
- Reward detail should explain:
  - what it is
  - where it works
  - how many points it costs
  - when it expires

---

### 6. Explore nearby merchants

Prototype screens:
```text
Explore nearby
Merchant detail
Merchant offer list
Join merchant / start earning
```

Recommended layout:
```text
Search/filter
Industry chips: Coffee, Retail, Restaurant
Map/list hybrid
Merchant cards
Distance + active offer
```

Design notes:
- This is where PerkBack becomes a marketplace
- Keep the map simple on mobile
- Prioritize merchant cards and offers
- Make “start earning here” obvious

---

### 7. Receipts and activity

Prototype screens:
```text
Transaction history
Receipt detail
Points earned breakdown
Item-level offers
```

Design notes:
- Receipts should reinforce value
- Show purchase amount, points earned, merchant, date
- Use simple positive feedback:
```text
You earned 42 points
160 points until your next reward
```

---

### 8. Profile and preferences

Prototype screens:
```text
Profile
Linked merchants
Notification preferences
Wallet passes
Security
Delete account
```

Design notes:
- Keep profile secondary
- Avoid making this feel like settings-heavy software
- Focus on trust, privacy, preferences, and wallet sync

---

## Merchant journey map

### Primary merchant devices

The merchant experience should be designed primarily for:

```text
Desktop: owner/manager operations
Tablet/iPad: counter/staff workflows
Mobile: secondary quick-access only
```

The current mobile merchant prototype is useful, but it should become a compact secondary flow. The main merchant prototype should move to desktop/tablet.

---

### 1. Merchant onboarding

Prototype screens:
```text
Create merchant account
Business profile
Industry selection
Store details
Logo upload
First reward setup
POS/NFC setup
Launch checklist
```

Recommended onboarding checklist:
```text
1. Add business profile
2. Choose industry
3. Create first reward
4. Add first customer or connect POS
5. Issue first points
6. Launch first campaign
```

Design notes:
- This is critical for activation
- Merchants need a clear path to first value
- Industry selection should change suggested rewards and dashboard modules

---

### 2. Merchant dashboard

Prototype screens:
```text
Desktop merchant dashboard
Tablet merchant dashboard
Today overview
Quick actions
Live activity
Next best action
```

Recommended dashboard structure:
```text
Header: shop name + plan badge + date range
KPI row: customers, revenue, points, redemptions
Main chart: repeat visits / loyalty revenue
Right panel: next best action
Lower: recent transactions + campaign performance
```

Priority metrics:
```text
Total customers who purchased
Repeat customer rate
Revenue tracked
Points issued
Rewards redeemed
Campaign impact
Retained revenue
```

Design notes:
- Dashboard should display merchant shop name prominently
- Avoid vanity metrics unless tied to retention
- “Next best action” should guide merchants toward campaigns/offers

---

### 3. Add points / checkout workflow

This is the operational tablet flow.

Prototype screens:
```text
Add points
Customer search
Scan card
Purchase amount entry
Points confirmation
Transaction success
```

Recommended tablet layout:
```text
Left: customer lookup / scan
Right: purchase and points calculator
Bottom/right: confirm action
```

Design notes:
- This should be fast enough for counter use
- Customer search should support phone, CRN, loyalty card number
- Confirmation should be clear but not slow down staff

---

### 4. Customer management

Prototype screens:
```text
Customer list
Customer profile
Customer segment view
Customer transaction history
Manual points adjustment
```

Recommended segments:
```text
VIP
Frequent
New
At-risk
Dormant
Birthday this month
```

Design notes:
- This is where PerkBack becomes CRM-like
- Merchants should understand who to re-engage
- Customer profiles should show:
  - total visits
  - total spend
  - points balance
  - last visit
  - rewards used
  - campaign history

---

### 5. Campaign studio

Prototype screens:
```text
Campaign dashboard
Template picker
Campaign builder
Audience selection
Offer configuration
Preview
Launch confirmation
Performance report
```

Recommended templates:
```text
Birthday offer
Win-back campaign
Double-points day
Monthly offer
Buy X Get Y
VIP reward
Slow-day traffic boost
```

Design notes:
- This should feel guided, not blank-canvas
- AI suggestions can be presented as polished recommendation cards
- Use predicted impact carefully:
```text
Estimated repeat visit lift
Recommended audience
Best send time
```

---

### 6. Rewards and offers management

Prototype screens:
```text
Rewards list
Create reward
Monthly offers
Stamp card setup
Offer status
Redemption rules
```

Design notes:
- Industry-specific defaults matter here

Coffee:
```text
Free coffee after X visits
Double points morning
Monthly brews
```

Retail:
```text
Spend-based discounts
VIP sale access
Product category offers
```

Restaurant:
```text
Birthday dessert
Lunch return offer
Dining rewards
```

---

### 7. Analytics and reports

Prototype screens:
```text
Analytics overview
Retention report
Campaign ROI
Customer segments
Revenue attribution
Export report
```

Recommended analytics hierarchy:
```text
Top: retained revenue and repeat rate
Middle: retention trend and campaign impact
Bottom: segments and recommendations
```

Design notes:
- Merchants should not need to interpret complex charts
- Every chart should answer:
```text
What happened?
Why does it matter?
What should I do next?
```

---

### 8. Settings and integrations

Prototype screens:
```text
Business profile
Branding
Plan management
POS integration
NFC/QR setup
Staff access
Notifications
```

Design notes:
- Keep settings clean and boring
- Make integrations feel stable and professional
- Plan limits should be visible but not aggressive

---

## Prototype restructure plan

### Current state

The current `/prototype` route already includes:
- Mobile customer screens
- Mobile merchant screens
- Desktop marketing screens
- Desktop dashboard screens
- Screen registry and device frame system

### Recommended next pass

Refocus the prototype navigation into these groups:

```text
Customer Mobile
Merchant Tablet
Merchant Desktop
Marketing Desktop
Platform/Admin Desktop
```

Instead of the current structure:

```text
Customer Mobile
Merchant Mobile
SaaS Desktop
```

This better matches the real product priorities.

---

## Proposed prototype screen set

### Customer Mobile Flow

```text
1. Invite / entry
2. Splash
3. Onboarding
4. Signup / login
5. Wallet home
6. Digital card
7. Rewards
8. Reward detail
9. Explore nearby
10. Merchant detail
11. Receipt detail
12. Profile
```

### Merchant Tablet Flow

```text
1. Counter dashboard
2. Scan customer
3. Add points
4. Confirm transaction
5. Customer quick profile
6. Quick reward redemption
```

### Merchant Desktop Flow

```text
1. Merchant dashboard
2. Customers / segments
3. Customer profile
4. Campaign studio
5. Rewards/offers manager
6. Analytics/reporting
7. Settings/integrations
```

### Marketing Desktop Flow

```text
1. Homepage
2. Merchant landing
3. Customer landing
4. Pricing
5. Demo / how it works
```

---

## Wireframe approach

### Phase 1: Flow mapping

Create journey maps before polishing individual screens.

Deliverables:
```text
Customer journey map
Merchant desktop journey map
Merchant tablet counter-flow map
```

Purpose:
- Confirm the order of screens
- Confirm what each user needs at each step
- Avoid making beautiful screens that do not connect logically

---

### Phase 2: Structural wireframes

Create low-distraction wireframes for:

```text
Customer mobile core journey
Merchant desktop dashboard journey
Merchant tablet add-points journey
```

Focus:
- Navigation
- Screen hierarchy
- CTA placement
- Information priority
- Form steps
- Error/success states

Keep visual polish limited in this phase.

---

### Phase 3: High-fidelity prototypes

Apply full PerkBack styling:

```text
DM Sans
Navy/blue/gold palette
Rounded 2xl cards
Premium mobile wallet surfaces
Clean SaaS dashboard cards
Soft shadows
Gradient accents
Lucide iconography
```

Focus:
- Customer mobile first
- Merchant desktop/tablet second
- Mobile merchant only as a lightweight companion experience

---

## Specific UI improvements to make next

### Customer mobile improvements

Update the prototype to include:
- Dedicated customer journey map view
- More realistic onboarding/signup flow
- Stronger digital card screen
- Reward detail and redeem confirmation screens
- Merchant detail screen from Explore
- More polished receipt detail
- Better bottom nav active states per screen

### Merchant desktop/tablet improvements

Update the prototype to include:
- Tablet device frame option
- Merchant tablet counter workflow
- Rich desktop dashboard
- Customer segmentation screen
- Customer profile screen
- Campaign studio builder
- Rewards/offers manager
- Analytics report page
- Settings/integrations screen

### Prototype shell improvements

Update `/prototype` controls to support:
```text
Customer Mobile
Merchant Tablet
Merchant Desktop
Marketing Desktop
```

This will make the prototype match the real product strategy more clearly.

---

## Recommended priority order

### Step 1

Refactor the prototype structure around the correct device priorities:

```text
Customer = mobile
Merchant = tablet/desktop
```

### Step 2

Build the full customer mobile journey map and high-fidelity flow.

### Step 3

Build the merchant tablet counter workflow.

### Step 4

Build the merchant desktop command centre workflow.

### Step 5

Update downloadable prototype boards to match the new structure.

### Step 6

Use the approved prototype direction to redesign the real customer and merchant product pages.

---

## Acceptance criteria

The next prototype pass is successful when:

- Customer mobile journey feels like a polished loyalty wallet
- Customer can understand the app value in under 10 seconds
- Digital card is easy to access and scan
- Rewards and nearby merchants feel central
- Merchant desktop feels like a serious SaaS operating system
- Merchant tablet flow supports fast counter use
- Campaign, rewards, customers, and analytics flows are visible
- The prototype navigation reflects real device priorities
- The UI feels premium, modern, and commercially credible
