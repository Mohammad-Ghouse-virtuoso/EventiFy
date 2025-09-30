import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-700 mb-8">We guard your data like it’s the last slice of pizza. This page will host the full policy.</p>
      <Link to="/" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
        Back to Home
      </Link>
    </div>
  )
}
