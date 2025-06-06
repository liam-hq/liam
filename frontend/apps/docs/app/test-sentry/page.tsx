'use client'

import { useState } from 'react'

export default function TestSentryPage() {
  const [error, setError] = useState<string | null>(null)

  const triggerClientError = () => {
    throw new Error('Test client-side error for Sentry')
  }

  const triggerServerError = async () => {
    try {
      const response = await fetch('/api/test-sentry-error')
      if (!response.ok) {
        setError('Server error triggered')
      }
    } catch (_err) {
      setError('Failed to trigger server error')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      <div className="space-y-4">
        <button
          type="button"
          onClick={triggerClientError}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Trigger Client Error
        </button>
        <button
          type="button"
          onClick={triggerServerError}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Trigger Server Error
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  )
}
