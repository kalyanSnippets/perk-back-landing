

## Hero Section: Video Lightbox + Sparkle Background

### Changes

#### 1. Copy video to project
Copy `user-uploads://PerkBack_The_Future_of_SME_Loyalty_720p_caption.mp4` to `public/videos/perkback-intro.mp4` (public folder since it's a large media file, not suitable for bundling via src/assets).

#### 2. Update `src/components/HeroSection.tsx`
- **Video lightbox**: Replace the static placeholder with a click-to-play modal. Clicking the thumbnail opens a full-screen overlay with the video playing. Close on backdrop click or X button.
- **Sparkle/particle background**: Add animated floating dots/sparkles behind the hero using CSS-only approach (pseudo-elements with subtle radial gradients and float animations at staggered delays). No heavy JS particle library needed.
- Use React `useState` to toggle the modal open/closed.

#### 3. Update `src/index.css`
- Add `@keyframes sparkle` animation for the floating particles (random opacity pulse + gentle drift).
- Add a `.hero-particles` utility class with multiple pseudo-element sparkles at different positions and delays.

### Files
- **Copy**: video to `public/videos/perkback-intro.mp4`
- **Modified**: `src/components/HeroSection.tsx` — modal + particles
- **Modified**: `src/index.css` — sparkle keyframes

