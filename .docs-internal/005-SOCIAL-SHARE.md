# F-005: Event Social Share Feature

**Status:** SPECIFICATION  
**Session:** Dec 15, 2025  
**Target:** EventDetail page + Dashboard (future)  
**Effort:** 1-2 days  
**Complexity:** Low (no backend, all client-side sharing)  

---

## 📋 Feature Overview

Enable attendees to share event details on social media platforms and via email. Share buttons appear prominently on the EventDetail page header.

**Share Channels:**
- **WhatsApp** - Message with event link + title
- **Twitter/X** - Tweet with hashtag + event link
- **Facebook** - Share to timeline with event details
- **Email** - Pre-filled subject line and event info
- **Copy Link** - Copy event URL to clipboard with confirmation

**Where it appears:**
- EventDetail page (header, near event title)
- Future: Dashboard event cards, bookmarks shelf

---

## 🎯 User Stories

### US-501: Share Event on Social Media
**As a** event attendee  
**I want to** easily share events with my social network  
**So that** I can invite friends or track what I'm attending

**Acceptance Criteria:**
- One-click sharing to WhatsApp, Twitter, Facebook
- Pre-populated with event title and link
- Share button has social media icon and label
- Works on mobile and desktop

### US-502: Share Event via Email
**As a** an older attendee or professional  
**I want to** email event details to friends  
**So that** I can share in a more formal way

**Acceptance Criteria:**
- Email button opens mailto: with pre-filled subject
- Subject includes event title
- Body includes event details
- Link is included in email body

### US-503: Copy Event Link to Clipboard
**As a** a user on any platform  
**I want to** copy the event link to share in messages/apps not listed  
**So that** I have flexibility in how I share

**Acceptance Criteria:**
- Copy button visible on EventDetail
- Click shows "Copied!" toast notification
- Works on mobile (copies to clipboard API)
- Icon changes briefly to show success

---

## 🎨 UI Design

### EventDetail Header Share Section

**Location:** EventDetail page, near event title (top of page)

```
┌────────────────────────────────────────────────────┐
│ Art Gallery Night                    [Share ▼] ×  │
├────────────────────────────────────────────────────┤
│ [📱 WhatsApp] [𝕏 Twitter] [f Facebook] [✉ Email]   │
│ [🔗 Copy Link]                                      │
│                                                     │
│ Category: Art | 🎫 48 / 50 attending               │
└────────────────────────────────────────────────────┘
```

### Share Button Group

- **Layout:** Horizontal flex row, wraps on mobile
- **Button Style:** Pill-shaped with social media color + white icon
- **Spacing:** 8px between buttons
- **Responsive:** Stack vertically on <640px screens

### Individual Button Styles

| Platform | Color | Icon | Text |
|----------|-------|------|------|
| WhatsApp | `bg-green-500` | 💬 | "Share" |
| Twitter | `bg-black` | 𝕏 | "Tweet" |
| Facebook | `bg-blue-600` | f | "Share" |
| Email | `bg-gray-600` | ✉ | "Email" |
| Copy | `bg-gray-400` | 🔗 | "Copy Link" |

### Toast Notifications

- "Copied to clipboard!" (green, 3 seconds)
- "Shared successfully!" (blue, 2 seconds, if API supports tracking)

---

## 🛠️ Technical Implementation

### Core Share Functions

```javascript
// Social share helpers
const shareUrls = {
  whatsapp: (eventTitle, eventUrl) => 
    `https://wa.me/?text=${encodeURIComponent(eventTitle + ' ' + eventUrl)}`,
  
  twitter: (eventTitle, eventUrl) => 
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}&hashtags=EventiFy`,
  
  facebook: (eventUrl) => 
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
  
  email: (eventTitle, eventUrl, eventDate) => 
    `mailto:?subject=${encodeURIComponent(`Check out: ${eventTitle}`)}&body=${encodeURIComponent(`I'm attending ${eventTitle}\n\nDate: ${eventDate}\n\n${eventUrl}`)}`,
  
  copy: async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }
}
```

### New Component: `ShareButtons.jsx`

```javascript
import { 
  ShareIcon, 
  LinkIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { useNotification } from '../contexts/NotificationContext'

export default function ShareButtons({ 
  eventTitle, 
  eventUrl, 
  eventDate,
  onClose 
}) {
  const { showSuccess } = useNotification()

  const handleShare = (platform) => {
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${eventTitle} ${eventUrl}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(eventUrl)}&hashtags=EventiFy`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(`Check out: ${eventTitle}`)}&body=${encodeURIComponent(`I'm attending ${eventTitle}\n\nDate: ${eventDate}\n\n${eventUrl}`)}`
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(eventUrl).then(() => {
        showSuccess('Copied to clipboard!')
      })
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Share Event</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { platform: 'whatsapp', icon: '💬', label: 'WhatsApp', color: 'bg-green-500' },
          { platform: 'twitter', icon: '𝕏', label: 'Twitter', color: 'bg-black' },
          { platform: 'facebook', icon: 'f', label: 'Facebook', color: 'bg-blue-600' },
          { platform: 'email', icon: '✉', label: 'Email', color: 'bg-gray-600' },
          { platform: 'copy', icon: '🔗', label: 'Copy Link', color: 'bg-gray-400' }
        ].map(({ platform, icon, label, color }) => (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={`${color} text-white px-3 py-2 rounded-full text-sm font-medium hover:opacity-90 transition flex items-center gap-1`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Integration into EventDetail Page

**File:** `/src/pages/EventDetail.jsx`

```javascript
import ShareButtons from '../components/ShareButtons'
import { ShareIcon } from '@heroicons/react/24/outline'

