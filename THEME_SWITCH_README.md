# ThemeSwitch Component

A visually polished dark/light theme toggle built with React and Tailwind CSS, featuring smooth animations for moon/sun transitions, stars, and clouds. **Now with full dark mode support across the application!**

## Features

- **Pure Tailwind CSS** - No styled-components or CSS-in-JS
- **Smooth Animations** - Custom cubic-bezier easing for natural motion
- **Visual Elements**:
  - Moon → Sun transition with inner shadow morphing
  - Animated stars (visible in dark mode)
  - Animated cloud SVG (visible in light mode)
  - Background color transition (#2a2a2a → #00a6ff)
- **Accessible** - Uses hidden checkbox with proper labels
- **Peer-checked Pattern** - Leverages Tailwind's peer utility for state-driven styling
- **✨ Full Dark Mode** - Applies actual theme to entire application
- **💾 Persistent** - Saves theme preference to localStorage
- **🎨 System Aware** - Respects user's system theme preference on first load

## What's New - Dark Mode Implementation

### Toggle Functionality
- ✅ **Toggle now works!** - Slider moves from left (light) to right (dark) on click
- ✅ **Actual dark mode** - Not just a visual toggle, applies dark theme to entire app
- ✅ **Smooth transitions** - 300ms duration with proper easing

### Dark Mode Features
1. **Navbar**: Dark background, light text, hover states
2. **Main Content**: Dark background with light text
3. **Links & Buttons**: Proper contrast in both modes
4. **Mobile Menu**: Full dark mode support
5. **Persistence**: Theme saved to localStorage and restored on reload

## Usage

```jsx
import ThemeSwitch from './components/ThemeSwitch'

function MyComponent() {
  const handleThemeChange = (isDark) => {
    console.log('Theme changed to:', isDark ? 'dark' : 'light')
    // Theme is automatically applied to document.documentElement
  }

  return (
    <ThemeSwitch 
      defaultDark={false} 
      onChange={handleThemeChange} 
    />
  )
}
```

## How It Works

### Theme Application
The component adds/removes the `dark` class on `document.documentElement`:
- **Light mode**: `<html>` element has no `dark` class
- **Dark mode**: `<html>` element has `dark` class

Tailwind's `dark:` variant then applies dark mode styles automatically.

### State Management
```javascript
// Initialization priority:
1. localStorage value (if exists)
2. System preference (prefers-color-scheme)
3. defaultDark prop
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultDark` | boolean | `false` | Initial theme state (overridden by localStorage) |
| `onChange` | function | `undefined` | Callback fired when theme changes, receives `isDark` boolean |

## Integration

The component is integrated into:
- **Navbar** (desktop) - Between navigation links and user profile
- **Navbar** (logged out) - Before Login/Sign Up buttons
- Theme persists across page reloads via localStorage

## Dark Mode Coverage

Components with dark mode support:
- ✅ Navbar (desktop & mobile)
- ✅ Main app container
- ✅ Navigation links
- ✅ User profile section
- ✅ Mobile menu

To add dark mode to other components, use Tailwind's `dark:` prefix:
```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

## Customization

### Toggle Appearance
- Background colors: `bg-[#00a6ff]` (light) and `peer-checked:bg-[#2a2a2a]` (dark)
- Toggle size: `h-8 w-16` on the label
- Slider size: `h-6 w-6` on the slider span
- Animation: `duration-300` and `ease-[cubic-bezier(0.81,-0.04,0.38,1.5)]`

### Dark Mode Colors
Tailwind config uses `darkMode: 'class'` mode. Customize dark colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // Your custom dark mode colors
    }
  }
}
```

## Browser Support

- localStorage: All modern browsers
- CSS transitions: All modern browsers
- Dark mode: Requires Tailwind CSS 2.0+

## Troubleshooting

**Toggle doesn't work?**
- Make sure `darkMode: 'class'` is in `tailwind.config.js`
- Check browser console for JavaScript errors

**Theme doesn't persist?**
- Verify localStorage is enabled in browser
- Check browser security settings

**Dark mode styles not applying?**
- Ensure Tailwind processes the `dark:` variants
- Rebuild with `npm run build`

