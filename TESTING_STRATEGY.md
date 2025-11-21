# 🧪 EventiFy Testing Strategy & Implementation Guide

> Comprehensive testing documentation covering Unit Tests, Integration Tests, E2E Tests, and CI/CD Pipelines for EventiFy platform.

---

## 📑 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Stack](#testing-stack)
3. [Backend Testing](#backend-testing)
4. [Frontend Testing](#frontend-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance & Load Testing](#performance--load-testing)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Test Coverage Requirements](#test-coverage-requirements)
9. [Implementation Roadmap](#implementation-roadmap)

---

## 🎯 Testing Overview

### Testing Pyramid Strategy

```
                    /\
                   /  \
                  / E2E \          ← Few, critical user flows
                 /--------\
                /          \
               / Integration \     ← Moderate, API & component integration
              /--------------\
             /                \
            /   Unit Tests     \   ← Many, fast, isolated tests
           /____________________\
```

### Testing Goals

- ✅ **95%+ Code Coverage** for critical backend logic
- ✅ **90%+ Frontend Coverage** for components and utilities
- ✅ **Zero Critical Bugs** in production
- ✅ **< 500ms API Response Time** (P95)
- ✅ **Automated Testing** in CI/CD pipeline
- ✅ **Security Testing** for authentication & authorization

---

## 🛠️ Testing Stack

### Backend Testing
```python
pytest==8.0.0              # Test framework
pytest-cov==4.1.0          # Coverage reporting
pytest-asyncio==0.23.0     # Async test support
httpx==0.27.0              # HTTP client for API tests
faker==24.0.0              # Test data generation
freezegun==1.4.0           # Time mocking
pytest-mock==3.12.0        # Mocking utilities
```

### Frontend Testing
```json
{
  "vitest": "^1.3.0",           // Test runner (Vite-native)
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.1.0",
  "@testing-library/user-event": "^14.5.0",
  "@vitest/coverage-v8": "^1.3.0",
  "msw": "^2.0.0",              // API mocking
  "jsdom": "^24.0.0"            // DOM environment
}
```

### E2E Testing
```json
{
  "@playwright/test": "^1.42.0"
}
```

### Load Testing
```bash
k6 v0.49.0    # Already in use
```

---

## 🐍 Backend Testing

### Directory Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Pytest fixtures & config
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_auth.py           # Auth utilities & hashing
│   │   ├── test_models.py         # Model validation & methods
│   │   ├── test_utils.py          # Utility functions
│   │   └── test_security.py       # Security helpers
│   ├── integration/
│   │   ├── __init__.py
│   │   ├── test_auth_api.py       # Login, register, refresh endpoints
│   │   ├── test_users_api.py      # User CRUD operations
│   │   ├── test_events_api.py     # Event management
│   │   ├── test_rsvp_api.py       # RSVP operations
│   │   ├── test_comments_api.py   # Comment moderation
│   │   └── test_admin_api.py      # Admin dashboard endpoints
│   ├── fixtures/
│   │   ├── users.json             # Test user data
│   │   ├── events.json            # Test event data
│   │   └── images/                # Test image uploads
│   └── helpers/
│       ├── __init__.py
│       ├── auth_helpers.py        # Auth test utilities
│       └── db_helpers.py          # Database helpers
```

### 1. Unit Tests (Backend)

#### **A. Authentication & Security (`test_auth.py`)**

```python
"""
Test password hashing, JWT generation, token validation
"""

def test_hash_password():
    """Password hashing with Argon2"""
    
def test_verify_password():
    """Password verification"""
    
def test_create_access_token():
    """JWT access token generation"""
    
def test_create_refresh_token():
    """JWT refresh token generation"""
    
def test_decode_token_valid():
    """Valid token decoding"""
    
def test_decode_token_expired():
    """Expired token handling"""
    
def test_decode_token_invalid():
    """Invalid token handling"""

def test_csrf_token_generation():
    """CSRF token generation"""
```

#### **B. Models (`test_models.py`)**

```python
"""
Test SQLModel validation, relationships, methods
"""

def test_user_model_creation():
    """User model instantiation with valid data"""
    
def test_user_model_validation():
    """Email validation, password requirements"""
    
def test_event_model_creation():
    """Event model with all fields"""
    
def test_event_model_defaults():
    """Default values for optional fields"""
    
def test_rsvp_model_unique_constraint():
    """One RSVP per user per event"""
    
def test_comment_model_relationships():
    """Comment -> User, Comment -> Event relationships"""
    
def test_user_role_enum():
    """Valid role values (attendee, organizer, admin)"""
```

#### **C. Utilities (`test_utils.py`)**

```python
"""
Test date formatting, file uploads, QR generation
"""

def test_format_datetime():
    """DateTime formatting utility"""
    
def test_validate_image_format():
    """Image file validation (PNG, JPG, WEBP)"""
    
def test_generate_qr_code():
    """QR code generation for RSVPs"""
    
def test_sanitize_filename():
    """File name sanitization for uploads"""
    
def test_calculate_event_duration():
    """Event duration calculation"""
```

---

### 2. Integration Tests (Backend)

#### **A. Authentication API (`test_auth_api.py`)**

```python
"""
Test auth endpoints with test client
"""

def test_register_new_user(client):
    """POST /api/v1/auth/register - success"""
    
def test_register_duplicate_email(client):
    """Register with existing email returns 400"""
    
def test_login_valid_credentials(client):
    """POST /api/v1/auth/login - returns tokens"""
    
def test_login_invalid_credentials(client):
    """Login with wrong password returns 401"""
    
def test_refresh_token(client):
    """POST /api/v1/auth/refresh - new access token"""
    
def test_refresh_token_expired(client):
    """Expired refresh token returns 401"""
    
def test_logout(client):
    """POST /api/v1/auth/logout - success"""
    
def test_csrf_token_endpoint(client):
    """GET /api/v1/auth/csrf-token"""
```

#### **B. Events API (`test_events_api.py`)**

```python
"""
Test event CRUD operations
"""

def test_create_event_authenticated(client, auth_headers):
    """POST /api/v1/events - create event"""
    
def test_create_event_unauthenticated(client):
    """Create event without auth returns 401"""
    
def test_create_event_with_image(client, auth_headers):
    """Event creation with image upload"""
    
def test_get_events_list(client):
    """GET /api/v1/events - paginated list"""
    
def test_get_event_by_id(client):
    """GET /api/v1/events/{id} - event details"""
    
def test_filter_events_by_category(client):
    """Filter events by category query param"""
    
def test_search_events_by_name(client):
    """Search events by name/description"""
    
def test_update_event_as_organizer(client, auth_headers):
    """PUT /api/v1/events/{id} - organizer can edit"""
    
def test_update_event_as_non_organizer(client, auth_headers):
    """Non-organizer cannot edit - returns 403"""
    
def test_delete_event_as_organizer(client, auth_headers):
    """DELETE /api/v1/events/{id} - success"""
    
def test_delete_event_with_rsvps(client, auth_headers):
    """Deleting event with RSVPs cascades properly"""
```

#### **C. RSVP API (`test_rsvp_api.py`)**

```python
"""
Test RSVP operations & QR generation
"""

def test_create_rsvp(client, auth_headers, event_id):
    """POST /api/v1/events/{id}/rsvps"""
    
def test_create_duplicate_rsvp(client, auth_headers, event_id):
    """Duplicate RSVP returns 400"""
    
def test_update_rsvp_status(client, auth_headers):
    """PUT /api/v1/rsvps/{id} - change status"""
    
def test_delete_rsvp(client, auth_headers):
    """DELETE /api/v1/rsvps/{id}"""
    
def test_get_user_rsvps(client, auth_headers):
    """GET /api/v1/rsvps/me - user's RSVPs"""
    
def test_get_event_attendees(client, event_id):
    """GET /api/v1/events/{id}/attendees"""
    
def test_rsvp_qr_code_generation(client, auth_headers):
    """RSVP includes QR code URL"""
    
def test_checkin_with_qr(client, auth_headers):
    """PUT /api/v1/rsvps/{id}/checkin"""
```

#### **D. Comments API (`test_comments_api.py`)**

```python
"""
Test comment CRUD & moderation
"""

def test_create_comment(client, auth_headers, event_id):
    """POST /api/v1/events/{id}/comments"""
    
def test_get_event_comments(client, event_id):
    """GET /api/v1/events/{id}/comments"""
    
def test_update_own_comment(client, auth_headers):
    """PUT /api/v1/comments/{id}"""
    
def test_delete_own_comment(client, auth_headers):
    """DELETE /api/v1/comments/{id}"""
    
def test_organizer_moderate_comment(client, organizer_headers):
    """Organizer can approve/delete comments"""
    
def test_admin_delete_any_comment(client, admin_headers):
    """Admin can delete any comment"""
```

#### **E. Admin API (`test_admin_api.py`)**

```python
"""
Test admin dashboard endpoints
"""

def test_admin_get_all_users(client, admin_headers):
    """GET /api/v1/users - admin only"""
    
def test_non_admin_get_all_users(client, auth_headers):
    """Non-admin returns 403"""
    
def test_admin_delete_user(client, admin_headers):
    """DELETE /api/v1/users/{id}"""
    
def test_admin_delete_event(client, admin_headers):
    """Admin can delete any event"""
    
def test_admin_get_analytics(client, admin_headers):
    """GET /api/v1/admin/analytics"""
```

---

### 3. Pytest Configuration (`conftest.py`)

```python
"""
Shared fixtures for backend tests
"""

import pytest
from sqlmodel import Session, create_engine
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.core.config import settings

# Test database engine (in-memory SQLite)
@pytest.fixture(scope="session")
def engine():
    """Create test database engine"""
    db_url = "sqlite:///./test.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    yield engine
    # Cleanup after tests
    engine.dispose()

@pytest.fixture(scope="function")
def session(engine):
    """Create fresh DB session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(session):
    """FastAPI test client with overridden DB session"""
    def override_get_db():
        yield session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(session):
    """Create test user"""
    from app.models import User
    user = User(
        email="test@example.com",
        hashed_password="hashed_pass",
        full_name="Test User",
        role="attendee"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    """Generate auth headers for test user"""
    from app.core.security import create_access_token
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_event(session, test_user):
    """Create test event"""
    from app.models import Event
    event = Event(
        name="Test Event",
        description="Test Description",
        organizer_id=test_user.id,
        start_time="2025-12-01T18:00:00",
        end_time="2025-12-01T21:00:00",
        location="Test Location",
        category="Technology"
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event
```

---

### 4. Running Backend Tests

```bash
# Install test dependencies
cd backend
pip install pytest pytest-cov pytest-asyncio httpx faker freezegun pytest-mock

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/integration/test_auth_api.py

# Run specific test
pytest tests/unit/test_auth.py::test_hash_password -v

# Run with markers
pytest -m "unit"              # Only unit tests
pytest -m "integration"       # Only integration tests
pytest -m "slow"              # Only slow tests

# Parallel execution
pytest -n auto                # Requires pytest-xdist
```

---

## ⚛️ Frontend Testing

### Directory Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── dateUtils.test.js
│   │   │   ├── validators.test.js
│   │   │   └── authHelpers.test.js
│   │   └── hooks/
│   │       ├── useAuth.test.jsx
│   │       └── useEvents.test.jsx
│   ├── integration/
│   │   ├── components/
│   │   │   ├── EventCard.test.jsx
│   │   │   ├── EventForm.test.jsx
│   │   │   ├── RSVPButton.test.jsx
│   │   │   └── CommentSection.test.jsx
│   │   └── pages/
│   │       ├── HomePage.test.jsx
│   │       ├── EventDetailsPage.test.jsx
│   │       ├── CreateEventPage.test.jsx
│   │       └── ProfilePage.test.jsx
│   ├── mocks/
│   │   ├── handlers.js           # MSW API handlers
│   │   ├── mockData.js           # Test data
│   │   └── setup.js              # Test setup
│   └── setupTests.js
├── components/
├── pages/
└── utils/
```

### 1. Unit Tests (Frontend)

#### **A. Utility Functions (`dateUtils.test.js`)**

```javascript
/**
 * Test date formatting and manipulation utilities
 */

describe('dateUtils', () => {
  test('formatEventDate formats ISO date correctly', () => {});
  
  test('isEventUpcoming returns true for future events', () => {});
  
  test('isEventPast returns true for past events', () => {});
  
  test('getEventDuration calculates duration in hours', () => {});
  
  test('formatRelativeTime shows "2 days ago"', () => {});
});
```

#### **B. Validators (`validators.test.js`)**

```javascript
/**
 * Test form validation utilities
 */

describe('validators', () => {
  test('validateEmail accepts valid email', () => {});
  
  test('validateEmail rejects invalid email', () => {});
  
  test('validatePassword checks minimum length', () => {});
  
  test('validateEventDate rejects past dates', () => {});
  
  test('validateImageFile accepts valid formats', () => {});
  
  test('validateImageFile rejects oversized files', () => {});
});
```

#### **C. Custom Hooks (`useAuth.test.jsx`)**

```javascript
/**
 * Test useAuth hook
 */

describe('useAuth', () => {
  test('returns user when authenticated', () => {});
  
  test('login updates user state', async () => {});
  
  test('logout clears user state', async () => {});
  
  test('refreshes token automatically', async () => {});
  
  test('handles login error', async () => {});
});
```

---

### 2. Integration Tests (Frontend)

#### **A. Components (`EventCard.test.jsx`)**

```javascript
/**
 * Test EventCard component rendering and interactions
 */

describe('EventCard', () => {
  test('renders event name and date', () => {});
  
  test('displays RSVP status badge', () => {});
  
  test('shows event image or placeholder', () => {});
  
  test('navigates to event details on click', async () => {});
  
  test('renders organizer name', () => {});
  
  test('shows attendee count', () => {});
});
```

#### **B. Forms (`EventForm.test.jsx`)**

```javascript
/**
 * Test EventForm validation and submission
 */

describe('EventForm', () => {
  test('renders all form fields', () => {});
  
  test('validates required fields', async () => {});
  
  test('submits form with valid data', async () => {});
  
  test('displays error messages', async () => {});
  
  test('handles image upload preview', async () => {});
  
  test('pre-fills form for edit mode', () => {});
  
  test('disables submit during API call', async () => {});
});
```

#### **C. Interactive Components (`RSVPButton.test.jsx`)**

```javascript
/**
 * Test RSVP button states and actions
 */

describe('RSVPButton', () => {
  test('shows "RSVP" for non-authenticated users', () => {});
  
  test('shows status dropdown when authenticated', () => {});
  
  test('updates RSVP status on click', async () => {});
  
  test('displays loading state during API call', () => {});
  
  test('shows error toast on failure', async () => {});
  
  test('disables button for past events', () => {});
});
```

#### **D. Pages (`HomePage.test.jsx`)**

```javascript
/**
 * Test HomePage rendering and filtering
 */

describe('HomePage', () => {
  test('renders hero section', () => {});
  
  test('fetches and displays events', async () => {});
  
  test('filters events by category', async () => {});
  
  test('searches events by name', async () => {});
  
  test('shows loading skeleton', () => {});
  
  test('displays empty state when no events', () => {});
  
  test('handles API error gracefully', async () => {});
});
```

---

### 3. Vitest Configuration (`vitest.config.js`)

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.config.js',
        '**/mockData.js'
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 4. MSW Setup (`mocks/handlers.js`)

```javascript
/**
 * Mock Service Worker handlers for API mocking
 */

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: { id: 1, email: 'test@example.com' }
    });
  }),
  
  // Events endpoints
  http.get('/api/v1/events', () => {
    return HttpResponse.json({
      events: [/* mock events */],
      total: 10
    });
  }),
  
  http.get('/api/v1/events/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Mock Event'
    });
  }),
  
  // Add more handlers...
];
```

### 5. Running Frontend Tests

```bash
# Install dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitest/coverage-v8 msw jsdom

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Update package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

---

## 🎭 End-to-End Testing

### Playwright Configuration

```
e2e/
├── playwright.config.ts
├── tests/
│   ├── auth.spec.ts              # Login, registration flow
│   ├── events.spec.ts            # Event creation, editing
│   ├── rsvp.spec.ts              # RSVP workflow
│   ├── comments.spec.ts          # Comment system
│   ├── admin.spec.ts             # Admin dashboard
│   └── mobile.spec.ts            # Mobile responsiveness
├── fixtures/
│   └── test-data.ts
└── utils/
    └── helpers.ts
```

### Critical E2E Test Cases

#### **1. User Journey - Attendee (`tests/events.spec.ts`)**

```typescript
/**
 * Complete attendee user flow
 */

test.describe('Attendee Event Flow', () => {
  test('should register, browse events, RSVP, and receive QR code', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    
    // 2. Register new account
    await page.click('text=Sign Up');
    await page.fill('[name="email"]', 'attendee@test.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // 3. Browse events
    await expect(page).toHaveURL('/events');
    await expect(page.locator('.event-card')).toHaveCount(10);
    
    // 4. Filter by category
    await page.selectOption('[name="category"]', 'Technology');
    await expect(page.locator('.event-card')).toHaveCount(3);
    
    // 5. Click event to view details
    await page.click('.event-card >> nth=0');
    await expect(page).toHaveURL(/\/events\/\d+/);
    
    // 6. RSVP to event
    await page.click('text=RSVP');
    await page.click('text=Going');
    await expect(page.locator('.rsvp-success')).toBeVisible();
    
    // 7. View QR code
    await page.click('text=View QR Code');
    await expect(page.locator('.qr-code-image')).toBeVisible();
    
    // 8. Navigate to profile
    await page.click('text=Profile');
    await expect(page.locator('.my-rsvps')).toContainText('Technology Event');
  });
});
```

#### **2. Organizer Workflow (`tests/organizer.spec.ts`)**

```typescript
/**
 * Event creation and management
 */

test.describe('Organizer Flow', () => {
  test('should create, edit, and manage event', async ({ page }) => {
    // Login as organizer
    await loginAsOrganizer(page);
    
    // Create new event
    await page.click('text=Create Event');
    await page.fill('[name="name"]', 'Tech Meetup 2025');
    await page.fill('[name="description"]', 'Networking event');
    await page.fill('[name="location"]', '123 Main St');
    await page.setInputFiles('[name="image"]', 'tests/fixtures/event.jpg');
    await page.click('button:has-text("Publish")');
    
    // Verify event appears in organizer's events
    await page.goto('/profile/events');
    await expect(page.locator('.event-card')).toContainText('Tech Meetup 2025');
    
    // Edit event
    await page.click('.event-card >> text=Edit');
    await page.fill('[name="name"]', 'Tech Meetup 2025 - Updated');
    await page.click('button:has-text("Save")');
    
    // View attendees
    await page.click('text=View Attendees');
    await expect(page.locator('.attendee-list')).toBeVisible();
    
    // Delete event
    await page.click('text=Delete Event');
    await page.click('text=Confirm');
    await expect(page).not.toContainText('Tech Meetup 2025');
  });
});
```

#### **3. Admin Dashboard (`tests/admin.spec.ts`)**

```typescript
test.describe('Admin Operations', () => {
  test('should manage users and moderate content', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Access admin dashboard
    await page.goto('/admin');
    await expect(page.locator('.admin-stats')).toBeVisible();
    
    // View all users
    await page.click('text=Users');
    await expect(page.locator('.user-table')).toBeVisible();
    
    // Ban user
    await page.click('.user-row >> nth=0 >> text=Ban');
    await expect(page.locator('.toast')).toContainText('User banned');
    
    // Moderate comments
    await page.goto('/admin/comments');
    await page.click('.comment-pending >> nth=0 >> text=Approve');
  });
});
```

#### **4. Mobile Responsiveness (`tests/mobile.spec.ts`)**

```typescript
test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE
  
  test('should work on mobile devices', async ({ page }) => {
    await page.goto('/');
    
    // Hamburger menu
    await page.click('.mobile-menu-button');
    await expect(page.locator('.mobile-nav')).toBeVisible();
    
    // Event cards stack vertically
    const eventCards = page.locator('.event-card');
    await expect(eventCards.first()).toBeInViewport();
    
    // Form inputs are touch-friendly
    await page.click('text=Create Event');
    const nameInput = page.locator('[name="name"]');
    await expect(nameInput).toHaveCSS('min-height', '44px'); // Touch target size
  });
});
```

### Playwright Config (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Running E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/auth.spec.ts

# Debug mode
npx playwright test --debug

# Run in headed mode
npx playwright test --headed

# Generate test report
npx playwright show-report
```

---

## ⚡ Performance & Load Testing

### Existing K6 Tests (Enhance)

#### **1. Events Load Test (`tests/load-events.js`)**

```javascript
/**
 * Enhancements needed:
 * - Test pagination performance
 * - Test filtering with different query params
 * - Test concurrent event creation
 * - Measure database query times
 */

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Spike test
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failures
  },
};
```

#### **2. RSVP Load Test (`tests/load-rsvp.js`)**

```javascript
/**
 * Stress test RSVP creation under high load
 * - Simulate event with 1000+ simultaneous RSVPs
 * - Test unique constraint enforcement
 * - Test QR code generation performance
 */

export const options = {
  scenarios: {
    rsvp_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '30s', target: 50 },   // Rush hour
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
};
```

#### **3. Authentication Load Test (`tests/load-login.js`)**

```javascript
/**
 * Already implemented - ensure thresholds pass:
 * - P95 < 300ms (after Argon2 tuning)
 * - Fail rate < 1%
 */
```

#### **4. Database Performance Tests**

```python
# backend/tests/performance/test_db_queries.py

def test_event_list_query_performance(session, benchmark):
    """Events list should complete in <100ms"""
    result = benchmark(lambda: session.exec(select(Event)).all())
    assert benchmark.stats.mean < 0.1  # 100ms

def test_rsvp_creation_with_qr(session, benchmark):
    """RSVP + QR generation under 200ms"""
    # Benchmark RSVP creation flow
    
def test_comment_pagination_performance(session, benchmark):
    """Comment pagination should be fast"""
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Test & Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ============== Backend Tests ==============
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: eventify_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run unit tests
        run: |
          cd backend
          pytest tests/unit -v --cov=app --cov-report=xml
      
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/eventify_test
        run: |
          cd backend
          pytest tests/integration -v --cov=app --cov-append --cov-report=xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          flags: backend
  
  # ============== Frontend Tests ==============
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
          flags: frontend
  
  # ============== E2E Tests ==============
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && pip install -r requirements.txt
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start backend
        run: |
          cd backend
          uvicorn app.main:app --host 127.0.0.1 --port 8001 &
          sleep 5
      
      - name: Start frontend
        run: |
          npm run dev &
          sleep 10
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
  
  # ============== Load Tests ==============
  load-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run load tests
        run: |
          # Start app in background
          make dev &
          sleep 30
          
          # Run k6 tests
          make load-events
          make load-rsvp
          make load-login
      
      - name: Upload load test results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-reports
          path: reports/
  
  # ============== Security Scan ==============
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Python dependency check
        run: |
          pip install safety
          cd backend
          safety check --json
      
      - name: npm audit
        run: npm audit --audit-level=high
  
  # ============== Deploy (Production) ==============
  deploy:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests, e2e-tests, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          # Add your deployment script
          echo "Deploying to production..."
```

---

## 📊 Test Coverage Requirements

### Coverage Thresholds

| Component | Target | Critical Paths |
|-----------|--------|----------------|
| **Backend (Overall)** | 95% | Auth, RSVP, Events CRUD |
| **Backend Models** | 100% | User, Event, RSVP models |
| **Backend API** | 90% | All endpoints |
| **Frontend (Overall)** | 90% | Components, utils, hooks |
| **Frontend Components** | 85% | EventCard, EventForm, RSVPButton |
| **Frontend Utils** | 95% | Validators, date utils, API client |
| **E2E Critical Flows** | 100% | Registration → RSVP → QR code |

### Coverage Reports

```bash
# Backend - Generate HTML coverage report
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Frontend - Generate coverage report
npm run test:coverage
open coverage/index.html

# View uncovered lines
pytest --cov=app --cov-report=term-missing
```

---

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up pytest for backend
- [ ] Configure Vitest for frontend
- [ ] Create test fixtures and helpers
- [ ] Write conftest.py with shared fixtures
- [ ] Set up MSW for API mocking
- [ ] Implement 20 critical backend unit tests
- [ ] Implement 15 critical frontend unit tests

### Phase 2: API Coverage (Weeks 3-4)
- [ ] Write integration tests for all auth endpoints
- [ ] Write integration tests for events API
- [ ] Write integration tests for RSVP endpoints
- [ ] Write integration tests for comments API
- [ ] Write integration tests for admin endpoints
- [ ] Achieve 80%+ backend coverage

### Phase 3: Frontend Coverage (Weeks 5-6)
- [ ] Test all React components
- [ ] Test custom hooks (useAuth, useEvents)
- [ ] Test utility functions
- [ ] Test page components
- [ ] Achieve 85%+ frontend coverage

### Phase 4: E2E Tests (Weeks 7-8)
- [ ] Install and configure Playwright
- [ ] Write attendee user flow tests
- [ ] Write organizer workflow tests
- [ ] Write admin dashboard tests
- [ ] Test mobile responsiveness
- [ ] Test cross-browser compatibility

### Phase 5: CI/CD Integration (Week 9)
- [ ] Create GitHub Actions workflow
- [ ] Set up test job for backend
- [ ] Set up test job for frontend
- [ ] Set up E2E test job
- [ ] Configure code coverage reporting (Codecov)
- [ ] Add security scanning (Trivy, Safety)

### Phase 6: Performance & Monitoring (Week 10)
- [ ] Enhance existing k6 load tests
- [ ] Add database performance benchmarks
- [ ] Set up performance monitoring in CI
- [ ] Create performance regression alerts
- [ ] Document performance thresholds

### Phase 7: Maintenance & Refinement
- [ ] Set up pre-commit hooks for running tests
- [ ] Create test writing guidelines
- [ ] Document flaky test handling
- [ ] Set up test result dashboard
- [ ] Regular review and refactoring

---

## 🔧 Additional Tools & Best Practices

### Pre-commit Hooks (`.pre-commit-config.yaml`)

```yaml
repos:
  - repo: local
    hooks:
      - id: pytest-unit
        name: pytest unit tests
        entry: bash -c 'cd backend && pytest tests/unit -q'
        language: system
        pass_filenames: false
        always_run: true
      
      - id: frontend-tests
        name: vitest unit tests
        entry: npm run test -- --run --reporter=verbose
        language: system
        pass_filenames: false
        types: [javascript, jsx, tsx]
```

### Test Data Management

- Use **factories** (factory_boy for Python, faker for JS)
- Keep test data **small and focused**
- **Clean up** after each test (use fixtures/afterEach)
- Use **realistic but anonymized** data

### Flaky Test Handling

- Retry flaky tests max 2 times
- Add explicit waits in E2E tests
- Mock time-dependent functionality
- Log failures for investigation

### Documentation

- Document **why** tests exist, not just what they do
- Keep README in test directories
- Update docs when test strategy changes

---

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

---

## ✅ Success Metrics

- ✅ **95%+ code coverage** on backend
- ✅ **90%+ code coverage** on frontend
- ✅ **Zero critical bugs** in production
- ✅ **All CI tests pass** before merge
- ✅ **P95 API response time < 500ms**
- ✅ **Load tests pass** at 100 concurrent users
- ✅ **E2E tests pass** on Chrome, Firefox, Safari
- ✅ **Security scans** show no high/critical vulnerabilities

---

**Last Updated:** November 21, 2025  
**Maintained by:** EventiFy Development Team
