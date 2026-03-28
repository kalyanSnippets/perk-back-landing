

## Fix: Scroll-to-Top on Route Change + Back-to-Top Button

### Problem
1. Navigating via footer links lands users at the bottom of the new page (no scroll reset on route change)
2. No way to quickly return to the top after scrolling down

### Changes

#### 1. Create `src/components/ScrollToTop.tsx`
- Uses `useLocation().pathname` to detect route changes
- Calls `window.scrollTo({ top: 0, behavior: 'instant' })` on every path change

#### 2. Create `src/components/BackToTopButton.tsx`
- A floating button (bottom-right corner) that appears after scrolling ~300px down
- Clicking it smooth-scrolls back to the top
- Uses a chevron-up icon from lucide-react
- Styled with the project's accent/primary colors, rounded, with a subtle shadow
- Fades in/out based on scroll position

#### 3. Update `src/App.tsx`
- Import and render `<ScrollToTop />` inside `<BrowserRouter>` before `<AuthProvider>`
- Import and render `<BackToTopButton />` alongside routes (visible on all pages)

### Files
- **Created:** `src/components/ScrollToTop.tsx`
- **Created:** `src/components/BackToTopButton.tsx`
- **Modified:** `src/App.tsx`

