# EventiFy Hero Card - GIF & Video Support 🎬

The `EventifyHeroCard` component now supports **images, GIFs, and videos**!

## Usage Examples

### 1️⃣ Static Image (Default)
```jsx
<EventifyHeroCard
  onGetStarted={() => navigate('/events')}
  illustrationSrc="/path/to/hero-image.png"
  illustrationAlt="EventiFy hero artwork"
/>
```

### 2️⃣ Animated GIF
```jsx
<EventifyHeroCard
  onGetStarted={() => navigate('/events')}
  illustrationSrc="/path/to/animated-hero.gif"
  illustrationType="gif"  // Optional: auto-detected from .gif extension
  illustrationAlt="Animated EventiFy experience"
/>
```

### 3️⃣ Video (MP4/WebM)
```jsx
<EventifyHeroCard
  onGetStarted={() => navigate('/events')}
  illustrationSrc="/path/to/hero-video.mp4"
  illustrationType="video"  // Optional: auto-detected from extension
  videoAutoPlay={true}      // Default: true
  videoLoop={true}          // Default: true
  videoMuted={true}         // Default: true (recommended for autoplay)
  illustrationAlt="EventiFy promotional video"
/>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `illustrationSrc` | string | - | Path to image/GIF/video file |
| `illustrationType` | 'image' \| 'gif' \| 'video' | 'image' | Media type (auto-detected from extension) |
| `illustrationAlt` | string | - | Alt text for accessibility |
| `videoAutoPlay` | boolean | true | Auto-play video on load |
| `videoLoop` | boolean | true | Loop video continuously |
| `videoMuted` | boolean | true | Mute video (required for autoplay) |
| `headline` | string | 'Find Your Next Event...' | Hero title |
| `subtext` | string | 'Discover experiences...' | Hero subtitle |
| `ctaText` | string | 'Get Started' | Button text |
| `onGetStarted` | function | - | Click handler for CTA button |

## Auto-Detection

The component automatically detects media type based on file extension:

- **Videos**: `.mp4`, `.webm`, `.mov`
- **GIFs**: `.gif`
- **Images**: Everything else (`.png`, `.jpg`, `.svg`, etc.)

## Styling Differences

### Image
- Uses `object-contain` with padding
- Best for illustrations/graphics with transparent backgrounds

### GIF
- Uses `object-cover` (no padding)
- Fills the container completely
- Best for full-frame animations

### Video
- Uses `object-cover` (no padding)
- Fills the container completely
- Automatically muted, looping, and autoplaying
- Best for promotional content

## Example: Update Home.jsx

```jsx
// In src/pages/Home.jsx

// Import your media
import heroVideo from '../../assets/hero-animation.mp4'
// OR
import heroGif from '../../assets/hero-animation.gif'

// Use in component
<EventifyHeroCard
  onGetStarted={() => navigate(user ? '/events' : '/register')}
  illustrationSrc={heroVideo}  // or heroGif
  illustrationAlt="EventiFy in action"
/>
```

## Adding New Media Assets

1. Place your GIF/video in `/assets/` directory
2. Supported formats:
   - **GIF**: `.gif`
   - **Video**: `.mp4` (recommended), `.webm`, `.mov`
3. Recommended dimensions: 16:9 or 4:3 aspect ratio
4. File size: Keep under 5MB for optimal loading

## Performance Tips

### For GIFs:
- Optimize with tools like [Gifski](https://gif.ski/) or [ezgif.com](https://ezgif.com/)
- Keep frame count reasonable (aim for < 100 frames)
- Reduce colors to 256 or less

### For Videos:
- Use H.264 codec for MP4
- Compress with tools like [HandBrake](https://handbrake.fr/)
- Target bitrate: 1-2 Mbps for hero videos
- Resolution: 1080p max (720p is often sufficient)
- Always include `muted` attribute for autoplay to work

## Browser Support

- ✅ **Images/GIFs**: All modern browsers
- ✅ **MP4 Video**: All modern browsers
- ✅ **WebM Video**: Chrome, Firefox, Edge (not Safari)
- ⚠️ **MOV Video**: Safari only (provide MP4 fallback)

## Accessibility

- Always provide meaningful `illustrationAlt` text
- Videos include `aria-label` for screen readers
- Autoplay videos are muted by default (accessibility requirement)

## Dark Mode

The media container automatically adapts to dark mode:
- Border color changes
- Background color adapts
- Accent elements adjust opacity

## Example Assets to Try

Free resources for hero media:
- [Lottie Files](https://lottiefiles.com/) - JSON animations (can export as GIF)
- [Pexels Videos](https://www.pexels.com/videos/) - Free stock videos
- [Giphy](https://giphy.com/) - GIF animations
- [Coverr](https://coverr.co/) - Free video backgrounds
