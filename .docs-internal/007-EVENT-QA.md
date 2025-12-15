# F-007: Event Q&A Section with Organizer Replies

**Status:** SPECIFICATION  
**Session:** Dec 15, 2025  
**Target:** EventDetail page (integrated with existing QASection component)  
**Effort:** 2-3 days  
**Complexity:** Medium (API endpoints, real-time updates)  

---

## 📋 Feature Overview

Allow event attendees to ask questions before/during events and receive answers from organizers. Q&A section appears on EventDetail page with:

- **Ask Questions:** Form to submit question about event
- **Browse Q&A:** See all questions with answers
- **Organizer Replies:** Organizers can answer questions directly
- **Helpful Votes:** Upvote helpful answers
- **Real-time Updates:** New answers appear without refresh

Currently has UI stub with mock data. Need to implement:
- Backend database model
- API endpoints (CRUD)
- Frontend API integration
- Real-time updates

---

## 🎯 User Stories

### US-701: Ask Event Questions
**As a** potential or confirmed attendee  
**I want to** ask organizers questions about the event  
**So that** I can get details before deciding to attend

**Acceptance Criteria:**
- Question form visible on EventDetail
- Can ask without being logged in (but email required for tracking)
- Questions appear immediately after submission
- Form validates empty submissions
- Success message shown after posting

### US-702: Organizer Replies to Questions
**As a** event organizer  
**I want to** answer attendee questions  
**So that** I can help them prepare and resolve concerns

**Acceptance Criteria:**
- Organizer sees Q&A section with [Reply] button
- Reply form appears below question
- Organizer name auto-filled
- Reply marked as "Organizer" for visibility
- Can edit/delete own replies

### US-703: Browse Event Q&A
**As a** an attendee  
**I want to** see questions and answers about the event  
**So that** I get useful info without asking again

**Acceptance Criteria:**
- Q&A section shows all questions with answers
- Sorted by newest/most helpful
- Shows question date, asker name (optional)
- Shows answer date, "Organizer" badge
- Replies grouped under question

### US-704: Mark Helpful Answers
**As a** an attendee  
**I want to** upvote helpful answers  
**So that** most useful info appears first

**Acceptance Criteria:**
- Thumbs up icon on each answer
- Shows count of helpful votes
- Can remove vote
- Sorted by helpfulness (optional)

---

## 🎨 UI Design

### EventDetail Q&A Section

**Location:** On EventDetail page (already stubbed with mock data)

```
┌─────────────────────────────────────────┐
│ Questions & Answers                     │
├─────────────────────────────────────────┤
│ [Ask a Question]                        │
├─────────────────────────────────────────┤
│                                         │
│ Q: What's the dress code?               │
│ John Doe • Dec 12                       │
│                                         │
│   A: Smart casual, no jeans required   │
│   🏷 Organizer Sarah • Dec 12          │
│   👍 5 helpful                         │
│                                         │
│ Q: Is parking available?                │
│ Jane Smith • Dec 10                     │
│                                         │
│   A: Yes, free parking in lot B        │
│   🏷 Organizer Sarah • Dec 10          │
│   👍 8 helpful                         │
│                                         │
│ Q: Can I bring a guest?                 │
│ Mike Johnson • Dec 8                    │
│                                         │
│   (No answer yet)                       │
│   [Reply] (if organizer)               │
│                                         │
└─────────────────────────────────────────┘
```

### Question Card

**Structure:**

```
Q: [Question Text]
[Asker Name] • [Date]

  A: [Answer Text]
  🏷 Organizer [Organizer Name] • [Date]
  👍 [Vote Count] [Edit] [Delete] (if owner)
  
  [Add Another Reply] (if organizer)
```

### Ask Question Form (Collapsible)

**When Collapsed:**
```
┌─────────────────────────────────────────┐
│ ✏️ Ask a Question                   [▼] │
└─────────────────────────────────────────┘
```

