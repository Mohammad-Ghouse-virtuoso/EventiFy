import { useMemo } from 'react'
import Flatpickr from 'react-flatpickr'
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

  const options = useMemo(() => ({
    enableTime: true,
    time_24hr: true,
    dateFormat: "Z", // internal format (we'll use JS Date in onChange anyway)
    altInput: true,
    altFormat: "Y-m-d H:i",
    minuteIncrement: 5,
    minDate: minDate || undefined,
    maxDate: maxDate || undefined,
  }), [minDate, maxDate])

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
    // Convert to ISO string in local timezone format (YYYY-MM-DDTHH:mm:ss)
    // This avoids the timezone conversion issue that toISOString() causes
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    const localISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    onChange(localISO)
  }

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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
