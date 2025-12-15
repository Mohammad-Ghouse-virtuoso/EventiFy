# F-002: Bookmark Events

**Status:** READY TO IMPLEMENT  
**Priority:** HIGH  
**Effort:** 1-2 days  
**Depends On:** F-001 (Event Detail Page)

---

## Overview

Allow attendees to save events for later reference. Bookmarked events appear in "My Bookmarks" shelf on Dashboard.

---

## User Stories

**As an attendee**, I want to bookmark interesting events so I can find them later without searching.

**As an attendee**, I want to see all my bookmarked events in one place on my dashboard.

**As an attendee**, I want to unbookmark an event by clicking the same button again.

---

## Design

### UI Components

**BookmarkButton (Heart Icon)**
```
Unfilled State:  ♡ (outline)
Hover:          ♡ (gray background)
Filled State:   ♥ (red/pink filled)
```

**Locations:**
- Event Card (list view)
- Event Detail Page (top right, near Share button)
- Bookmarked Events shelf (remove button variant)

**Toast Notifications:**
- "Event bookmarked! 🎉"
- "Event removed from bookmarks"

---

## Backend Implementation

### Data Model

```sql
CREATE TABLE user_bookmarks (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id),
  FOREIGN KEY(user_id) REFERENCES user(id),
  FOREIGN KEY(event_id) REFERENCES event(id)
)
```

### SQLModel

```python
# app/models/bookmark.py
from sqlmodel import SQLModel, Field
from datetime import datetime

class UserBookmark(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    __tablename__ = "user_bookmarks"
```

### API Endpoints

**POST /api/v1/events/{event_id}/bookmark**
- Create bookmark
- Auth required: User
- Response: `{ "message": "Event bookmarked", "id": 123 }`

**DELETE /api/v1/events/{event_id}/bookmark**
- Remove bookmark
- Auth required: User
- Response: `{ "message": "Bookmark removed" }`

**GET /api/v1/user/bookmarks**
- Get all user's bookmarks
- Auth required: User
- Response: `[{ id, event_id, title, date, location, created_at }, ...]`

**GET /api/v1/events/{event_id}/bookmark/status**
- Check if user has bookmarked
- Auth required: User
- Response: `{ "is_bookmarked": true }`

---

## Frontend Implementation

### Components

**BookmarkButton.jsx**
```jsx
Props:
- eventId: number
- isBookmarked: boolean
- size: 'sm' | 'md' | 'lg' (default: 'md')
- onBookmark: (eventId, isBookmarked) => void

State:
- loading: boolean
- isBookmarked: boolean

Features:
- Click to toggle
- Show loading state
- Show notification
- Optimistic UI update
```

**BookmarkedEventsShelf.jsx** (on Dashboard)
```jsx
Props:
- user: User object

Features:
- Display bookmarked events as grid
- Empty state: "No bookmarks yet"
- Show date, title, location
- Remove button (X icon)
- Click event card to go to detail page
```

### Frontend API Service

```javascript
// src/services/api.js - Add to bookmarkAPI

export const bookmarkAPI = {
  // Create bookmark
  bookmark: async (eventId) => {
    const { data } = await api.post(`/events/${eventId}/bookmark`)
    return data
  },
  
  // Remove bookmark
  unbookmark: async (eventId) => {
    const { data } = await api.delete(`/events/${eventId}/bookmark`)
    return data
  },
  
  // Get user's bookmarks
  getMyBookmarks: async () => {
    const { data } = await api.get('/user/bookmarks')
    return data
  },
  
  // Check if event is bookmarked
  isBookmarked: async (eventId) => {
    const { data } = await api.get(`/events/${eventId}/bookmark/status`)
    return data.is_bookmarked
  }
}
```

---

## Implementation Checklist

### Backend
- [ ] Create `user_bookmarks` table migration
- [ ] Add SQLModel `UserBookmark` class
- [ ] Implement endpoints in `bookmarks.py` router
- [ ] Add auth checks (require_user)
- [ ] Test endpoints with curl/Postman