**When Expanded:**
```
┌─────────────────────────────────────────┐
│ ✏️ Ask a Question                   [▲] │
├─────────────────────────────────────────┤
│ [Email field: your@email.com] *         │
│                                         │
│ [Question text area]                    │
│ What's the dress code for this event?  │
│ Max 500 characters                      │
│                                         │
│ [Submit] [Cancel]                       │
└─────────────────────────────────────────┘
```

### Mobile Responsive

- Stack questions vertically
- Answers indented with left border
- Form takes full width
- Vote button text changes to icon only (👍 only)

---

## 🛠️ Technical Implementation

### Database Models

#### EventQuestion Model

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class EventQuestion(SQLModel, table=True):
    """Questions asked about an event"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationship to event
    event_id: int = Field(foreign_key="event.id")
    event: "Event" = Relationship(back_populates="questions")
    
    # Question info
    text: str = Field(max_length=500)
    asker_email: str  # To track but not show full email
    asker_name: Optional[str] = Field(default=None, max_length=100)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Relationship to answers
    answers: List["EventAnswer"] = Relationship(
        back_populates="question",
        cascade_delete=True
    )
    
    def answer_count(self) -> int:
        return len(self.answers)
```

#### EventAnswer Model

```python
class EventAnswer(SQLModel, table=True):
    """Answers to event questions, typically by organizer"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationship to question
    question_id: int = Field(foreign_key="event_question.id")
    question: EventQuestion = Relationship(back_populates="answers")
    
    # Answer info
    text: str = Field(max_length=1000)
    
    # Answerer info (usually organizer)
    user_id: int = Field(foreign_key="user.id")
    answerer: "User" = Relationship()
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Vote tracking
    helpful_count: int = Field(default=0)  # Denormalized for performance
    
    # Relationship to votes
    votes: List["AnswerHelpfulVote"] = Relationship(
        back_populates="answer",
        cascade_delete=True
    )
```

#### AnswerHelpfulVote Model

```python
class AnswerHelpfulVote(SQLModel, table=True):
    """Tracks which users found answers helpful"""
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    answer_id: int = Field(foreign_key="event_answer.id")
    answer: EventAnswer = Relationship(back_populates="votes")
    
    user_id: int = Field(foreign_key="user.id")
    user: "User" = Relationship()
    
    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Unique: one vote per user per answer
    __table_args__ = (UniqueConstraint('user_id', 'answer_id'),)
```

#### Event Model Extension

Add to existing Event model:

```python
class Event(SQLModel, table=True):
    # ... existing fields ...
    
    # Relationship to questions
    questions: List["EventQuestion"] = Relationship(
        back_populates="event",
        cascade_delete=True
    )
