'use client'

import type { Tables } from '@liam-hq/db/supabase/database.types'
import { clsx } from 'clsx'
import type React from 'react'
import { useState } from 'react'
import { CopyButton } from '../../../../components/CopyButton/CopyButton'
import { formatReviewIssue } from '../../utils/formatReviewIssue'
import { ResolveButton } from '../ResolveButton/ResolveButton'
import styles from './ReviewIssuesList.module.css'

type ReviewIssue = Tables<'ReviewIssue'> & {
  suggestionSnippets: Array<{
    id: number
    filename: string
    snippet: string
  }>
}

interface ReviewIssuesListProps {
  issues: ReviewIssue[]
  containerClassName?: string
}

export const ReviewIssuesList: React.FC<ReviewIssuesListProps> = ({
  issues: initialIssues,
  containerClassName,
}) => {
  const [issues, setIssues] = useState<ReviewIssue[]>(initialIssues)

  const handleResolve = (issueId: number, comment: string) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              resolvedAt: new Date().toISOString(),
              resolutionComment: comment,
            }
          : issue,
      ),
    )
  }

  const sortedIssues = [...issues].sort((a, b) => {
    // First sort by resolved status (unresolved first)
    if (a.resolvedAt && !b.resolvedAt) return 1
    if (!a.resolvedAt && b.resolvedAt) return -1

    // Then sort by severity
    const severityOrder = {
      CRITICAL: 0,
      WARNING: 1,
      POSITIVE: 2,
    }
    return (
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder]
    )
  })

  return (
    <div className={clsx(styles.reviewIssues, containerClassName)}>
      {sortedIssues.length > 0 ? (
        sortedIssues.map((issue) => (
          <div
            key={issue.id}
            className={clsx(
              styles.reviewIssue,
              styles[`severity${issue.severity}`],
              issue.resolvedAt && styles.resolved,
            )}
          >
            <div className={styles.issueHeader}>
              <span className={styles.issueCategory}>{issue.category}</span>
              <div className={styles.issueActions}>
                <span className={styles.issueSeverity}>{issue.severity}</span>
                <CopyButton
                  text={formatReviewIssue({
                    category: issue.category,
                    severity: issue.severity,
                    description: issue.description,
                    suggestion: issue.suggestion,
                    snippets: issue.suggestionSnippets.map(
                      (snippet: { filename: string; snippet: string }) => ({
                        filename: snippet.filename,
                        snippet: snippet.snippet,
                      }),
                    ),
                  })}
                  className={styles.issueCopyButton}
                />
                <ResolveButton
                  issueId={issue.id}
                  isResolved={!!issue.resolvedAt}
                  resolutionComment={issue.resolutionComment}
                  onResolve={(comment) => handleResolve(issue.id, comment)}
                />
              </div>
            </div>
            <p className={styles.issueDescription}>{issue.description}</p>
            {issue.suggestion && (
              <div className={styles.issueSuggestion}>
                <h4 className={styles.suggestionTitle}>💡 Suggestion:</h4>
                <p>{issue.suggestion}</p>
              </div>
            )}
            {issue.suggestionSnippets.map(
              (snippet: { filename: string; snippet: string; id: number }) => (
                <div key={snippet.filename} className={styles.snippetContainer}>
                  <div className={styles.snippetHeader}>
                    <span className={styles.fileIcon}>📄</span>
                    <span className={styles.fileName}>{snippet.filename}</span>
                  </div>
                  <div className={styles.codeContainer}>
                    <pre className={styles.codeSnippet}>{snippet.snippet}</pre>
                  </div>
                </div>
              ),
            )}
            {issue.resolvedAt && (
              <div className={styles.resolvedInfo}>
                <span className={styles.resolvedIcon}>✓</span>
                <span className={styles.resolvedText}>
                  Resolved on{' '}
                  {new Date(issue.resolvedAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    hour12: false,
                  })}
                </span>
                {issue.resolutionComment && (
                  <div className={styles.resolutionComment}>
                    <p className={styles.resolutionCommentTitle}>
                      Resolution Comment:
                    </p>
                    <p className={styles.resolutionCommentText}>
                      {issue.resolutionComment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className={styles.noIssues}>No review issues found.</p>
      )}
    </div>
  )
}
