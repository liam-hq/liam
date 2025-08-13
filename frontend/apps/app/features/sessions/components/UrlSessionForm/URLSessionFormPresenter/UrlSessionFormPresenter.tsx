import clsx from 'clsx'
import { type FC, useRef } from 'react'
import { createAccessibleOpacityTransition } from '../../../../../utils/accessibleTransitions'
import { AttachmentsContainer } from '../../shared/AttachmentsContainer'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { useFileAttachments } from '../../shared/hooks/useFileAttachments'
import { useFileDragAndDrop } from '../../shared/hooks/useFileDragAndDrop'
import { SessionFormActions } from '../../shared/SessionFormActions'
import { SchemaInfoWrapper } from '../components/SchemaInfoWrapper'
import { UrlInputSection } from '../components/UrlInputSection'
import { useSchemaFetch } from '../hooks/useSchemaFetch'
import { useUrlSessionForm } from '../hooks/useUrlSessionForm'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Schema fetching state and logic
  const {
    schemaStatus,
    schemaContent,
    detectedFormat,
    selectedFormat,
    schemaError,
    schemaErrorDetails,
    setSelectedFormat,
    handleFetchSchema,
    resetSchemaState,
  } = useSchemaFetch()

  // Form state management
  const {
    urlPath,
    textContent,
    setTextContent,
    handleUrlChange: handleUrlInputChange,
    resetFormState,
  } = useUrlSessionForm((status) => {
    if (status === 'idle') {
      resetSchemaState()
    }
  })

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

  // Computed values to reduce complexity in render
  const hasContent =
    schemaContent !== null ||
    textContent.trim().length > 0 ||
    attachments.length > 0

  const canFetchSchema = Boolean(
    urlPath.trim() && schemaStatus !== 'validating',
  )
  const showSchemaInfo = schemaStatus !== 'idle'

  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

  // Reset form to initial state
  const handleResetForm = () => {
    resetFormState()
    resetSchemaState()
    clearAttachments()
  }

  const handleRemoveSchema = () => {
    resetFormState()
    resetSchemaState()
  }

  const handleSchemaFetch = () => handleFetchSchema(urlPath)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canFetchSchema) {
      e.preventDefault()
      handleSchemaFetch()
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
        ref={formRef}
        action={formAction}
        className={styles.form}
        style={createAccessibleOpacityTransition(!isTransitioning)}
      >
        {schemaContent && (
          <input type="hidden" name="schemaContent" value={schemaContent} />
        )}
        <input type="hidden" name="schemaFormat" value={selectedFormat} />
        <div className={styles.inputSection}>
          <UrlInputSection
            urlPath={urlPath}
            isPending={isPending}
            canFetchSchema={canFetchSchema}
            onUrlChange={handleUrlInputChange}
            onKeyDown={handleKeyDown}
            onFetchSchema={handleSchemaFetch}
            onRemoveSchema={handleRemoveSchema}
          />
          <SchemaInfoWrapper
            showSchemaInfo={showSchemaInfo}
            schemaStatus={schemaStatus}
            urlPath={urlPath}
            detectedFormat={detectedFormat}
            selectedFormat={selectedFormat}
            schemaError={schemaError}
            schemaErrorDetails={schemaErrorDetails}
            onFormatChange={setSelectedFormat}
            onRemove={handleRemoveSchema}
          />
        </div>
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
              id="initialMessage"
              ref={textareaRef}
              name="initialMessage"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={textContent}
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
              onCancel={handleResetForm}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