### Frontend
- [ ] Create `BookmarkButton.jsx` component
- [ ] Create `BookmarkedEventsShelf.jsx` component
- [ ] Add `bookmarkAPI` to `src/services/api.js`
- [ ] Integrate BookmarkButton into EventCard
- [ ] Integrate BookmarkButton into EventDetail page
- [ ] Add BookmarkedEventsShelf to Dashboard
- [ ] Add notifications (useNotification)

### Testing
- [ ] Unit: BookmarkButton toggle logic
- [ ] Integration: API endpoints (login, bookmark, unbookmark, fetch)
- [ ] E2E: User can bookmark/unbookmark and see in dashboard

---

## Test Cases

### Backend Tests

```python
# test_bookmarks_api.py

def test_bookmark_event(client, user_headers):
    """POST /events/{id}/bookmark creates bookmark"""
    # Arrange
    event_id = 1
    
    # Act
    response = client.post(
        f"/api/v1/events/{event_id}/bookmark",
        headers=user_headers
    )
    
    # Assert
    assert response.status_code == 201
    assert response.json()["message"] == "Event bookmarked"

def test_unbookmark_event(client, user_headers):
    """DELETE /events/{id}/bookmark removes bookmark"""
    # First bookmark
    event_id = 1
    client.post(f"/api/v1/events/{event_id}/bookmark", headers=user_headers)
    
    # Then unbookmark
    response = client.delete(
        f"/api/v1/events/{event_id}/bookmark",
        headers=user_headers
    )
    
    assert response.status_code == 200

def test_get_user_bookmarks(client, user_headers):
    """GET /user/bookmarks returns user's bookmarked events"""
    # Bookmark 2 events
    client.post("/api/v1/events/1/bookmark", headers=user_headers)
    client.post("/api/v1/events/2/bookmark", headers=user_headers)
    
    # Fetch bookmarks
    response = client.get("/api/v1/user/bookmarks", headers=user_headers)
    
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_cannot_bookmark_twice(client, user_headers):
    """Bookmarking same event twice is idempotent"""
    event_id = 1
    
    client.post(f"/api/v1/events/{event_id}/bookmark", headers=user_headers)
    response = client.post(
        f"/api/v1/events/{event_id}/bookmark",
        headers=user_headers
    )
    
    # Should return 200 (already bookmarked) or handle gracefully
    assert response.status_code in [200, 400]
```

### Frontend Tests

```jsx
// BookmarkButton.test.jsx

describe('BookmarkButton', () => {
  it('renders unfilled heart initially', () => {
    render(<BookmarkButton eventId={1} isBookmarked={false} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('fills heart when bookmarked', () => {
    const { rerender } = render(
      <BookmarkButton eventId={1} isBookmarked={false} />
    )
    expect(screen.getByRole('button')).toHaveClass('text-gray-400')
    
    rerender(<BookmarkButton eventId={1} isBookmarked={true} />)
    expect(screen.getByRole('button')).toHaveClass('text-red-500')
  })

  it('calls onBookmark when clicked', async () => {
    const handleBookmark = jest.fn()
    render(
      <BookmarkButton 
        eventId={1} 
        isBookmarked={false}
        onBookmark={handleBookmark}
      />
    )
    
    await userEvent.click(screen.getByRole('button'))
    expect(handleBookmark).toHaveBeenCalledWith(1, true)
  })
})
```

---

## Database Migration

```python
# backend/migrations/versions/001_add_user_bookmarks.py

def upgrade():
    op.create_table(
        'user_bookmarks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.ForeignKeyConstraint(['event_id'], ['event.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'event_id')
    )

def downgrade():
    op.drop_table('user_bookmarks')
```

---

## Notes

- Bookmarks are private to each user
- Deleting event should cascade-delete bookmarks
- Deleting user should cascade-delete bookmarks
- Use optimistic UI updates (show filled immediately, sync with backend)
- Show unread bookmarks count in dashboard navigation (future enhancement)

