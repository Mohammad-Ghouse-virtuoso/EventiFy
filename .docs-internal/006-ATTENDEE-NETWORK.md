# F-006: Attendee Network & User Profiles

**Status:** SPECIFICATION  
**Session:** Dec 15, 2025  
**Target:** Dashboard + Organizer cards + Event detail attendee list  
**Effort:** 3-4 days  
**Complexity:** High (database model, API endpoints, frontend components)  

---

## 📋 Feature Overview

Enable attendees to build networks by connecting with other event-goers and organizers. Features include:

- **User Profiles:** Public-facing profile with avatar, bio, interests, events attended
- **Network Connections:** "Connect" button to add users to your network
- **Network Badge:** Show on attendee lists to identify connections
- **Network Dashboard:** View your connections and their profiles
- **Smart Suggestions:** See who attended same events
- **Event Attendee Browse:** Click on attendees to see their profile

---

## 🎯 User Stories

### US-601: View User Profile
**As a** event attendee  
**I want to** see other attendees' public profiles  
**So that** I can learn about them and decide to connect

**Acceptance Criteria:**
- Profile shows avatar, name, bio, interests, events attended
- Attendee count, organizer status, join date visible
- Badges for organizers, power attendees, etc.
- Works on mobile and desktop

### US-602: Connect with Other Attendees
**As a** event attendee  
**I want to** add people to my network  
**So that** I can stay in touch with event friends

**Acceptance Criteria:**
- "Connect" button on profiles opens connection request
- Connected users see green "Connected" badge
- Pending requests show different state
- Can view list of connections in Dashboard

### US-603: See Network in Event Lists
**As a** event organizer  
**I want to** see which attendees are already in my network  
**So that** I can better engage with familiar faces

**Acceptance Criteria:**
- Attendee list shows network badge (🔗 or special color)
- Only visible in organizer/admin view
- Badge links to profile
- Hover shows connection context

### US-604: Discover New Connections at Events
**As a** event attendee  
**I want to** discover people at the same events  
**So that** I can expand my network naturally

**Acceptance Criteria:**
- Event detail shows "Also Attending" section
- Shows 5-10 random other attendees
- Each has quick preview + "Connect" button
- Works even if you don't RSVP yet

---

## 🎨 UI Design

### User Profile Page

**Route:** `/profile/:userId`

```
┌──────────────────────────────────────┐
│ [Back] [Share Profile] [Message]     │
├──────────────────────────────────────┤
│         [Avatar - Large]              │
│         John Doe                      │
│         ✨ Power Attendee • 🎯 4mo   │
│                                      │
│  [Connect] [View Network]            │
│                                      │
│  Bio: "Love trying new experiences!" │
│                                      │
│  📍 San Francisco, CA                │
│  🎨 Interests: Art, Music, Fitness   │
│  📅 Joined: Aug 2024                 │
│  🎫 Events Attended: 24              │
│                                      │
│  Recent Events (Last 3):             │
│  [Art Night] [Music Fest] [Yoga]    │
│                                      │
│  Network (42 connections)            │
│  [Avatar] [Avatar] [Avatar]          │
│  [Avatar] [Avatar] [View All >]      │
│                                      │
│  Organized Events (0)                │
│  None yet                            │
└──────────────────────────────────────┘
```

### Profile Component Breakdown

- **Header Section:** Avatar, name, badges, action buttons
- **Bio Section:** Bio text, location, interests
- **Stats Section:** Attended count, join date, level badge
- **Network Section:** Show recent 5 connections
- **Recent Events:** Last 3 attended events
- **Organized Events:** If organizer (future)

### Attendee Card (Event Detail)

**Current:** Just name and avatar in list  
**With Network:** Shows badges for connections

```
[Avatar] John Doe  [🔗 Connected]
```

### Organizer Card Enhancement

**Current:** Organizer info on EventDetail  
**Add:** "View Network" link, network size badge

```
John Doe - Organizer
📧 john@example.com
📱 (555) 123-4567
[Connect] [View Network (23)]
```

### Dashboard - Network Tab

**New Tab in Dashboard**

```
My Network (42 connections)

Recent Connections:
[Avatar] Jane Doe [Remove ×]
[Avatar] Bob Smith [Remove ×]
...

Search Connections:
[Search box]

Filter by:
[All] [From Events] [Organizers]
```

---

## 🛠️ Technical Implementation

### Database Models

