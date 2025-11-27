/**
 * Mock data for frontend tests
 */

export const mockUser = {
  id: 1,
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'attendee',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockOrganizer = {
  id: 2,
  email: 'organizer@example.com',
  full_name: 'Test Organizer',
  role: 'organizer',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockAdmin = {
  id: 3,
  email: 'admin@example.com',
  full_name: 'Test Admin',
  role: 'admin',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
};

export const mockEvent = {
  id: 1,
  title: 'Test Event',
  description: 'This is a test event',
  category: 'Technology',
  event_start: '2025-12-01T18:00:00Z',
  event_end: '2025-12-01T21:00:00Z',
  location: 'Test Location, 123 Test St',
  max_attendees: 100,
  price: 0.0,
  organizer_id: 2,
  organizer_name: 'Test Organizer',
  organizer_role: 'organizer',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  attendees_count: 25,
};

export const mockPastEvent = {
  id: 2,
  title: 'Past Event',
  description: 'This event already happened',
  category: 'Social',
  event_start: '2025-01-01T18:00:00Z',
  event_end: '2025-01-01T21:00:00Z',
  location: 'Old Location',
  max_attendees: 50,
  price: 10.0,
  organizer_id: 2,
  organizer_name: 'Test Organizer',
  organizer_role: 'organizer',
  is_active: true,
  created_at: '2024-12-01T00:00:00Z',
  attendees_count: 45,
};

export const mockEvents = [mockEvent, mockPastEvent];

export const mockRSVP = {
  id: 1,
  user_id: 1,
  event_id: 1,
  status: 'going',
  checked_in: false,
  created_at: '2025-01-15T00:00:00Z',
};

export const mockLoginResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user: mockUser,
};

export const mockRegisterResponse = {
  ...mockUser,
  message: 'User registered successfully',
};
