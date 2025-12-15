# F-003: Attendee Sort & Filter Feature

**Status:** SPECIFICATION  
**Session:** Dec 15, 2025  
**Target:** Dashboard attending panel (RSVP events tab)  
**Effort:** 1 day  
**Complexity:** Low (client-side only)  

---

## 📋 Feature Overview

Add sorting and search capabilities to the "Attending" events list in the Dashboard. Users can:
- **Search** by event name/title
- **Sort** by: Name (A-Z), Date (Upcoming), Distance (future), or Recently Added
- **Persist** preferences to localStorage
- **Mobile-friendly** search/sort UI

This improves discoverability for users with many attending events.

---

## 🎯 User Stories

### US-301: Search Attending Events
**As a** attendee with many bookmarks  
**I want to** quickly find events by name  
**So that** I don't have to scroll through all my attending events

**Acceptance Criteria:**
- Search input filters events in real-time
- Case-insensitive matching
- Searches event title and description
- Clear button appears when text is entered
- Works on mobile without layout shift

### US-302: Sort Attending Events
**As a** an attendee  
**I want to** choose how my events are ordered  
**So that** I can prioritize upcoming events or browse by name

**Acceptance Criteria:**
- Sort dropdown with 4 options (see below)
- Default: "Upcoming" (nearest date first)
- Selection persists in localStorage
- Organizers can also use (for their created events too? - NO, only attending)

### US-303: Combined Search + Sort
**As a** an attendee  
**I want** search and sort to work together  
**So that** I can find and organize events flexibly

**Acceptance Criteria:**
- Search filters the list
- Sort applies to filtered results
- Both preferences persist independently
- Reset button clears both (optional: add later if needed)

---

## 🎨 UI Design

### Layout (Dashboard.jsx - Attending Tab)

```
┌─────────────────────────────────────────┐
│  Attending Events (4)                    │  [Back button if needed]
├──────────────────┬──────────────────────┤
│ [Search box]     │ [Sort ▼] Upcoming    │
└──────────────────┴──────────────────────┘

[Event 1] - Date A
[Event 2] - Date B
[Event 3] - Date C
```

### Search Box
- Placeholder: "Search events..."
- Icon: MagnifyingGlassIcon (Heroicons)
- Clear button: XMarkIcon (only when typed)
- Tailwind: `flex-1 min-w-[200px]`

### Sort Dropdown
- Default: "Upcoming"
- Options (enum):
  1. **Upcoming** - Sort by date ascending (closest first)
  2. **Name (A-Z)** - Alphabetical by title
  3. **Recently Added** - By join date descending (most recent RSVP first)
  4. **Distance** - By location (future: calculate miles, now: N/A)

### Events Count
- Show in header: "Attending Events (4)"
- Update when search filters

### Mobile Responsiveness
- Stacked layout on <640px:
  ```
  [Search] (full width)
  [Sort ▼]  (full width)
  ```
- Side-by-side on ≥640px

---

## 🛠️ Technical Implementation

### Data Flow

```
Dashboard Component
├── State:
│   ├── rsvpEvents: Event[]          (from API)
│   ├── searchQuery: string = ""
│   ├── sortBy: 'upcoming'|'name'|'added'|'distance' = 'upcoming'
│   └── filteredEvents: Event[]       (computed)
│
├── Effects:
│   ├── Load preferences from localStorage on mount
│   └── Save preferences to localStorage on change
│
└── Render:
    ├── Search input (onChange → setSearchQuery)
    ├── Sort dropdown (onChange → setSortBy)
    └── Filtered/sorted events list
```

### State Management (in Dashboard.jsx)

```javascript
const [rsvpEvents, setRsvpEvents] = useState([])    // Existing
const [searchQuery, setSearchQuery] = useState('')   // NEW
const [sortBy, setSortBy] = useState('upcoming')    // NEW

// Load preferences from localStorage on component mount
useEffect(() => {
  const savedSort = localStorage.getItem('dashboard_attendee_sort') || 'upcoming'
  const savedSearch = localStorage.getItem('dashboard_attendee_search') || ''
  setSortBy(savedSort)
  setSearchQuery(savedSearch)
}, [])

// Save sort preference
useEffect(() => {
  localStorage.setItem('dashboard_attendee_sort', sortBy)
}, [sortBy])

// Save search preference (optional, but good UX)
useEffect(() => {
  localStorage.setItem('dashboard_attendee_search', searchQuery)
}, [searchQuery])

// Compute filtered + sorted events
const filteredEvents = useMemo(() => {
  let result = rsvpEvents

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    result = result.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    )
  }

  // Sort
  switch (sortBy) {
    case 'upcoming':
      result.sort((a, b) =>
        new Date(a.event_start) - new Date(b.event_start)
      )
      break
    case 'name':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'added':
      // Assuming events have a join date or RSVP date
      // For now, reverse order (most recent first)
      result = [...result].reverse()
      break
    case 'distance':
      // Placeholder for future implementation
      // For now, no sorting
      break
  }

  return result
}, [rsvpEvents, searchQuery, sortBy])
```

### Component Changes

**File: `/src/pages/Dashboard.jsx`**

