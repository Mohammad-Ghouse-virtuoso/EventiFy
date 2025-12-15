import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

export default function QASection({ eventId }) {
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useNotification()
  const [questions, setQuestions] = useState([
    {
      id: 1,
      user_name: 'Sarah',
      question: 'When does parking open?',
      answer: 'Free parking opens at 6 PM. Street parking available near the venue.',
      answered: true
    },
    {
      id: 2,
      user_name: 'John',
      question: 'Is vegetarian food available?',
      answer: null,
      answered: false
    },
    {
      id: 3,
      user_name: 'Maria',
      question: 'What is the dress code?',
      answer: 'Smart casual. No formal attire required.',
      answered: true
    }
  ])

  const [newQuestion, setNewQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAskQuestion = async (e) => {
    e.preventDefault()

    if (!user) {
      showInfo('Please log in to ask questions')
      return
    }

    if (!newQuestion.trim()) {
      showError('Please enter your question')
      return
    }

    try {
      setIsSubmitting(true)
      // TODO: Call API to save question
      // const response = await fetch(`/api/v1/events/${eventId}/questions`, ...)

      const question = {
        id: questions.length + 1,
        user_name: user.full_name,
        question: newQuestion,
        answer: null,
        answered: false
      }

      setQuestions([question, ...questions])
      setNewQuestion('')
      showSuccess('Question posted!')
    } catch (err) {
      showError('Failed to post question')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Questions & Answers
      </h2>

      {/* Ask Question Form */}
      {user && (
        <form onSubmit={handleAskQuestion} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ask the organizer a question
            </label>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="What would you like to know about this event?"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition font-medium"
          >
            {isSubmitting ? 'Posting...' : 'Post Question'}
          </button>
        </form>
      )}

      {!user && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            <a href="/login" className="font-semibold hover:underline">
              Log in
            </a>
            {' '}to ask questions about this event
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {q.question}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Asked by {q.user_name}
                  </p>
                </div>

                {q.answered && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                    Answered
                  </span>
                )}
              </div>

              {q.answered && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-primary-500">
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
                    ORGANIZER REPLY
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {q.answer}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {questions.length >= 3 && (
        <button className="w-full py-3 text-center text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 rounded-lg transition font-medium">
          Load More Questions
        </button>
      )}
    </div>
  )
}