```

### API Endpoints

#### Questions (Event-specific)

- `GET /events/{event_id}/questions` - Get all questions for event (sorted by newest/helpful)
- `POST /events/{event_id}/questions` - Create new question (no auth required)
- `PUT /events/{event_id}/questions/{question_id}` - Update question (own questions only)
- `DELETE /events/{event_id}/questions/{question_id}` - Delete question (own or organizer)

#### Answers

- `POST /events/{event_id}/questions/{question_id}/answers` - Add answer (organizer only)
- `PUT /events/{event_id}/questions/{question_id}/answers/{answer_id}` - Update answer (author only)
- `DELETE /events/{event_id}/questions/{question_id}/answers/{answer_id}` - Delete answer (author only)

#### Votes

- `POST /answers/{answer_id}/vote` - Mark as helpful (auth required)
- `DELETE /answers/{answer_id}/vote` - Remove helpful vote (auth required)

### Frontend API Service

Add to `/src/services/api.js`:

```javascript
export const questionsAPI = {
  // Get questions for event
  getQuestions: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/questions`)
    return response.data
  },

  // Post question
  askQuestion: async (eventId, email, name, text) => {
    const response = await apiClient.post(`/events/${eventId}/questions`, {
      asker_email: email,
      asker_name: name,
      text
    })
    return response.data
  },

  // Post answer (organizer only)
  answerQuestion: async (eventId, questionId, text) => {
    const response = await apiClient.post(
      `/events/${eventId}/questions/${questionId}/answers`,
      { text }
    )
    return response.data
  },

  // Vote as helpful
  voteHelpful: async (answerId) => {
    const response = await apiClient.post(`/answers/${answerId}/vote`)
    return response.data
  },

  // Remove helpful vote
  removeVote: async (answerId) => {
    const response = await apiClient.delete(`/answers/${answerId}/vote`)
    return response.data
  }
}
```

### Frontend Component Updates

#### QASection.jsx (Update existing)

**Current:** Mock data with hardcoded questions  
**Update:** Use real API calls

```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { questionsAPI } from '../../services/api'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { format } from 'date-fns'

export default function QASection({ event }) {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAskForm, setShowAskForm] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.full_name || '',
    text: ''
  })

  useEffect(() => {
    loadQuestions()
  }, [event.id])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await questionsAPI.getQuestions(event.id)
      setQuestions(data)
    } catch (error) {
      console.error('Failed to load questions:', error)
      showError('Failed to load Q&A')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!formData.text.trim()) {
      showError('Please enter a question')
      return
    }

    try {
      await questionsAPI.askQuestion(
        event.id,
        formData.email,
        formData.name,
        formData.text
      )
      setFormData({ ...formData, text: '' })
      setShowAskForm(false)
      showSuccess('Question posted!')
      loadQuestions()
    } catch (error) {
      console.error('Failed to post question:', error)
      showError('Failed to post question')
    }
  }

  const handleVoteHelpful = async (answerId, hasVoted) => {
    try {
      if (hasVoted) {
        await questionsAPI.removeVote(answerId)
      } else {
        await questionsAPI.voteHelpful(answerId)
      }
      loadQuestions()
    } catch (error) {
      console.error('Failed to vote:', error)
      showError('Failed to vote')
    }
  }

  const handleAddAnswer = async (questionId) => {
    // Only organizer can answer
    if (user?.id !== event.created_by) {
      showError('Only organizer can answer questions')
      return
    }
    
    // Show answer form (implement separately)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Questions & Answers
      </h2>

      {/* Ask Question Button/Form */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {!showAskForm ? (
          <button
            onClick={() => setShowAskForm(true)}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            ✏️ Ask a Question
          </button>
        ) : (
          <form onSubmit={handleSubmitQuestion} className="space-y-3">
            <input
              type="email"
              placeholder="Your email (required)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <textarea
              placeholder="What would you like to know about this event?"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAskForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Post Question
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading Q&A...</div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="mb-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Q: {question.text}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {question.asker_name || 'Anonymous'} • {format(new Date(question.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Answers */}
              {question.answers && question.answers.length > 0 ? (
                <div className="ml-4 space-y-3 border-l-2 border-blue-500 pl-4">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="bg-blue-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-gray-900 dark:text-white text-sm">
                        A: {answer.text}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          🏷 Organizer {answer.answerer.full_name} • {format(new Date(answer.created_at), 'MMM d')}
                        </span>
                        <button
                          onClick={() => handleVoteHelpful(answer.id, false)} // TODO: track voted
                          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 text-sm"
                        >
                          👍 {answer.helpful_count}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 italic ml-4">
                  No answer yet
                  {user?.id === event.created_by && (
                    <button className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                      [Reply]
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          No questions yet. Be the first to ask!
        </div>
      )}
    </div>
  )
}
```

---

## 🧪 Test Cases

### TC-701: Ask Question Without Login
- **Given:** Visitor on EventDetail (not logged in)
- **When:** Clicks "Ask a Question"
- **Then:** Form appears with email, name, text fields
- **And:** Can submit without account

### TC-702: Question Appears Immediately
- **Given:** Question submitted
- **When:** Form closes
- **Then:** New question appears at top of Q&A list
- **And:** Success toast shown

### TC-703: Only Organizer Can Reply
- **Given:** Non-organizer user views question
- **When:** User sees question
- **Then:** No reply option visible

- **Given:** Organizer user views question
- **When:** User sees question
- **Then:** [Reply] button visible

### TC-704: Organizer Reply Marked
- **Given:** Organizer posts answer
- **When:** Answer appears
- **Then:** Shows "🏷 Organizer [Name]" badge

### TC-705: Vote Helpful
- **Given:** User viewing answer
- **When:** Clicks thumbs up
- **Then:** Count increases by 1
- **And:** Icon fills in (solid)

### TC-706: Remove Helpful Vote
- **Given:** User already voted
- **When:** Clicks thumbs up again
- **Then:** Count decreases by 1
- **And:** Icon becomes outline

### TC-707: Unique Vote Per User
- **Given:** User A voted on answer
- **When:** User A tries to vote again
- **Then:** Vote is removed (toggle behavior)
- **And:** No duplicate votes possible

### TC-708: Multiple Answers Per Question
- **Given:** Question with 2 answers
- **When:** Viewing question
- **Then:** Both answers shown under question
- **And:** Each has separate vote count

### TC-709: Character Limit
- **Given:** Question form open
- **When:** User types 501+ characters
- **Then:** Textarea rejects input
- **And:** Character count shown

### TC-710: Empty Question Validation
- **Given:** Question form with empty text
- **When:** User clicks Submit
- **Then:** Error message shown
- **And:** Form stays open

### TC-711: Real-time Updates
- **Given:** Two users viewing same event
- **When:** User A posts question
- **Then:** User B's Q&A list updates without refresh (optional - WebSocket future)

---

## 📊 Database Schema

### Migrations

Create `versions/XXX_add_qa_section.py`:

```python
def upgrade():
    # Create event_question table
    op.create_table(
        'event_question',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(500), nullable=False),
        sa.Column('asker_email', sa.String(255), nullable=False),
        sa.Column('asker_name', sa.String(100)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['event_id'], ['event.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create event_answer table
    op.create_table(
        'event_answer',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(1000), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('helpful_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime()),
        sa.ForeignKeyConstraint(['question_id'], ['event_question.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create answer_helpful_vote table
    op.create_table(
        'answer_helpful_vote',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('answer_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['answer_id'], ['event_answer.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'answer_id')
    )
```

---

## 🔗 Dependencies

- **Backend:** SQLModel, FastAPI, SQLite
- **Frontend:** React, axios, date-fns
- **New Components:** (Update existing QASection.jsx)
- **New API Service:** questionsAPI object

---

## 📝 Implementation Order

1. Create EventQuestion, EventAnswer, AnswerHelpfulVote models
2. Create database migration
3. Create API endpoints (GET, POST, DELETE)
4. Update QASection.jsx with real API calls
5. Test question submission
6. Test answer submission (organizer only)
7. Test helpful voting
8. Test real-time updates (if WebSocket added)

---

## 🚀 Acceptance Criteria (Final)

- ✅ Anyone can ask question (email required)
- ✅ Questions appear immediately after submission
- ✅ Only organizer can answer questions
- ✅ Answers marked with "Organizer" badge
- ✅ Helpful votes tracked per user (unique)
- ✅ Vote count updates in real-time
- ✅ Multiple answers per question supported
- ✅ Character limits enforced (500 Q, 1000 A)
- ✅ Mobile responsive
- ✅ Dark mode compatible
- ✅ Form validation (empty check)
- ✅ Error handling for API failures

---

## 🎯 Future Enhancements

- Real-time updates via WebSocket
- Email notifications to asker when answered
- Pin important questions
- Sort by newest/most helpful
- Edit questions/answers
- Delete questions/answers
- Follow-up questions (threaded)
- Spam detection