1. **Add state variables** (above `useEffect`)
   ```jsx
   const [searchQuery, setSearchQuery] = useState('')
   const [sortBy, setSortBy] = useState('upcoming')
   ```

2. **Add localStorage load + save** (in `useEffect` hooks)
   ```jsx
   // Load preferences
   useEffect(() => {
     const savedSort = localStorage.getItem('dashboard_attendee_sort') || 'upcoming'
     setSortBy(savedSort)
   }, [])

   // Save sort preference
   useEffect(() => {
     localStorage.setItem('dashboard_attendee_sort', sortBy)
   }, [sortBy])
   ```

3. **Add `useMemo` for filtering/sorting** (before render)
   ```jsx
   const filteredEvents = useMemo(() => {
     // [implementation from above]
   }, [rsvpEvents, searchQuery, sortBy])
   ```

4. **Add search + sort UI** (in `activeTab === 'rsvp'` section)
   ```jsx
   <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center">
     <div className="relative flex-1">
       <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
       <input
         type="text"
         placeholder="Search events..."
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
       />
       {searchQuery && (
         <button
           onClick={() => setSearchQuery('')}
           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
         >
           <XMarkIcon className="h-5 w-5" />
         </button>
       )}
     </div>

     <select
       value={sortBy}
       onChange={(e) => setSortBy(e.target.value)}
       className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white bg-white"
     >
       <option value="upcoming">Upcoming</option>
       <option value="name">Name (A-Z)</option>
       <option value="added">Recently Added</option>
       <option value="distance">Distance</option>
     </select>
   </div>

   <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
     Attending Events ({filteredEvents.length})
   </p>
   ```

5. **Use `filteredEvents`** instead of `rsvpEvents` in the render
   ```jsx
   {filteredEvents.length > 0 ? (
     filteredEvents.map((event) => (
       // [existing event card code]
     ))
   ) : (
     <div className="text-center py-8">
       <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
       <p className="text-gray-600 dark:text-gray-300">
         {searchQuery ? 'No events match your search.' : "You're not attending any events yet."}
       </p>
     </div>
   )}
   ```

6. **Add imports** (if not already present)
   ```jsx
   import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
   import { useMemo } from 'react'
   ```

---

## 🧪 Test Cases

### TC-301: Search Functionality
- **Given:** User has 5 attending events (Art Night, Music Fest, Yoga Class, Game Night, Art Workshop)
- **When:** User types "art" in search
- **Then:** Only "Art Night" and "Art Workshop" are displayed
- **And:** Count shows "2"

### TC-302: Search Case Insensitivity
- **Given:** Event titled "Music Festival"
- **When:** User searches "MUSIC"
- **Then:** Event is found and displayed

### TC-303: Sort by Upcoming
- **Given:** Events on Dec 20, Dec 15, Dec 25
- **When:** Sort is "Upcoming" (default)
- **Then:** Events display in order: Dec 15, Dec 20, Dec 25

### TC-304: Sort by Name
- **Given:** Events titled "Yoga", "Art Night", "Fitness"
- **When:** Sort is "Name (A-Z)"
- **Then:** Events display in order: Art Night, Fitness, Yoga

### TC-305: Search + Sort Together
- **Given:** 5 events, 3 match "art"
- **When:** User searches "art" and selects "Name" sort
- **Then:** Only matching 3 are shown, in alphabetical order

### TC-306: Clear Search
- **Given:** User has typed "art"
- **When:** User clicks X button
- **Then:** Search is cleared and all events are shown

### TC-307: localStorage Persistence
- **Given:** User selects "Name (A-Z)" sort
- **When:** User refreshes page
- **Then:** Sort preference is remembered and "Name (A-Z)" is selected

### TC-308: Mobile Layout
- **Given:** Screen width < 640px
- **When:** Search + sort are rendered
- **Then:** They stack vertically with full width

### TC-309: Empty State Messages
- **Given:** No attending events
- **When:** Dashboard attending tab opens
- **Then:** "You're not attending any events yet" message shows

- **Given:** Search matches nothing
- **When:** User types "xyz"
- **Then:** "No events match your search" message shows

---

## 🔗 Dependencies

- **Existing:** Dashboard.jsx, useAuth, useNotification, eventsAPI
- **New:** useMemo hook (already imported)
- **Icons:** MagnifyingGlassIcon, XMarkIcon (from @heroicons/react/24/outline)

---

## 📝 Notes

- **Scope:** Attending events (RSVP tab) only - organizers see their created events in "Created" tab, no sorting needed yet
- **Future:** Add sorting to "Created Events" tab and bookmarks shelf
- **Distance:** Placeholder for future when geolocation is added
- **Performance:** useMemo prevents re-filtering on every render

---

## 🚀 Acceptance Criteria (Final)

- ✅ Search filters events in real-time (case-insensitive)
- ✅ Sort dropdown with 4 options works correctly
- ✅ Default sort is "Upcoming"
- ✅ Preferences persist in localStorage
- ✅ Mobile-friendly layout (stacked on small screens)
- ✅ Shows count of filtered events
- ✅ Empty states display appropriate messages
- ✅ Works with dark mode
