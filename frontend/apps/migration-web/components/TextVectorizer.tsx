'use client'

import { type FormEvent, useState } from 'react'
import styles from './TextVectorizer.module.css'

export type TextVectorizerProps = {
  endpoint: string
}

export const TextVectorizer = ({ endpoint }: TextVectorizerProps) => {
  const [text, setText] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      setError('Please enter some text')
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
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.statusText}`)
      }

      setSuccess(
        `Text content successfully vectorized and stored. ID: ${data.id}`,
      )
      setText('')
    } catch (err) {
      console.error('Error during vectorization:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while processing the text',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Text Content Vectorization</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text here..."
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
          Enter text to vectorize and store it in the database.
        </p>
      </form>
    </div>
  )
}
