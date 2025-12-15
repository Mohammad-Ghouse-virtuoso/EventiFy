# F-004: 48h Event Countdown Timer

**Status:** SPECIFICATION  
**Session:** Dec 15, 2025  
**Target:** Dashboard attending panel + EventDetail page  
**Effort:** 1 day  
**Complexity:** Medium (time calculations, formatting)  

---

## 📋 Feature Overview

Display a countdown timer for events starting within 48 hours. Shows hours/minutes remaining in an eye-catching badge.

**Where it appears:**
- Dashboard "Attending" tab (on event cards)
- EventDetail page (in ActionBar section)
- Bookmarks shelf (optional, future)

Users can quickly see how soon their events are starting without checking the calendar.

---

## 🎯 User Stories

### US-401: See 48h Countdown for Upcoming Events
**As a** attendee  
**I want to** see a countdown timer for events starting soon (within 48h)  
**So that** I can quickly prioritize and prepare for nearby events

**Acceptance Criteria:**
- Timer shows only for events within 48 hours
- Format: "Starts in 2h 30m" or "Starts in 18h"
- Updates in real-time (every minute)
- Disappears when event has passed
- Shows different color for <1h (red/urgent) vs 1-48h (blue/warning)

### US-402: Timer Updates Without Page Reload
**As a** an attendee  
**I want** the timer to countdown in real-time  
**So that** I don't need to refresh to see time remaining

**Acceptance Criteria:**
- Timer updates every minute automatically
- No noticeable performance impact
- Multiple timers on page update correctly
- Stops updating after event passes

### US-403: Clear Visual Distinction for Urgent Events
**As a** an attendee  
**I want** events <1h away to look different  
**So that** I know which events are happening right now

**Acceptance Criteria:**
- Events <1h away use red/urgent color
- Events 1-48h away use blue/warning color
- Pulsing animation optional but nice for <30m

---

## 🎨 UI Design

### Event Card Display (Dashboard Attending Panel)

**Current:**
```
[Event Title]
Description text...
📅 Dec 20 at 6:00 PM
```

**With Timer:**
```
[Event Title]          [⏱ 2h 30m]
Description text...
📅 Dec 20 at 6:00 PM
```

### Badge Appearance

**Timer Badge:**
- Small pill badge in top-right of event card
- Format: "⏱ Xh Ym" (hourglass + time)
- Background: 
  - **Red** if <1h away (bg-red-500, text-white)
  - **Blue** if 1-48h away (bg-blue-500, text-white)
  - **Hidden** if >48h or past

### EventDetail ActionBar

Currently shows RSVP buttons. Add timer to top-right:

```
┌─────────────────────────────────────────┐
│ RSVP Status: Going    [⏱ 2h 30m]       │
├─────────────────────────────────────────┤
│ [Going] [Maybe] [Can't Go] [❤ Bookmark]│
└─────────────────────────────────────────┘
```

### Color Scheme

| Time Range | Color | Background | Text |
|-----------|-------|-----------|------|
| < 1h | Urgent | `bg-red-500` | `text-white` |
| 1-48h | Warning | `bg-blue-500` | `text-white` |
| > 48h | Hidden | N/A | N/A |
| Past | Hidden | N/A | N/A |

### Mobile Responsive

- On small screens, badge may wrap to next line
- Use flex-wrap to prevent layout shift
- Icon + time on same line

---

## 🛠️ Technical Implementation

### Core Logic

```javascript
const getTimeRemaining = (eventStartTime) => {
  const now = new Date()
  const eventTime = new Date(eventStartTime)
  const diffMs = eventTime - now
  
  // Return null if already past or > 48 hours
  if (diffMs <= 0) return null
  const hours48InMs = 48 * 60 * 60 * 1000
  if (diffMs > hours48InMs) return null
  
  // Calculate hours and minutes
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return { hours, minutes, diffMs, isUrgent: hours < 1 }
}

const formatTimeRemaining = (hours, minutes) => {
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
```

### New Component: `EventTimer.jsx`

```javascript
import { useEffect, useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function EventTimer({ eventStartTime }) {
  const [timeRemaining, setTimeRemaining] = useState(null)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const eventTime = new Date(eventStartTime)
      const diffMs = eventTime - now

      if (diffMs <= 0 || diffMs > 48 * 60 * 60 * 1000) {
        setTimeRemaining(null)
        return
      }

      const totalMinutes = Math.floor(diffMs / 60000)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      setTimeRemaining({
        hours,
        minutes,
        isUrgent: hours < 1
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [eventStartTime])

  if (!timeRemaining) return null

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
      timeRemaining.isUrgent
        ? 'bg-red-500 text-white'
        : 'bg-blue-500 text-white'
    }`}>
      <ClockIcon className="h-4 w-4" />
      <span>
        {timeRemaining.hours > 0
          ? `${timeRemaining.hours}h ${timeRemaining.minutes}m`
          : `${timeRemaining.minutes}m`
        }
      </span>
    </div>
  )
}
```

### Integration Points

#### 1. Dashboard Event Card (Attending Tab)

**File:** `/src/pages/Dashboard.jsx`

```javascript
// Add import
import EventTimer from '../components/EventTimer'