#### UserNetwork Model

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class UserNetwork(SQLModel, table=True):
    """Represents a connection between two users"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # User who initiated connection
    initiator_id: int = Field(foreign_key="user.id")
    initiator: "User" = Relationship(
        back_populates="network_initiated",
        sa_relationship_kwargs={"foreign_keys": "UserNetwork.initiator_id"}
    )
    
    # User being connected to
    recipient_id: int = Field(foreign_key="user.id")
    recipient: "User" = Relationship(
        back_populates="network_received",
        sa_relationship_kwargs={"foreign_keys": "UserNetwork.recipient_id"}
    )
    
    # Status: 'pending' or 'connected'
    status: str = Field(default='pending')  # pending, connected, blocked
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    
    # Unique constraint: no duplicate connections
    __table_args__ = (UniqueConstraint('initiator_id', 'recipient_id'),)
```

#### User Model Extension

Add to existing User model:

```python
class User(SQLModel, table=True):
    # ... existing fields ...
    
    # Network relationships
    network_initiated: List["UserNetwork"] = Relationship(
        back_populates="initiator"
    )
    network_received: List["UserNetwork"] = Relationship(
        back_populates="recipient"
    )
    
    # New fields
    bio: Optional[str] = Field(default=None, max_length=500)
    interests: Optional[str] = Field(default=None)  # JSON or comma-separated
    location: Optional[str] = Field(default=None)
    
    # Denormalized stats for performance
    network_count: int = Field(default=0)  # Updated on connection
    events_attended_count: int = Field(default=0)
```

### API Endpoints

#### Profiles

- `GET /users/{user_id}` - Get user profile
- `GET /users/{user_id}/network` - Get user's connections (limit 10)
- `GET /users/{user_id}/events` - Get user's attended events (limit 5)

#### Network Management

- `POST /network/connect/{user_id}` - Send connection request
- `DELETE /network/{user_id}` - Remove/reject connection
- `GET /my/network` - Get current user's connections
- `GET /my/network/suggestions` - Get suggested connections (from same events)

### Frontend Components

#### UserProfile.jsx

```javascript
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'
import { useEffect, useState } from 'react'

export default function UserProfile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connections, setConnections] = useState([])

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    const userData = await usersAPI.getProfile(userId)
    setUser(userData)
    
    const conns = await usersAPI.getConnections(userId)
    setConnections(conns)
    
    // Check if current user is connected
    if (currentUser) {
      const status = await usersAPI.getConnectionStatus(currentUser.id, userId)
      setIsConnected(status.connected)
    }
  }

  const handleConnect = async () => {
    await usersAPI.connect(userId)
    setIsConnected(true)
  }

  // Render profile UI
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Profile header */}
      <div className="flex gap-4 mb-6">
        <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full" />
        <div>
          <h1 className="text-3xl font-bold">{user.full_name}</h1>
          <p className="text-gray-600">{user.bio}</p>
          {currentUser?.id !== userId && (
            <button
              onClick={handleConnect}
              className={`mt-2 px-4 py-2 rounded-lg ${
                isConnected
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {isConnected ? '✓ Connected' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Stats and network */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Info */}
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-sm text-gray-600">{user.bio}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {(user.interests || '').split(',').map(interest => (
                <span key={interest} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {interest.trim()}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            📅 Joined {new Date(user.created_at).toLocaleDateString()}
            <br />
            🎫 {user.events_attended_count} events attended
            <br />
            🔗 {user.network_count} connections
          </div>
        </div>

        {/* Right: Network preview */}
        <div>
          <h2 className="font-semibold mb-2">Network ({user.network_count})</h2>
          <div className="space-y-2">
            {connections.slice(0, 5).map(conn => (
              <div key={conn.id} className="flex items-center gap-2">
                <img src={conn.avatar} alt={conn.name} className="w-8 h-8 rounded-full" />
                <span className="text-sm">{conn.full_name}</span>
              </div>
            ))}
            {connections.length > 5 && (
              <a href={`/profile/${userId}/network`} className="text-blue-600 text-sm">
                View all {connections.length} connections →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
        <div className="grid gap-3">
          {/* Event cards */}
        </div>
      </div>
    </div>
  )
}
```

#### ProfileMini.jsx (For quick preview)

Component shown in dropdowns/modals:

```javascript
export default function ProfileMini({ userId, onClose }) {
  const [user, setUser] = useState(null)
  
  // Similar to above but condensed (avatar, name, bio, connect button)
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
      {/* Compact profile preview */}
    </div>
  )
}
```

### Integration Points

1. **Organizer Card (EventDetail)**
   - Add "View Network" link
   - Show network size badge

2. **Attendee List (EventDetail - future)**
   - Click attendee name → view profile
   - Show connection badge

3. **Dashboard**
   - New "Network" tab
   - Show connections + suggestions

4. **Event Page**
   - "Also Attending" section with random 5-10 attendees
   - Quick profile preview on hover
   - Connect button

---

## 🧪 Test Cases

### TC-601: View Own Profile
- **Given:** User logged in, viewing own profile
- **When:** Navigate to /profile/:currentUserId
- **Then:** Profile shows with edit button option

### TC-602: View Other User Profile
- **Given:** User logged in, userId ≠ currentUserId
- **When:** Navigate to /profile/:userId
- **Then:** Profile shows with Connect button (not edit)

### TC-603: Send Connection Request
- **Given:** User A viewing User B's profile
- **When:** Clicks Connect button
- **Then:** Request sent, button changes to "Pending"

### TC-604: Accept Connection Request
- **Given:** User B has pending request from User A
- **When:** User B views User A's profile
- **Then:** Button shows "Accept / Reject" options

### TC-605: Connected Users See Badge
- **Given:** User A and B are connected
- **When:** User A views event attendee list with User B
- **Then:** Green "🔗 Connected" badge appears

### TC-606: Network Count Updates
- **Given:** User A has 5 connections
- **When:** User A connects with User B
- **Then:** Network count becomes 6 (realtime)

### TC-607: Bidirectional Relationships
- **Given:** User A sends connection to User B
- **When:** User B accepts
- **Then:** Both can see each other's profiles with "Connected" badge

### TC-608: Block User (Future)
- **Given:** User A can see profile of User B
- **When:** User A blocks User B
- **Then:** User A doesn't see User B in attendee lists
- **And:** User B can't see User A's profile

### TC-609: Network Suggestions
- **Given:** User A attended "Art Night" with User B
- **When:** Both attended different events
- **Then:** Suggestions show "Met at Art Night" context

### TC-610: Search Network
- **Given:** User A has 50 connections
- **When:** User A searches "John" in network
- **Then:** Shows only Johns in network

---

## 📊 Database Schema

### Migrations

Create `versions/XXX_add_user_network.py`:

```python
def upgrade():
    # Add fields to user table
    op.add_column('user', sa.Column('bio', sa.String(500)))
    op.add_column('user', sa.Column('interests', sa.String(500)))
    op.add_column('user', sa.Column('location', sa.String(255)))
    op.add_column('user', sa.Column('network_count', sa.Integer(), default=0))
    op.add_column('user', sa.Column('events_attended_count', sa.Integer(), default=0))
    
    # Create user_network table
    op.create_table(
        'user_network',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('initiator_id', sa.Integer(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('confirmed_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['initiator_id'], ['user.id']),
        sa.ForeignKeyConstraint(['recipient_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('initiator_id', 'recipient_id')
    )
```

---

## 🔗 Dependencies

- **Backend:** SQLModel, FastAPI, datetime
- **Frontend:** React Router, axios
- **New Components:** UserProfile.jsx, ProfileMini.jsx, NetworkTab.jsx
- **New API Service:** usersAPI object

---

## 📝 Implementation Order

1. Create UserNetwork model + migration
2. Create API endpoints (users, network)
3. Create UserProfile.jsx component
4. Add profile route to App.jsx
5. Integrate profile link to OrganizerCard
6. Add Network tab to Dashboard
7. Add suggestions to EventDetail (future)
8. Test all connection flows

---

## 🚀 Acceptance Criteria (Final)

- ✅ User profile page shows all info (avatar, bio, interests, stats)
- ✅ Connect button sends connection request
- ✅ Connected users see "Connected" badge on profiles
- ✅ Network count updates in real-time
- ✅ Dashboard has Network tab with connections list
- ✅ Can view other attendees' profiles from event
- ✅ Suggestions show people from same events
- ✅ Mobile responsive
- ✅ Dark mode compatible
- ✅ No performance issues with large networks

---

## 🎯 Future Enhancements

- Direct messaging between connected users
- User reviews/recommendations
- Event recommendations based on connections
- Advanced blocking/muting options
- Network statistics and insights
- User levels/badges (power attendees, organizers, etc.)
