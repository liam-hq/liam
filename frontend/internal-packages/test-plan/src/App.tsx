import { useEffect, useState } from 'react'
import { MarkdownContent } from './components/MarkdownContent'

export const App = () => {
  const [reportContent, setReportContent] = useState<string>('')
  const [error, setError] = useState<string>('')

  const loadReport = async () => {
    setError('')
    try {
      // Direct access to public/frontend-test-balance-report.md
      const response = await fetch('./frontend-test-balance-report.md')
      if (!response.ok) {
        throw new Error(`Report file not found: ${response.statusText}`)
      }
      const content = await response.text()
      setReportContent(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    }
  }

  // Initial load
  useEffect(() => {
    loadReport()
  }, [])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {reportContent && <MarkdownContent content={reportContent} />}
    </div>
  )
}
