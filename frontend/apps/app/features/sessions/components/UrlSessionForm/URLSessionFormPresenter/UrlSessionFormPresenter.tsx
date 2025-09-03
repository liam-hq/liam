import { Button, RemoveButton } from '@liam-hq/ui'
import clsx from 'clsx'
import { type ChangeEvent, type FC, useId, useRef, useState } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import {
  SchemaInfoSection,
  type SchemaStatus,
} from '../../GitHubSessionForm/SchemaInfoSection'
import { AttachmentsContainer } from '../../shared/AttachmentsContainer'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { useFileAttachments } from '../../shared/hooks/useFileAttachments'
import { useFileDragAndDrop } from '../../shared/hooks/useFileDragAndDrop'
import { SessionFormActions } from '../../shared/SessionFormActions'
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

const useUrlFormState = () => {
  const [urlPath, setUrlPath] = useState('')
  const [textContent, setTextContent] = useState('')
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')
  const [schemaContent, setSchemaContent] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('postgres')
  const [detectedFormat, setDetectedFormat] = useState<FormatType>('postgres')
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [schemaErrorDetails, setSchemaErrorDetails] = useState<string[]>([])

  return {
    urlPath,
    setUrlPath,
    textContent,
    setTextContent,
    schemaStatus,
    setSchemaStatus,
    schemaContent,
    setSchemaContent,
    selectedFormat,
    setSelectedFormat,
    detectedFormat,
    setDetectedFormat,
    schemaError,
    setSchemaError,
    schemaErrorDetails,
    setSchemaErrorDetails,
  }
}

const useUrlFormHandlers = (
  state: ReturnType<typeof useUrlFormState>,
  clearAttachments: () => void,
) => {
  const {
    setUrlPath,
    setTextContent,
    setSchemaStatus,
    setSchemaContent,
    setSelectedFormat,
    setDetectedFormat,
    setSchemaError,
    setSchemaErrorDetails,
  } = state

  const handleResetForm = () => {
    setUrlPath('')
    setTextContent('')
    setSchemaStatus('idle')
    setSchemaContent(null)
    setSelectedFormat('postgres')
    setDetectedFormat('postgres')
    setSchemaError(null)
    setSchemaErrorDetails([])
    clearAttachments()
  }

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

  const handleSchemaError = (error: string) => {
    setSchemaStatus('invalid')
    setSchemaError(error)
    setSchemaErrorDetails([])
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
    if (state.schemaStatus !== 'idle') {
      setSchemaStatus('idle')
      setSchemaContent(null)
      setSchemaError(null)
      setSchemaErrorDetails([])
    }
  }

  return {
    handleResetForm,
    validateUrl,
    performSchemaFetch,
    handleSchemaError,
    handleRemoveSchema,
    handleUrlChange,
  }
}

const useSchemaFetch = (
  state: ReturnType<typeof useUrlFormState>,
  handlers: ReturnType<typeof useUrlFormHandlers>,
) => {
  const { urlPath } = state
  const { validateUrl, performSchemaFetch, handleSchemaError } = handlers

  const handleFetchSchema = async () => {
    const validation = validateUrl(urlPath)
    if (!validation.isValid) {
      if (validation.error) {
        handleSchemaError(validation.error)
      }
      return
    }

    state.setSchemaStatus('validating')
    state.setSchemaError(null)
    state.setSchemaErrorDetails([])

    try {
      const result = await performSchemaFetch(urlPath.trim())

      if (result.success) {
        state.setSchemaStatus('valid')
        state.setSchemaContent(result.content)
        state.setDetectedFormat(result.format)
        state.setSelectedFormat(result.format)
      } else {
        handleSchemaError(result.error)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `An error occurred while fetching the schema: ${error.message}`
          : 'An unexpected error occurred while fetching the schema'
      handleSchemaError(errorMessage)
    }
  }

  return { handleFetchSchema }
}

const renderUrlInputSection = (
  state: ReturnType<typeof useUrlFormState>,
  handlers: ReturnType<typeof useUrlFormHandlers>,
  schemaFetch: ReturnType<typeof useSchemaFetch>,
  isPending: boolean,
  schemaUrlId: string,
) => {
  const {
    urlPath,
    schemaStatus,
    detectedFormat,
    selectedFormat,
    schemaError,
    schemaErrorDetails,
  } = state
  const { handleUrlChange, handleRemoveSchema } = handlers
  const { handleFetchSchema } = schemaFetch

  return (
    <div className={styles.inputSection}>
      <div className={styles.urlInputWrapper}>
        <div className={styles.inputContainer ?? ''}>
          <input
            id={schemaUrlId}
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
              className={styles.clearButton ?? ''}
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
          onFormatChange={state.setSelectedFormat}
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
  )
}

export const URLSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const schemaUrlId = useId()
  const initialMessageId = useId()
  const state = useUrlFormState()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  } = useFileAttachments()

  const handlers = useUrlFormHandlers(state, clearAttachments)
  const schemaFetch = useSchemaFetch(state, handlers)

  const {
    dragActive: attachmentDragActive,
    handleDrag: handleAttachmentDrag,
    handleDrop: handleAttachmentDrop,
  } = useFileDragAndDrop(handleFileSelect)

  const { handleChange } = useAutoResizeTextarea(textareaRef, state.textContent)
  const handleTextareaChange = handleChange(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      state.setTextContent(e.target.value)
    },
  )

  const hasContent =
    state.schemaContent !== null ||
    state.textContent.trim().length > 0 ||
    attachments.length > 0

  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

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
        ref={formRef}
        action={formAction}
        className={styles.form}
        style={createAccessibleOpacityTransition(!isTransitioning)}
      >
        {state.schemaContent && (
          <input
            type="hidden"
            name="schemaContent"
            value={state.schemaContent}
          />
        )}
        <input type="hidden" name="schemaFormat" value={state.selectedFormat} />
        {renderUrlInputSection(
          state,
          handlers,
          schemaFetch,
          isPending,
          schemaUrlId,
        )}
        <div
          className={clsx(
            styles.inputSection ?? '',
            attachmentDragActive && (styles.dragActive ?? ''),
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
          <div className={styles.textareaWrapper ?? ''}>
            <textarea
              ref={textareaRef}
              id={initialMessageId}
              name="initialMessage"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={state.textContent}
              onChange={handleTextareaChange}
              onKeyDown={handleEnterKeySubmission}
              className={styles.textarea ?? ''}
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
              onCancel={handlers.handleResetForm}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