// In state:
const [showShareModal, setShowShareModal] = useState(false)

// In render (top section):
<div className="flex justify-between items-center mb-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
      {event.title}
    </h1>
  </div>
  <button
    onClick={() => setShowShareModal(!showShareModal)}
    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
  >
    <ShareIcon className="h-5 w-5" />
    Share
  </button>
</div>

{showShareModal && (
  <ShareButtons 
    eventTitle={event.title}
    eventUrl={`${window.location.origin}/events/${event.id}`}
    eventDate={format(new Date(event.event_start), 'PPP p')}
    onClose={() => setShowShareModal(false)}
  />
)}
```

### Full Share URLs (Examples)

**WhatsApp:**
```
https://wa.me/?text=Art%20Gallery%20Night%20https%3A%2F%2Feventify.com%2Fevents%2F123
```

**Twitter:**
```
https://twitter.com/intent/tweet?text=Art%20Gallery%20Night&url=https%3A%2F%2Feventify.com%2Fevents%2F123&hashtags=EventiFy
```

**Facebook:**
```
https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Feventify.com%2Fevents%2F123
```

**Email:**
```
mailto:?subject=Check%20out%3A%20Art%20Gallery%20Night&body=I%27m%20attending%20Art%20Gallery%20Night%0A%0ADate%3A%20Dec%2015%2C%202025%0A%0Ahttps%3A%2F%2Feventify.com%2Fevents%2F123
```

---

## 🧪 Test Cases

### TC-501: Share to WhatsApp
- **Given:** User on EventDetail page
- **When:** Clicks WhatsApp button
- **Then:** Opens WhatsApp (or WhatsApp Web) with event title + link pre-filled

### TC-502: Share to Twitter
- **Given:** User on EventDetail page
- **When:** Clicks Twitter button
- **Then:** Opens Twitter compose with event title, link, and #EventiFy hashtag

### TC-503: Share to Facebook
- **Given:** User on EventDetail page
- **When:** Clicks Facebook button
- **Then:** Opens Facebook share dialog with event URL

### TC-504: Share via Email
- **Given:** User on EventDetail page
- **When:** Clicks Email button
- **Then:** Opens email client with subject + body pre-filled

### TC-505: Copy Event Link
- **Given:** User on EventDetail page
- **When:** Clicks Copy Link button
- **Then:** URL copied to clipboard + "Copied!" toast shows

### TC-506: Copy Works on Mobile
- **Given:** Mobile browser, Clipboard API available
- **When:** Clicks Copy Link
- **Then:** Event URL copied to clipboard successfully

### TC-507: Share Modal Toggle
- **Given:** EventDetail page loaded
- **When:** User clicks Share button
- **Then:** Modal opens with 5 share options
- **And:** Clicking X closes modal

### TC-508: Multiple Share Actions
- **Given:** Share modal open
- **When:** User shares to multiple platforms in sequence
- **Then:** Each share opens correct URL/handler
- **And:** Modal stays open

### TC-509: Event Title with Special Characters
- **Given:** Event titled "Rock & Roll Night 2025!"
- **When:** User shares
- **Then:** Special chars properly URL-encoded
- **And:** Display correctly on receiving platform

### TC-510: Long Event Titles
- **Given:** Event with 100+ character title
- **When:** User shares
- **Then:** Title fits in share platforms
- **And:** Twitter truncates with ... if needed

### TC-511: Event Date Formatting in Email
- **Given:** Event on Dec 15, 2025 at 6:30 PM
- **When:** User shares via email
- **Then:** Email body shows formatted date (not raw timestamp)

### TC-512: Share Button Visible on All Screens
- **Given:** Various screen sizes
- **When:** EventDetail page renders
- **Then:** Share button visible and accessible

---

## 📊 Analytics (Future)

Track share events (optional, not in scope):
- Which platform most used
- Share → RSVP conversion
- Share → Attendance correlation

---

## 🔗 Dependencies

- **Existing:** EventDetail page, useNotification
- **Web APIs:** 
  - Clipboard API (navigator.clipboard.writeText)
  - window.open for social redirects
  - mailto: links for email
- **Icons:** ShareIcon, XMarkIcon (from @heroicons/react/24/outline)

---

## 📝 Implementation Order

1. Create ShareButtons.jsx component
2. Add to EventDetail page (with toggle modal)
3. Test each platform on desktop/mobile
4. Add Toast notifications
5. Verify URL encoding works correctly
6. Test with various event details

---

## 🚀 Acceptance Criteria (Final)

- ✅ Share button visible on EventDetail header
- ✅ WhatsApp share works (opens with pre-filled message)
- ✅ Twitter share works (opens with title, link, hashtag)
- ✅ Facebook share works (opens share dialog)
- ✅ Email share works (pre-filled subject + body)
- ✅ Copy link works (copies to clipboard + toast)
- ✅ Works on mobile and desktop
- ✅ Special characters properly URL-encoded
- ✅ Modal toggles open/closed
- ✅ Responsive design (stacks on small screens)
- ✅ Dark mode compatible

---

## 🎯 Future Enhancements

- Add analytics tracking
- Add Telegram, LinkedIn share options
- QR code for event (future)
- Share preview with event image
- Analytics dashboard for shares → RSVPs
