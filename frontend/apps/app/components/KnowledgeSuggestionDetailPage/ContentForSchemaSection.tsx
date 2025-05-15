'use client'

import { updateKnowledgeSuggestionContent } from '@/features/projects/actions/updateKnowledgeSuggestionContent'
import type { Schema, TableGroup } from '@liam-hq/db-structure'
import { type FC, useState } from 'react'
import { EditableContent } from './EditableContent'
import { ErdViewer } from './ErdViewer'
import styles from './KnowledgeSuggestionDetailPage.module.css'
import { processOverrideContent } from './actions/processOverrideContent'

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
  suggestionId: string
  originalContent: string | null
  isApproved: boolean
  schema: Schema | undefined
  content: string | null
  errors: ErrorObject[]
  tableGroups: Record<string, TableGroup>
}

export const ContentForSchemaSection: FC<Props> = ({
  suggestionContent,
  suggestionId,
  originalContent,
  isApproved,
  schema,
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
    if (schema) {
      const { result } = await processOverrideContent(savedContent, schema)
      setProcessedResult(result)
    }
  }

  const handleTableGroupAdded = async (newTableGroup: TableGroup) => {
    try {
      // Parse current content as JSON
      const contentObj = JSON.parse(currentContent)

      // Add the new table group to the content

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!contentObj.overrides.tableGroups) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        contentObj.overrides.tableGroups = {}
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
      if (schema) {
        const { result } = await processOverrideContent(updatedContent, schema)
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

      {content !== null && schema && (
        <ErdViewer
          key={JSON.stringify(
            processedResult?.tableGroups || initialTableGroups,
          )}
          schema={schema}
          tableGroups={processedResult?.tableGroups || initialTableGroups || {}}
          errorObjects={errors || []}
          defaultSidebarOpen={false}
          onAddTableGroup={handleTableGroupAdded}
        />
      )}
    </div>
  )
}
