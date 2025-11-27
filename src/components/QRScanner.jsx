import { useState, useEffect, useRef } from 'react'
import { checkinAPI } from '../services/api'

/**
 * QRScanner Component
 * 
 * Camera-based QR code scanner for event check-in.
 * Uses the device camera to scan attendee QR codes.
 * 
 * Props:
 * - eventId: The event ID to check in for
 * - onCheckin: Callback when check-in succeeds (receives attendee info)
 * - onError: Callback for errors
 */
export default function QRScanner({ eventId, onCheckin, onError }) {
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scanIntervalRef = useRef(null)

  // Dynamic import of jsQR (only when needed)
  const [jsQR, setJsQR] = useState(null)

  useEffect(() => {
    // Dynamically load jsQR
    import('jsqr').then(module => {
      setJsQR(() => module.default)
    }).catch(err => {
      console.error('Failed to load jsQR:', err)
      setCameraError('QR scanner library failed to load')
    })

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    if (!jsQR) {
      setCameraError('QR scanner not ready')
      return
    }

    try {
      setCameraError(null)
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setScanning(true)

      // Start scanning loop
      scanIntervalRef.current = setInterval(() => {
        scanFrame()
      }, 200) // Scan every 200ms

    } catch (err) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera access to scan QR codes.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.')
      } else {
        setCameraError('Failed to access camera: ' + err.message)
      }
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setScanning(false)
  }

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !jsQR || processing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    })

    if (code && code.data) {
      handleQRCode(code.data)
    }
  }

  const handleQRCode = async (qrData) => {
    // Prevent duplicate scans
    if (processing || qrData === lastResult?.qrData) return

    setProcessing(true)
    setLastResult({ qrData, status: 'processing' })

    try {
      const result = await checkinAPI.checkinAttendee(eventId, qrData)
      
      setLastResult({
        qrData,
        status: 'success',
        message: result.message,
        attendee: {
          name: result.attendee_name,
          email: result.attendee_email,
          checkedInAt: result.checked_in_at
        }
      })

      onCheckin?.(result)

      // Play success sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWoYO7aw7NCxdDwTT5ja8M+pgVoNMFHT7PjhxpN0OgoSOXbM7Pbx27KTek0RCiVKhLHZ7urq6tXHq44+EQQXNl+OqcDMz9bb49i2gkgdCgMYQWeKp7nFzNTb39K0iE4fCgQTP2GGprq/x8/U19C1j00eCQQVOFqDprS9wsvP0tK4j0gbCQQVOVyEprS9wsvP0tK4j0gbCQQVOVyEprS9wsvP0tO4j0gc')
        audio.volume = 0.3
        audio.play()
      } catch {}

    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Check-in failed'
      
      setLastResult({
        qrData,
        status: 'error',
        message
      })

      onError?.(message)
    } finally {
      setProcessing(false)
      
      // Clear result after 3 seconds to allow next scan
      setTimeout(() => {
        setLastResult(null)
      }, 3000)
    }
  }

  // Manual token input (fallback)
  const [manualToken, setManualToken] = useState('')
  
  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualToken.trim()) {
      handleQRCode(manualToken.trim())
      setManualToken('')
    }
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg mx-auto">
      {/* Header */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🎫 Event Check-in Scanner
      </h3>

      {/* Camera View */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
        {scanning ? (
          <>
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-purple-500 rounded-lg animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500"></div>
              </div>
            </div>
            {processing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>Camera not active</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Error */}
      {cameraError && (
        <div className="w-full p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{cameraError}</p>
        </div>
      )}

      {/* Last Result */}
      {lastResult && (
        <div className={`w-full p-4 mb-4 rounded-lg ${
          lastResult.status === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : lastResult.status === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          {lastResult.status === 'success' && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">{lastResult.message}</p>
                <p className="text-sm text-green-600 dark:text-green-400">{lastResult.attendee?.email}</p>
              </div>
            </div>
          )}
          {lastResult.status === 'error' && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">{lastResult.message}</p>
              </div>
            </div>
          )}
          {lastResult.status === 'processing' && (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              <p className="text-yellow-800 dark:text-yellow-200">Processing...</p>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="w-full flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={!jsQR}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop Scanning
          </button>
        )}
      </div>

      {/* Manual Entry Fallback */}
      <div className="w-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Or enter token manually:</p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste QR token..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!manualToken.trim() || processing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            Check In
          </button>
        </form>
      </div>
    </div>
  )
}
