'use client'

import { processOverrideContent } from '@/features/projects/actions/processOverrideContent'
import { updateKnowledgeSuggestionContent } from '@/features/projects/actions/updateKnowledgeSuggestionContent'
import { EditableContent } from '@/features/projects/components/EditableContent'
import type { DBStructure, TableGroup } from '@liam-hq/db-structure'
import type { SupportedFormat } from '@liam-hq/db-structure/parser'
import { type FC, useState } from 'react'
import { ErdViewer } from './ErdViewer'
import styles from './KnowledgeSuggestionDetailPage.module.css'

type ErrorObject = {
  name: string
  message: string
  instruction?: string
}

type ProcessedResult = {
  tableGroups: Record<string, TableGroup>
}

type Props = {
  suggestionContent: string
  suggestionId: number
  originalContent: string | null
  isApproved: boolean
  dbStructure: DBStructure | undefined
  format: SupportedFormat | undefined
  content: string | null
  errors: ErrorObject[]
  tableGroups: Record<string, TableGroup>
}

export const ContentForSchemaSection: FC<Props> = ({
  suggestionContent,
  suggestionId,
  originalContent,
  isApproved,
  dbStructure,
  format,
  content,
  errors,
  tableGroups: initialTableGroups,
}) => {
  const [currentContent, setCurrentContent] = useState(suggestionContent)
  const [processedResult, setProcessedResult] =
    useState<ProcessedResult | null>(null)

  const handleContentSaved = async (savedContent: string) => {
    setCurrentContent(savedContent)

    // Update ErdViewer data with the saved content using server action
    if (dbStructure) {
      const { result } = await processOverrideContent(savedContent, dbStructure)
      setProcessedResult(result)
    }
  }

  const handleTableGroupAdded = async (newTableGroup: TableGroup) => {
    try {
      // Parse current content as JSON
      const contentObj = JSON.parse(currentContent)

      // Add the new table group to the content
      if (!contentObj.overrides.tableGroups) {
        contentObj.overrides.tableGroups = {}
      }

      contentObj.overrides.tableGroups[newTableGroup.name] = newTableGroup

      // Update the content
      const updatedContent = JSON.stringify(contentObj, null, 2)
      setCurrentContent(updatedContent)

      // Create FormData for server action
      const formData = new FormData()
      formData.append('suggestionId', suggestionId.toString())
      formData.append('content', updatedContent)

      // Save content to the database using server action
      await updateKnowledgeSuggestionContent(formData)

      // Update ErdViewer data
      if (dbStructure) {
        const { result } = await processOverrideContent(
          updatedContent,
          dbStructure,
        )
        setProcessedResult(result)
      }
    } catch (error) {
      console.error('Failed to update content with new table group:', error)
    }
  }

  return (
    <div className={styles.columns}>
      <div className={styles.contentSection}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>Content</h2>
        </div>

        <EditableContent
          key={currentContent}
          content={currentContent}
          suggestionId={suggestionId}
          className={styles.codeContent}
          originalContent={originalContent}
          isApproved={isApproved}
          onContentSaved={handleContentSaved}
        />
      </div>

      {content !== null && format !== undefined && dbStructure && (
        <ErdViewer
          key={JSON.stringify(
            processedResult?.tableGroups || initialTableGroups,
          )}
          dbStructure={dbStructure}
          tableGroups={processedResult?.tableGroups || initialTableGroups || {}}
          errorObjects={errors || []}
          defaultSidebarOpen={false}
          onAddTableGroup={handleTableGroupAdded}
        />
      )}
    </div>
  )
}
