import { Button, RemoveButton } from '@liam-hq/ui'
import clsx from 'clsx'
import { type ChangeEvent, type FC, useRef, useState } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { AttachmentsContainer } from '../AttachmentsContainer'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea'
import { useFileAttachments } from '../hooks/useFileAttachments'
import { useFileDragAndDrop } from '../hooks/useFileDragAndDrop'
import { SchemaInfoSection, type SchemaStatus } from '../SchemaInfoSection'
import { SessionFormActions } from '../SessionFormActions'
import {
  fetchSchemaFromUrl,
  getFileNameFromUrl,
  getFormatFromUrl,
  isValidSchemaUrl,
} from '../utils/urlValidation'
import styles from './URLSessionFormPresenter.module.css'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

export const URLSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const [urlPath, setUrlPath] = useState('')
  const [textContent, setTextContent] = useState('')
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')
  const [schemaContent, setSchemaContent] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('postgres')
  const [detectedFormat, setDetectedFormat] = useState<FormatType>('postgres')
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [schemaErrorDetails, setSchemaErrorDetails] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // File attachments hook
  const {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  } = useFileAttachments()

  // File drag and drop for attachments
  const {
    dragActive: attachmentDragActive,
    handleDrag: handleAttachmentDrag,
    handleDrop: handleAttachmentDrop,
  } = useFileDragAndDrop(handleFileSelect)

  // Use auto-resize hook for textarea
  const { handleChange } = useAutoResizeTextarea(textareaRef, textContent)

  const handleTextareaChange = handleChange(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextContent(e.target.value)
    },
  )

  const hasContent =
    schemaContent !== null ||
    textContent.trim().length > 0 ||
    attachments.length > 0

  // Reset form to initial state
  const handleResetForm = () => {
    setUrlPath('')
    setTextContent('')
    setSchemaStatus('idle')
    setSchemaContent(null)
    setSelectedFormat('postgres')
    setDetectedFormat('postgres')
    setSchemaError(null)
    setSchemaErrorDetails([])
    // Reset file attachments through the hook
    clearAttachments()
  }

  // Helper function for URL validation
  const validateUrl = (url: string): { isValid: boolean; error?: string } => {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      return { isValid: false, error: 'Please enter a URL' }
    }

    if (!isValidSchemaUrl(trimmedUrl)) {
      return {
        isValid: false,
        error:
          'Invalid URL. Please provide a valid URL pointing to a schema file (.sql, .rb, .prisma, or .json).',
      }
    }

    return { isValid: true }
  }

  // Helper function for fetching schema
  const performSchemaFetch = async (url: string) => {
    const result = await fetchSchemaFromUrl(url)

    if (result.success && result.content) {
      const format = getFormatFromUrl(url)
      return {
        success: true as const,
        content: result.content,
        format,
      }
    }

    return {
      success: false as const,
      error: result.error || 'Failed to fetch schema',
    }
  }

  // Helper function for handling errors and updating state
  const handleSchemaError = (error: string) => {
    setSchemaStatus('invalid')
    setSchemaError(error)
    setSchemaErrorDetails([])
  }

  const handleFetchSchema = async () => {
    // Validate URL
    const validation = validateUrl(urlPath)
    if (!validation.isValid) {
      if (validation.error) {
        handleSchemaError(validation.error)
      }
      return
    }

    // Update state to show loading
    setSchemaStatus('validating')
    setSchemaError(null)
    setSchemaErrorDetails([])

    try {
      // Fetch schema
      const result = await performSchemaFetch(urlPath.trim())

      if (result.success) {
        // Handle successful fetch
        setSchemaStatus('valid')
        setSchemaContent(result.content)
        setDetectedFormat(result.format)
        setSelectedFormat(result.format)
      } else {
        // Handle fetch error
        handleSchemaError(result.error)
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage =
        error instanceof Error
          ? `An error occurred while fetching the schema: ${error.message}`
          : 'An unexpected error occurred while fetching the schema'
      handleSchemaError(errorMessage)
    }
  }

  const handleRemoveSchema = () => {
    setUrlPath('')
    setSchemaStatus('idle')
    setSchemaContent(null)
    setSchemaError(null)
    setSchemaErrorDetails([])
  }

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrlPath(e.target.value)
    // Reset schema status when URL changes
    if (schemaStatus !== 'idle') {
      setSchemaStatus('idle')
      setSchemaContent(null)
      setSchemaError(null)
      setSchemaErrorDetails([])
    }
  }

  return (
    <div
      className={clsx(
        styles.container,
        isPending && styles.pending,
        formError && styles.error,
        attachmentDragActive && styles.dragActive,
      )}
    >
      <form
        action={formAction}
        className={styles.form}
        style={createAccessibleOpacityTransition(!isTransitioning)}
      >
        {schemaContent && (
          <input type="hidden" name="schemaContent" value={schemaContent} />
        )}
        <input type="hidden" name="schemaFormat" value={selectedFormat} />
        <div className={styles.inputSection}>
          <div className={styles.urlInputWrapper}>
            <div className={styles.inputContainer}>
              <input
                id="schemaUrl"
                name="schemaUrl"
                type="text"
                value={urlPath}
                onChange={handleUrlChange}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    urlPath.trim() &&
                    schemaStatus !== 'validating'
                  ) {
                    e.preventDefault()
                    handleFetchSchema()
                  }
                }}
                placeholder="Enter schema file path (e.g., db/schema.rb)"
                disabled={isPending}
                className={styles.urlInput}
              />
              {urlPath && (
                <RemoveButton
                  onClick={handleRemoveSchema}
                  variant="transparent"
                  size="sm"
                  className={styles.clearButton}
                  aria-label="Clear input"
                />
              )}
            </div>
            <Button
              type="button"
              variant={urlPath.trim() ? 'solid-primary' : 'outline-secondary'}
              size="md"
              disabled={
                isPending || !urlPath.trim() || schemaStatus === 'validating'
              }
              onClick={handleFetchSchema}
            >
              Fetch Schema
            </Button>
          </div>
          {schemaStatus !== 'idle' && (
            <SchemaInfoSection
              status={schemaStatus}
              schemaName={getFileNameFromUrl(urlPath)}
              schemaUrl={urlPath}
              detectedFormat={detectedFormat}
              selectedFormat={selectedFormat}
              errorMessage={schemaError || undefined}
              errorDetails={
                schemaErrorDetails.length > 0 ? schemaErrorDetails : undefined
              }
              variant="simple"
              showRemoveButton={false}
              onFormatChange={setSelectedFormat}
              onRemove={handleRemoveSchema}
              onViewTroubleshootingGuide={() => {
                window.open(
                  'https://liambx.com/docs/parser/troubleshooting',
                  '_blank',
                  'noopener,noreferrer',
                )
              }}
            />
          )}
        </div>
        <div
          className={clsx(
            styles.inputSection,
            attachmentDragActive && styles.dragActive,
          )}
          onDragEnter={handleAttachmentDrag}
          onDragLeave={handleAttachmentDrag}
          onDragOver={handleAttachmentDrag}
          onDrop={handleAttachmentDrop}
        >
          <AttachmentsContainer
            attachments={attachments}
            onRemove={handleRemoveAttachment}
          />
          <div className={styles.textareaWrapper}>
            <textarea
              id="message"
              ref={textareaRef}
              name="message"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={textContent}
              onChange={handleTextareaChange}
              className={styles.textarea}
              disabled={isPending}
              rows={4}
            />
            {formError && <p className={styles.error}>{formError}</p>}
          </div>
          <div className={styles.buttonContainer}>
            <SessionFormActions
              isPending={isPending}
              hasContent={hasContent}
              onFileSelect={handleFileSelect}
              onCancel={handleResetForm}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
