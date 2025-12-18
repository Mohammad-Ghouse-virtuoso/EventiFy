import { useMemo, useState, useEffect } from 'react'
import Flatpickr from 'react-flatpickr'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'
import 'flatpickr/dist/themes/material_blue.css'

// Props:
// - label: string
// - value: ISO string | '' | null
// - onChange: (isoStringOrNull: string | null) => void
// - required?: boolean
// - placeholder?: string
// - minDate?: Date | string | null
// - maxDate?: Date | string | null
// - disabled?: boolean
// - error?: string
export default function DateTimeField({
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  minDate = null,
  maxDate = null,
  disabled = false,
  error,
  useDialTimePicker = true,
}) {
  const dateValue = useMemo(() => {
    if (!value || value === '') return undefined
    try {
      // Support both ISO strings and anything Date can parse
      const d = new Date(value)
      return isNaN(d.getTime()) ? undefined : d
    } catch {
      return undefined
    }
  }, [value])

  const initialTime = useMemo(() => {
    if (!dateValue) return '09:00'
    const h = String(dateValue.getHours()).padStart(2, '0')
    const m = String(dateValue.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }, [dateValue])

  const [dialTime, setDialTime] = useState(initialTime)
  const [showDial, setShowDial] = useState(false)

  // Keep dial time in sync when incoming value changes (e.g., editing existing event)
  useEffect(() => {
    setDialTime(initialTime)
  }, [initialTime])

  const options = useMemo(() => ({
    enableTime: !useDialTimePicker,
    time_24hr: true,
    dateFormat: useDialTimePicker ? "Y-m-d" : "Z",
    altInput: true,
    altFormat: useDialTimePicker ? "Y-m-d" : "Y-m-d H:i",
    minuteIncrement: 5,
    minDate: minDate || undefined,
    maxDate: maxDate || undefined,
  }), [minDate, maxDate, useDialTimePicker])

  const toLocalISO = (dateObj, timeStr) => {
    const [h = '00', m = '00'] = (timeStr || '00:00').split(':')
    const d = new Date(dateObj)
    d.setHours(Number(h), Number(m), 0, 0)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  const handleChange = (selectedDates) => {
    if (!selectedDates || selectedDates.length === 0) {
      onChange(null)
      return
    }
    const d = selectedDates[0]
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      onChange(null)
      return
    }

    if (!useDialTimePicker) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      const localISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      onChange(localISO)
      setDialTime(`${hours}:${minutes}`)
      return
    }

    // For dial mode, keep the picked date and merge with dialTime
    const iso = toLocalISO(d, dialTime)
    onChange(iso)
  }

  const handleDialChange = (newTime) => {
    const formatted = typeof newTime === 'string' ? newTime : newTime?.formatted24 || newTime?.formatted || ''
    if (!formatted) return
    setDialTime(formatted)
    if (!dateValue) return

    const baseDate = dateValue
    onChange(toLocalISO(baseDate, formatted))
  }

  const readableTime = useMemo(() => {
    const [hStr = '00', mStr = '00'] = (dialTime || '00:00').split(':')
    const h = Number(hStr)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 === 0 ? 12 : h % 12
    return `${displayHour}:${mStr} ${period}`
  }, [dialTime])

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <Flatpickr
        value={dateValue}
        options={options}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
      />
      {useDialTimePicker && (
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-8.44l2.47 2.47a.75.75 0 01-1.06 1.06l-2.75-2.75A.75.75 0 019.25 10V6a.75.75 0 011.5 0v3.56z" clipRule="evenodd" />
            </svg>
            {readableTime}
          </span>
          <button
            type="button"
            onClick={() => setShowDial(true)}
            className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Choose time
          </button>
        </div>
      )}

      {useDialTimePicker && showDial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-4 w-full max-w-md relative">
            <TimePicker
              onChange={(val) => handleDialChange(typeof val === 'string' ? val : '')}
              value={dialTime}
              disableClock={false}
              clockIcon={null}
              clearIcon={null}
              format="HH:mm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowDial(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                onClick={() => setShowDial(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
