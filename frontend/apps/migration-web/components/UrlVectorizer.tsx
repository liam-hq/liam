'use client'

import { type FormEvent, useState } from 'react'
import styles from './UrlVectorizer.module.css'

export type UrlVectorizerProps = {
  endpoint: string
}

export const UrlVectorizer = ({ endpoint }: UrlVectorizerProps) => {
  const [url, setUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL (must start with http:// or https://)')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.statusText}`)
      }

      setSuccess(
        `URL content successfully vectorized and stored. ID: ${data.id}`,
      )
      setUrl('')
    } catch (err) {
      console.error('Error during vectorization:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while processing the URL',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>URL Content Vectorization</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className={styles.input}
            disabled={isLoading}
          />
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Vectorize'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <p className={styles.description}>
          Enter a URL to fetch its content, vectorize it, and store it in the
          database.
        </p>
      </form>
    </div>
  )
}
