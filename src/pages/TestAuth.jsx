import { useState } from 'react'
import { authAPI, eventsAPI } from '../services/api'

export default function TestAuth() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const addResult = (message, success = true) => {
    setResults(prev => [...prev, { message, success, timestamp: new Date().toLocaleTimeString() }])
  }

  const testLogin = async () => {
    try {
      setLoading(true)
      addResult('Testing login with admin@eventify.com...')
      
      const response = await authAPI.login('admin@eventify.com', 'admin123')
      addResult(`Login successful! Token: ${response.access_token?.substring(0, 20)}...`, true)
      addResult(`User: ${response.user?.full_name} (${response.user?.role})`, true)
      
      // Store token for subsequent tests
      localStorage.setItem('token', response.access_token)
      
    } catch (error) {
      addResult(`Login failed: ${error.response?.data?.detail || error.message}`, false)
    } finally {
      setLoading(false)
    }
  }

  const testEvents = async () => {
    try {
      setLoading(true)
      addResult('Testing events API...')
      
      const events = await eventsAPI.getAll()
      addResult(`Events loaded successfully! Count: ${events.length}`, true)
      
      if (events.length > 0) {
        addResult(`First event: ${events[0].title}`, true)
      }
      
    } catch (error) {
      addResult(`Events failed: ${error.response?.data?.detail || error.message}`, false)
    } finally {
      setLoading(false)
    }
  }

  const testRegister = async () => {
    try {
      setLoading(true)
      addResult('Testing registration...')
      
      const testUser = {
        full_name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'testpass123',
        role: 'attendee'
      }
      
      const response = await authAPI.register(testUser)
      addResult(`Registration successful! User: ${response.user?.full_name}`, true)
      
    } catch (error) {
      addResult(`Registration failed: ${error.response?.data?.detail || error.message}`, false)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Login (Admin)
          </button>
          <button
            onClick={testEvents}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Events API
          </button>
          <button
            onClick={testRegister}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Test Registration
          </button>
          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
        
        {loading && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Testing...
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a test button above.</p>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                <span className="text-xs text-gray-500 mr-2">{result.timestamp}</span>
                {result.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Test Accounts:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li><strong>Admin:</strong> admin@eventify.com / admin123</li>
          <li><strong>Organizer:</strong> organizer@eventify.com / organizer123</li>
          <li><strong>Attendee:</strong> john@example.com / attendee123</li>
        </ul>
      </div>
    </div>
  )
}
