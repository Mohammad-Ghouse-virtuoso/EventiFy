import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NotificationContainer from './components/NotificationContainer'
import Home from './pages/Home'
import Events from './pages/Events'
import CreateEvent from './pages/CreateEvent'
import EditEvent from './pages/EditEvent'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import EventAnalytics from './pages/EventAnalytics'
import TestAuth from './pages/TestAuth'
import './styles/modern.css'
import HelpCenter from './pages/HelpCenter'
import ContactUs from './pages/ContactUs'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'

// Simple role-based route guard
function RequireRole({ allowed, children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  const role = user?.role
  if (!user || !allowed.includes(role)) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route
              path="/create-event"
              element={
                <RequireRole allowed={["organizer", "admin"]}>
                  <CreateEvent />
                </RequireRole>
              }
            />
            <Route
              path="/events/:id/edit"
              element={
                <RequireRole allowed={["organizer", "admin"]}>
                  <EditEvent />
                </RequireRole>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/admin"
              element={
                <RequireRole allowed={["admin"]}>
                  <AdminPanel />
                </RequireRole>
              }
            />
            <Route
              path="/event-analytics"
              element={
                <RequireRole allowed={["organizer", "admin"]}>
                  <EventAnalytics />
                </RequireRole>
              }
            />
            <Route path="/test-auth" element={<TestAuth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Support pages */}
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Routes>
        </main>
        {/* Hide footer on register page */}
        <ConditionalFooter />
        <NotificationContainer />
      </div>
    </Router>
  )
}

export default App

// Helper component to conditionally render Footer based on route
function ConditionalFooter() {
  const location = useLocation()
  const hideFooter = location.pathname.startsWith('/register') || location.pathname.startsWith('/login')
  if (hideFooter) return null
  return <Footer />
}