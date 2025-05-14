'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function YamlEditorPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createSchema = async () => {
      try {
        // Create a new schema in the database
        const response = await fetch('/api/schemas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to create schema: ${response.statusText}`)
        }

        const data = await response.json()
        
        // Redirect to the schema page
        if (data.id) {
          // Use router.push for client-side navigation
          router.push(`/app/yaml-editor/schema/${data.id}`)
        } else {
          setError('No schema ID returned from the server')
          setIsRedirecting(false)
        }
      } catch (error) {
        console.error('Error creating schema:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setIsRedirecting(false)
      }
    }

    createSchema()
  }, [router])

  if (isRedirecting) {
    return (
      <div className={styles.yamlEditorPageInContent} data-theme={theme}>
        <div className={styles.yamlEditorContainer}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4">Creating new schema...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if there was a problem
  if (error) {
    return (
      <div className={styles.yamlEditorPageInContent} data-theme={theme}>
        <div className={styles.yamlEditorContainer}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">Error</div>
              <p>{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback to the original editor if redirection fails
  return (
    <div className={styles.yamlEditorPageInContent} data-theme={theme}>
      <div className={styles.yamlEditorContainer}>
      </div>
    </div>
  )
}
