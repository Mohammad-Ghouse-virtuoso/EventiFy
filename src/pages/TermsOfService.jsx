import { Link } from 'react-router-dom'

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-700 mb-8">TL;DR: Be nice. Have fun. Don’t be a party pooper. Full terms coming soon.</p>
      <Link to="/" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
        Back to Home
      </Link>
    </div>
  )
}
