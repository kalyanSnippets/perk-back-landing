

## Hero Section Redesign: Video Thumbnail + Attractive Layout

### Layout Redesign

Change the hero from a 2-column (text left, card right) layout to a **stacked center-aligned layout** that feels more modern and impactful:

```text
┌─────────────────────────────────────────────┐
│           HEADLINE (centered)               │
│           Subtext (centered)                │
│        [Explore Now] [How It Works]         │
│                                             │
│  ┌──────────────────┐  ┌────────────────┐   │
│  │  VIDEO THUMBNAIL │  │ LOYALTY CARD   │   │
│  │  (with real      │  │ (floating      │   │
│  │   frame from     │  │  badges)       │   │
│  │   video + play)  │  │                │   │
│  └──────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────┘
```

### Changes

#### 1. Generate video thumbnail
Use the first frame of the uploaded video as a real thumbnail image. Save to `public/images/video-thumbnail.jpg`. This replaces the plain gradient placeholder with a relatable preview frame from the actual video.

**Alternative approach**: Use a hidden `<video>` element with a `poster`-like technique — load the video, seek to ~2 seconds, grab a frame via canvas, and use it as the thumbnail. Simpler: just use the `<video>` tag itself with `preload="metadata"` and show a frame at a specific time as the thumbnail background without autoplay.

#### 2. Update `src/components/HeroSection.tsx`

**Layout changes:**
- Center-align the headline, subtext, and CTA buttons (text-center on mobile and desktop)
- Below the CTAs, show a **two-column row** with the video thumbnail on the left and the loyalty card on the right
- On mobile, stack them vertically (video first, then card)

**Video thumbnail:**
- Replace the gradient placeholder with the actual video element showing a preview frame (using `preload="metadata"` and seeking to ~2s)
- Keep the play button overlay and "Watch how Perk Back works" label
- Give it a slightly larger, more prominent size

**Visual polish:**
- Add a subtle glassmorphism card wrapper around the video thumbnail
- Keep floating badges on the loyalty card
- Keep sparkle particles background

#### 3. Minor CSS additions in `src/index.css`
- Add a glass-card utility if needed for the thumbnail wrapper

### Files
- **Modified**: `src/components/HeroSection.tsx` — new centered layout + video thumbnail with real frame
- **Modified**: `src/index.css` — minor utility additions if needed