// In the event card render section (filteredEvents.map):
<div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
  {/* Add timer to top-right */}
  <div className="absolute top-4 right-4">
    <EventTimer eventStartTime={event.event_start} />
  </div>
  
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
  {/* rest of card */}
</div>
```

#### 2. EventDetail Page (ActionBar)

**File:** `/src/components/event-detail/ActionBar.jsx`

```javascript
import EventTimer from '../EventTimer'

// In render, add timer to header section:
<div className="flex justify-between items-center mb-4">
  <span className="text-sm text-gray-600">RSVP Status: Going</span>
  <EventTimer eventStartTime={event.event_start} />
</div>
```

#### 3. Bookmarks Shelf (Optional, Future)

Same pattern as dashboard.

---

## 🧪 Test Cases

### TC-401: Timer Shows for Events <48h Away
- **Given:** Event on Dec 15, 2:00 PM, current time Dec 13, 6:00 PM
- **When:** EventTimer renders
- **Then:** Shows "39h 0m"

### TC-402: Timer Hides for Events >48h Away
- **Given:** Event on Dec 20, current time Dec 15
- **When:** EventTimer renders
- **Then:** Nothing is displayed (returns null)

### TC-403: Timer Shows Urgent Style <1h Away
- **Given:** Event on Dec 15, 1:30 PM, current time Dec 15, 1:00 PM
- **When:** EventTimer renders
- **Then:** Badge shows red background with "30m" text

### TC-404: Timer Updates Every Minute
- **Given:** EventTimer mounted
- **When:** 1 minute passes
- **Then:** Time displayed decreases by 1 minute
- **And:** Component re-renders

### TC-405: Timer Stops After Event Passes
- **Given:** Event on Dec 15, 2:00 PM, current time Dec 15, 2:05 PM
- **When:** EventTimer renders
- **Then:** Returns null (nothing displayed)

### TC-406: Hours and Minutes Format
- **Given:** 125 minutes remaining
- **When:** EventTimer formats time
- **Then:** Shows "2h 5m" (not "125m")

### TC-407: Single Digit Minute Display
- **Given:** 61 minutes remaining
- **When:** EventTimer formats time
- **Then:** Shows "1h 1m" (with leading zero if needed)

### TC-408: Mobile Responsive Badge
- **Given:** Screen width < 640px
- **When:** Event card renders
- **Then:** Timer badge fits and doesn't cause layout issues

### TC-409: Multiple Timers on Same Page
- **Given:** Dashboard with 5 attending events, all <48h away
- **When:** Page loads
- **Then:** All 5 show different timers, updating correctly
- **And:** No interval conflicts

### TC-410: Component Cleanup
- **Given:** EventTimer mounted and unmounted quickly
- **When:** Component unmounts
- **Then:** Interval is cleared (no memory leak)

---

## 📊 Performance Considerations

- **Intervals:** One interval per component instance (not global) - manageable
- **Update frequency:** Every 60 seconds (minute granularity) - efficient
- **Optimization:** useMemo to prevent unnecessary calculations
- **Memory:** Cleanup intervals on unmount

### Potential Optimization (if needed)
- Global interval manager if 100+ timers exist
- Server-side timestamp to prevent clock drift
- Reduce precision (5-minute updates) for large lists

---

## 🔗 Dependencies

- **Existing:** EventTimer component to create
- **Icons:** ClockIcon (from @heroicons/react/24/outline)
- **Date library:** date-fns (already installed)
- **Hooks:** useState, useEffect

---

## 📝 Implementation Order

1. Create EventTimer.jsx component
2. Add to Dashboard event cards (in filteredEvents loop)
3. Add to EventDetail ActionBar
4. Test with various event times (past, <1h, 1-48h, >48h)
5. Verify performance with multiple timers
6. Dark mode compatibility check

---

## 🚀 Acceptance Criteria (Final)

- ✅ Timer displays for events <48h away
- ✅ Format is "Xh Ym" or "Ym"
- ✅ Color is red for <1h, blue for 1-48h
- ✅ Updates every minute without page reload
- ✅ Hides for past events and >48h away
- ✅ Works on Dashboard attending panel
- ✅ Works on EventDetail ActionBar
- ✅ Mobile responsive
- ✅ Dark mode compatible
- ✅ No memory leaks (intervals cleaned up)
