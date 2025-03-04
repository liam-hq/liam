'use client'

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import styles from './KnowledgeRetrievalWindow.module.css'

export type KnowledgeRetrievalWindowProps = {
  endpoint: string
  placeholder: string
}

export const KnowledgeRetrievalWindow = ({
  endpoint,
  placeholder,
}: KnowledgeRetrievalWindowProps) => {
  const [query, setQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [retrievalResult, setRetrievalResult] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    if (resultContainerRef.current) {
      resultContainerRef.current.scrollTop =
        resultContainerRef.current.scrollHeight
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setIsLoading(true)
    setError(null)
    setRetrievalResult('')

    try {
      const response = await fetch(`/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`An error occurred: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('Response body is empty')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        setRetrievalResult((prev) => prev + text)
      }
    } catch (err) {
      console.error('Error during knowledge retrieval:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during knowledge retrieval',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setQuery('')
    setRetrievalResult('')
    setError(null)
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className={styles.retrievalWindow}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleTextareaChange}
            placeholder={placeholder}
            className={styles.queryInput}
            disabled={isLoading}
            rows={5}
          />
        </div>
        <div className={styles.controls}>
          <button
            type="submit"
            className={styles.retrieveButton}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'Retrieving...' : 'Retrieve Knowledge'}
          </button>
          {retrievalResult && (
            <button
              type="button"
              onClick={handleReset}
              className={styles.resetButton}
              disabled={isLoading}
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.resultContainer}>
        {retrievalResult ? (
          <div ref={resultContainerRef} className={styles.retrievalResult}>
            {retrievalResult}
          </div>
        ) : (
          isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>AI is searching for relevant knowledge...</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
