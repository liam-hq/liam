import clsx from 'clsx'
import { type ChangeEvent, type FC, useRef, useState } from 'react'
import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '@/utils/accessibleTransitions'
import { AttachmentsContainer } from '../AttachmentsContainer'
import { useAutoResizeTextarea } from '../hooks/useAutoResizeTextarea'
import { useEnterKeySubmission } from '../hooks/useEnterKeySubmission'
import { useFileAttachments } from '../hooks/useFileAttachments'
import { useFileDragAndDrop } from '../hooks/useFileDragAndDrop'
import { SchemaInfoSection, type SchemaStatus } from '../SchemaInfoSection'
import { SessionFormActions } from '../SessionFormActions'
import { DropZone } from './DropZone'
import styles from './UploadSessionFormPresenter.module.css'
import { getFileFormat, isValidFileExtension } from './utils/fileValidation'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
  onArtifactModeChange?: (isActive: boolean) => void
  artifactMode?: boolean
}

// Helper function to handle file processing
const processFile = (
  file: File,
  setSchemaStatus: (status: SchemaStatus) => void,
  setSelectedFile: (file: File) => void,
  setDetectedFormat: (format: FormatType | null) => void,
  setSelectedFormat: (format: FormatType | null) => void,
) => {
  const isValid = isValidFileExtension(file.name)
  setSchemaStatus(isValid ? 'valid' : 'invalid')
  setSelectedFile(file)
  if (isValid) {
    const format = getFileFormat(file.name)
    setDetectedFormat(format)
    setSelectedFormat(format)
  } else {
    setDetectedFormat(null)
    setSelectedFormat(null)
  }
}

export const UploadSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
  onArtifactModeChange,
  artifactMode,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<FormatType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null)
  const [textContent, setTextContent] = useState('')
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // File attachments hook
  const {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  } = useFileAttachments()

  // Calculate hasContent for Enter key submission
  const hasContent =
    !!selectedFile || textContent.trim().length > 0 || attachments.length > 0
  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

  // File drag and drop for schema file
  const handleSchemaFileDrop = (files: FileList) => {
    const file = files[0]
    if (file) {
      processFile(
        file,
        setSchemaStatus,
        setSelectedFile,
        setDetectedFormat,
        setSelectedFormat,
      )
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

  const handleSchemaFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(
        file,
        setSchemaStatus,
        setSelectedFile,
        setDetectedFormat,
        setSelectedFormat,
      )
    }
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
    setSelectedFile(null)
    setDetectedFormat(null)
    setSelectedFormat(null)
    setTextContent('')
    setSchemaStatus('idle')
    clearAttachments()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // The auto-resize hook will handle the height adjustment
  }

  return (
    <div
      className={clsx(
        styles.container,
        isPending && styles.pending,
        formError && styles.error,
        (attachmentDragActive || schemaDragActive) && styles.dragActive,
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
        <div className={styles.uploadSection}>
          <div className={styles.uploadContainer}>
            <DropZone
              isPending={isPending}
              schemaDragActive={schemaDragActive}
              isHovered={isHovered}
              onSelectFile={handleSelectFile}
              onDragEnter={handleSchemaDrag}
              onDragLeave={handleSchemaDrag}
              onDragOver={handleSchemaDrag}
              onDrop={handleSchemaDrop}
              onMouseEnter={() => !isPending && setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              hasSelectedFile={!!selectedFile}
              isValidSchema={schemaStatus !== 'invalid'}
            />
            <input
              ref={fileInputRef}
              type="file"
              name="schemaFile"
              onChange={handleSchemaFileSelect}
              accept=".sql,.rb,.prisma,.json"
              className={styles.hiddenFileInput}
              disabled={isPending}
            />
            {selectedFile && (
              <SchemaInfoSection
                status={schemaStatus}
                schemaName={selectedFile.name}
                detectedFormat={detectedFormat || 'postgres'}
                selectedFormat={selectedFormat || detectedFormat || 'postgres'}
                errorMessage={
                  schemaStatus === 'invalid'
                    ? 'Unsupported file type. Please upload .sql, .rb, .prisma, or .json files.'
                    : undefined
                }
                onFormatChange={setSelectedFormat}
                onRemove={() => {
                  setSelectedFile(null)
                  setSchemaStatus('idle')
                  setDetectedFormat(null)
                  setSelectedFormat(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              />
            )}
          </div>
        </div>
        <div className={styles.divider} />
        <div
          className={clsx(
            styles.inputSection,
            attachmentDragActive ? styles.dragActive : '',
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
              ref={textareaRef}
              name="message"
              placeholder="Enter your database design instructions. For example: Design a database for an e-commerce site that manages users, products, and orders..."
              value={textContent}
              onChange={handleTextareaChange}
              onKeyDown={handleEnterKeySubmission}
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
              onCancel={handleReset}
              onArtifactModeChange={onArtifactModeChange}
              artifactMode={artifactMode}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
