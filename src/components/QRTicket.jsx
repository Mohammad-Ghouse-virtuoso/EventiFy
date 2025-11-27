import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { checkinAPI } from '../services/api'

/**
 * QRTicket Component
 * 
 * Displays a QR code ticket for an attendee's RSVP.
 * The QR code contains a signed JWT token that can be scanned for check-in.
 * 
 * Props:
 * - eventId: The event ID
 * - rsvpId: The RSVP ID
 * - eventTitle: Display title of the event
 * - attendeeName: Name of the attendee
 * - onError: Callback for errors
 */
export default function QRTicket({ 
  eventId, 
  rsvpId, 
  eventTitle = 'Event',
  attendeeName = 'Attendee',
  onError 
}) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [tokenData, setTokenData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const fetchAndGenerateQR = async () => {
      if (!eventId || !rsvpId) {
        setError('Missing event or RSVP information')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch QR token from backend
        const data = await checkinAPI.getQRToken(eventId, rsvpId)
        setTokenData(data)

        // Generate QR code from token
        const qrUrl = await QRCode.toDataURL(data.qr_token, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        })
        
        setQrDataUrl(qrUrl)
      } catch (err) {
        const message = err.response?.data?.detail || err.message || 'Failed to generate QR code'
        setError(message)
        onError?.(message)
      } finally {
        setLoading(false)
      }
    }

    fetchAndGenerateQR()
  }, [eventId, rsvpId, onError])

  const downloadQR = () => {
    if (!qrDataUrl) return
    
    const link = document.createElement('a')
    link.download = `eventify-ticket-${eventId}-${rsvpId}.png`
    link.href = qrDataUrl
    link.click()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Generating your ticket...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-4 text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-sm mx-auto">
      {/* Ticket Header */}
      <div className="w-full text-center mb-4 pb-4 border-b border-dashed border-gray-300 dark:border-gray-600">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
          {tokenData?.event_title || eventTitle}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {tokenData?.attendee_name || attendeeName}
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-lg shadow-inner">
        {qrDataUrl && (
          <img 
            src={qrDataUrl} 
            alt="Event Ticket QR Code"
            className="w-64 h-64"
          />
        )}
      </div>

      {/* Ticket Footer */}
      <div className="w-full mt-4 pt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mb-3">
          Show this QR code at the event entrance
        </p>
        
        <button
          onClick={downloadQR}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Ticket
        </button>
      </div>

      {/* Expiry Info */}
      {tokenData?.expires_at && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Valid until: {new Date(tokenData.expires_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
