import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { HandThumbUpIcon as HandThumbUpOutline, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolid } from '@heroicons/react/24/solid'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { questionsAPI } from '../../services/api'

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'about', 'will', 'have', 'what', 'when', 'where', 'which', 'does', 'can', 'how', 'are', 'you', 'its', 'any', 'into', 'been', 'they', 'them'])
const GENERIC_TERMS = new Set(['parking', 'dress', 'clothes', 'food', 'meal', 'vegan', 'vegetarian', 'ticket', 'tickets', 'price', 'cost', 'entry', 'time', 'start', 'end', 'schedule', 'agenda', 'location', 'venue', 'address', 'arrival', 'gate', 'accessibility', 'wheelchair', 'refund', 'policy', 'age', 'kids', 'child', 'alcohol', 'drink', 'security', 'recording', 'stream', 'livestream', 'seat', 'seating', 'capacity', 'max', 'register', 'registration'])

const tokenize = (text = '') => {
  const matches = text.toLowerCase().match(/[a-zA-Z]{3,}/g) || []
  return matches.filter((t) => !STOPWORDS.has(t))
}

export default function QASection({ event }) {
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useNotification()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [askOpen, setAskOpen] = useState(false)
  const [askForm, setAskForm] = useState({
    asker_email: user?.email || '',
    asker_name: user?.full_name || '',
    text: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [answerText, setAnswerText] = useState('')

  const isOrganizer = user && (user.id === event?.organizer_id || user.role === 'admin')

  const eventKeywords = useMemo(() => {
    const chunks = [event?.title || '', event?.description || '', event?.category || '', event?.location || '']
    const tokens = new Set()
    chunks.forEach((chunk) => tokenize(chunk).forEach((t) => tokens.add(t)))
    GENERIC_TERMS.forEach((t) => tokens.add(t))
    return tokens
  }, [event?.title, event?.description, event?.category, event?.location])

  useEffect(() => {
    setAskForm((prev) => ({ ...prev, asker_email: user?.email || '', asker_name: user?.full_name || '' }))
  }, [user])

  useEffect(() => {
    if (!event?.id) return
    loadQuestions()
  }, [event?.id])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const data = await questionsAPI.getQuestions(event.id)
      setQuestions(data)
    } catch (error) {
      console.error('Failed to load questions', error)
      showError('Could not load Q&A')
    } finally {
      setLoading(false)
    }
  }

  const validateQuestion = (text) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return 'Please enter your question'
    if (trimmed.length < 8) return 'Please provide a bit more detail in your question'
    if (trimmed.length > 500) return 'Questions must be 500 characters or fewer'
    if (/https?:\/\//i.test(trimmed)) return 'Links are not allowed in questions'
    if (/\b(violence|harm|weapon|bomb|kill)\b/i.test(trimmed)) return 'This content is not allowed'
    const tokens = tokenize(trimmed)
    const overlaps = tokens.some((t) => eventKeywords.has(t))
    if (!overlaps) return 'Please keep questions about this event (timing, location, access, logistics).'
    return null
  }

  const handleAskQuestion = async (e) => {
    e.preventDefault()
    const validationError = validateQuestion(askForm.text)
    if (validationError) {
      showError(validationError)
      return
    }

    if (!askForm.asker_email) {
      showError('Email is required so the organizer can follow up')
      return
    }

    try {
      setSubmitting(true)
      await questionsAPI.askQuestion(event.id, {
        asker_email: askForm.asker_email,
        asker_name: askForm.asker_name,
        text: askForm.text.trim(),
      })
      setAskForm((prev) => ({ ...prev, text: '' }))
      setAskOpen(false)
      showSuccess('Question posted')
      loadQuestions()
    } catch (err) {
      console.error('Failed to post question', err)
      showError(err?.response?.data?.detail || 'Failed to post question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswer = async (questionId) => {
    if (!isOrganizer) {
      showInfo('Only the organizer can reply')
      return
    }
    if (!answerText.trim()) {
      showError('Please add an answer first')
      return
    }
    try {
      await questionsAPI.answerQuestion(event.id, questionId, answerText.trim())
      setAnswerText('')
      setReplyingTo(null)
      showSuccess('Reply posted')
      loadQuestions()
    } catch (err) {
      console.error('Failed to post answer', err)
      showError(err?.response?.data?.detail || 'Failed to post answer')
    }
  }

  const toggleVote = async (answer) => {
    try {
      if (!user) {
        showInfo('Please log in to vote')
        return
      }
      if (answer.has_voted) {
        const res = await questionsAPI.removeVote(event.id, answer.id)
        setQuestions((prev) => prev.map((q) => ({
          ...q,
          answers: q.answers.map((a) => a.id === answer.id ? { ...a, helpful_count: res.helpful_count, has_voted: false } : a)
        })))
      } else {
        const res = await questionsAPI.voteHelpful(event.id, answer.id)
        setQuestions((prev) => prev.map((q) => ({
          ...q,
          answers: q.answers.map((a) => a.id === answer.id ? { ...a, helpful_count: res.helpful_count, has_voted: true } : a)
        })))
      }
    } catch (err) {
      console.error('Vote failed', err)
      showError('Could not update your vote')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-500" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Questions & Answers</h2>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/60 dark:bg-gray-800/70">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setAskOpen(!askOpen)}
            className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {askOpen ? 'Hide question form' : 'Ask the organizer a question'}
          </button>
          <span className="text-xs text-gray-500">Email required • Max 500 chars</span>
        </div>

        {askOpen && (
          <form onSubmit={handleAskQuestion} className="mt-3 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="email"
                value={askForm.asker_email}
                onChange={(e) => setAskForm({ ...askForm, asker_email: e.target.value })}
                placeholder="your@email.com"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              />
              <input
                type="text"
                value={askForm.asker_name}
                onChange={(e) => setAskForm({ ...askForm, asker_name: e.target.value })}
                placeholder="Your name (optional)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              />
            </div>
            <textarea
              value={askForm.text}
              onChange={(e) => setAskForm({ ...askForm, text: e.target.value })}
              maxLength={500}
              rows={3}
              placeholder="What would you like to know about this event?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Context-aware filter blocks off-topic questions</span>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading Q&A...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">No questions yet. Be the first to ask!</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/60 dark:bg-gray-800/60">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">Q: {q.text}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {(q.asker_name || 'Anonymous')} • {q.created_at ? format(new Date(q.created_at), 'MMM d, yyyy') : ''}
                  </p>
                </div>
              </div>

              {q.answers?.length ? (
                <div className="mt-3 space-y-3 border-l-2 border-primary-500 pl-4">
                  {q.answers.map((a) => (
                    <div key={a.id} className="bg-primary-50 dark:bg-gray-900/60 p-3 rounded">
                      <p className="text-gray-900 dark:text-white text-sm">A: {a.text}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>Organizer {a.answerer_name} • {a.created_at ? format(new Date(a.created_at), 'MMM d') : ''}</span>
                        <button
                          type="button"
                          onClick={() => toggleVote(a)}
                          className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600"
                        >
                          {a.has_voted ? <HandThumbUpSolid className="h-4 w-4 text-primary-600" /> : <HandThumbUpOutline className="h-4 w-4" />}
                          <span>{a.helpful_count ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 italic mt-2">
                  No answer yet.
                  {isOrganizer && (
                    <button
                      className="ml-2 text-primary-600 dark:text-primary-400 font-medium"
                      onClick={() => setReplyingTo(q.id)}
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}

              {isOrganizer && replyingTo === q.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                    placeholder="Share a concise answer for attendees"
                  />
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      onClick={() => handleAnswer(q.id)}
                    >
                      Post Reply
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                      onClick={() => { setReplyingTo(null); setAnswerText('') }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
