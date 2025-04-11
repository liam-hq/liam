'use client'

import { type FC, useState } from 'react'
import { EditableContent } from '../../components/EditableContent'
import type { SuggestionWithProject } from './KnowledgeSuggestionDetailPage'
import styles from './KnowledgeSuggestionDetailPage.module.css'

type Props = {
  suggestion: SuggestionWithProject
  originalContent: string | null
}

export const ContentForDoc: FC<Props> = ({ suggestion, originalContent }) => {
  const [currentContent, setCurrentContent] = useState(suggestion.content)

  const handleContentSaved = (savedContent: string) => {
    setCurrentContent(savedContent)
  }

  return (
    <div className={styles.contentSection}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Content</h2>
      </div>

      <EditableContent
        key={currentContent}
        content={currentContent}
        suggestionId={suggestion.id}
        className={styles.codeContent}
        originalContent={originalContent}
        isApproved={!!suggestion.approvedAt}
        onContentSaved={handleContentSaved}
      />
    </div>
  )
}
