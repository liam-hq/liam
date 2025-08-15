import clsx from 'clsx'
import type { FC } from 'react'
import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '@/utils/accessibleTransitions'
import type { SchemaStatus } from '../../GitHubSessionForm/SchemaInfoSection'
import { AttachmentsContainer } from '../../shared/AttachmentsContainer'
import { useAutoResizeTextarea } from '../../shared/hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../../shared/hooks/useEnterKeySubmission'
import { useFileAttachments } from '../../shared/hooks/useFileAttachments'
import { useFileDragAndDrop } from '../../shared/hooks/useFileDragAndDrop'
import { SessionFormActions } from '../../shared/SessionFormActions'
import { SchemaUploadSection } from './components/SchemaUploadSection'
import { useUploadSessionState } from './hooks/useUploadSessionState'
import styles from './UploadSessionFormPresenter.module.css'
import { processUploadedFile } from './utils/fileProcessing'
import { calculateHasContent } from './utils/hasContentCalculation'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

export const UploadSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const {
    isHovered,
    selectedFile,
    detectedFormat,
    selectedFormat,
    textContent,
    schemaStatus,
    fileInputRef,
    textareaRef,
    formRef,
    setIsHovered,
    setSelectedFile,
    setDetectedFormat,
    setSelectedFormat,
    setTextContent,
    setSchemaStatus,
    resetState,
    resetSchemaState,
  } = useUploadSessionState()

  // File attachments hook
  const {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  } = useFileAttachments()

  // Calculate hasContent for Enter key submission
  const hasContent = calculateHasContent({
    selectedFile,
    schemaStatus,
    textContent,
    attachments,
  })
  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

  // File drag and drop for schema file
  const handleSchemaFileDrop = (files: FileList) => {
    const file = files[0]
    if (file) {
      const {
        status,
        detectedFormat: newDetectedFormat,
        selectedFormat: newSelectedFormat,
      } = processUploadedFile(file, fileInputRef)
      setSelectedFile(file)
      setSchemaStatus(status)
      setDetectedFormat(newDetectedFormat)
      setSelectedFormat(newSelectedFormat)
    }
  }

  const {
    dragActive: schemaDragActive,
    handleDrag: handleSchemaDrag,
    handleDrop: handleSchemaDrop,
  } = useFileDragAndDrop(handleSchemaFileDrop)

  // File drag and drop for attachments
  const {
    dragActive: attachmentDragActive,
    handleDrag: handleAttachmentDrag,
    handleDrop: handleAttachmentDrop,
  } = useFileDragAndDrop(handleFileSelect)

  const handleFileProcess = (
    file: File,
    status: SchemaStatus,
    newDetectedFormat: FormatType | null,
    newSelectedFormat: FormatType | null,
  ) => {
    setSelectedFile(file)
    setSchemaStatus(status)
    setDetectedFormat(newDetectedFormat)
    setSelectedFormat(newSelectedFormat)
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  // Use auto-resize hook for textarea
  const { handleChange } = useAutoResizeTextarea(textareaRef, textContent)

  const handleTextareaChange = handleChange((e) => {
    setTextContent(e.target.value)
  })

  const handleReset = () => {
    resetState()
    clearAttachments()
    // The auto-resize hook will handle the height adjustment
  }

  return (
    <div
      className={clsx(
        styles.container,
        isPending && (styles.pending ?? ''),
        formError && styles.error,
        (attachmentDragActive || schemaDragActive) && (styles.dragActive ?? ''),
      )}
    >
      <form
        ref={formRef}
        action={formAction}
        style={createAccessibleOpacityTransition(!isTransitioning)}
      >
        {selectedFile && schemaStatus === 'valid' && selectedFormat && (
          <input type="hidden" name="schemaFormat" value={selectedFormat} />
        )}
        <SchemaUploadSection
          isPending={isPending}
          schemaDragActive={schemaDragActive}
          isHovered={isHovered}
          selectedFile={selectedFile}
          schemaStatus={schemaStatus}
          detectedFormat={detectedFormat}
          selectedFormat={selectedFormat}
          fileInputRef={fileInputRef}
          onSelectFile={handleSelectFile}
          onSchemaDrop={handleSchemaDrop}
          onSchemaDrag={handleSchemaDrag}
          onHoverChange={setIsHovered}
          onFileProcess={handleFileProcess}
          onFormatChange={setSelectedFormat}
          onRemoveSchema={resetSchemaState}
        />
        <div className={styles.divider} />
        <div
          className={clsx(
            styles.inputSection ?? '',
            attachmentDragActive ? (styles.dragActive ?? '') : '',
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
              onCancel={handleReset}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
