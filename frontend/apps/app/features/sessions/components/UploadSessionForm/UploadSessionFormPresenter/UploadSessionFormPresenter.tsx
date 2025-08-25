import clsx from 'clsx'
import { type ChangeEvent, type FC, useRef, useState } from 'react'
import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import { createAccessibleOpacityTransition } from '@/utils/accessibleTransitions'
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
import { DropZone } from './DropZone'
import styles from './UploadSessionFormPresenter.module.css'
import { getFileFormat, isValidFileExtension } from './utils/fileValidation'
import { calculateHasContent } from './utils/hasContentCalculation'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
  isTransitioning?: boolean
}

// Helper function to handle file processing
const processFile = (
  file: File,
  setSchemaStatus: (status: SchemaStatus) => void,
  setSelectedFile: (file: File) => void,
  setDetectedFormat: (format: FormatType | null) => void,
  setSelectedFormat: (format: FormatType | null) => void,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
) => {
  const isValid = isValidFileExtension(file.name)
  setSchemaStatus(isValid ? 'valid' : 'invalid')
  setSelectedFile(file)

  // Create a new FileList and set it to the input element
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  if (fileInputRef.current) {
    fileInputRef.current.files = dataTransfer.files
  }

  if (isValid) {
    const format = getFileFormat(file.name)
    setDetectedFormat(format)
    setSelectedFormat(format)
  } else {
    setDetectedFormat(null)
    setSelectedFormat(null)
  }
}

const useUploadFormState = () => {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<FormatType | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null)
  const [textContent, setTextContent] = useState('')
  const [schemaStatus, setSchemaStatus] = useState<SchemaStatus>('idle')

  return {
    isHovered,
    setIsHovered,
    selectedFile,
    setSelectedFile,
    detectedFormat,
    setDetectedFormat,
    selectedFormat,
    setSelectedFormat,
    textContent,
    setTextContent,
    schemaStatus,
    setSchemaStatus,
  }
}

const useUploadFormHandlers = (
  state: ReturnType<typeof useUploadFormState>,
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  clearAttachments: () => void,
) => {
  const {
    setSelectedFile,
    setDetectedFormat,
    setSelectedFormat,
    setTextContent,
    setSchemaStatus,
  } = state

  const handleSchemaFileDrop = (files: FileList) => {
    const file = files[0]
    if (file) {
      processFile(
        file,
        setSchemaStatus,
        setSelectedFile,
        setDetectedFormat,
        setSelectedFormat,
        fileInputRef,
      )
    }
  }

  const handleSchemaFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(
        file,
        setSchemaStatus,
        setSelectedFile,
        setDetectedFormat,
        setSelectedFormat,
        fileInputRef,
      )
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

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
  }

  const handleSchemaRemove = () => {
    setSelectedFile(null)
    setSchemaStatus('idle')
    setDetectedFormat(null)
    setSelectedFormat(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return {
    handleSchemaFileDrop,
    handleSchemaFileSelect,
    handleSelectFile,
    handleReset,
    handleSchemaRemove,
  }
}

const renderUploadSection = (
  state: ReturnType<typeof useUploadFormState>,
  handlers: ReturnType<typeof useUploadFormHandlers>,
  isPending: boolean,
  schemaDragActive: boolean,
  handleSchemaDrag: (e: React.DragEvent) => void,
  handleSchemaDrop: (e: React.DragEvent) => void,
) => {
  const {
    isHovered,
    setIsHovered,
    selectedFile,
    schemaStatus,
    detectedFormat,
    selectedFormat,
  } = state
  const { handleSelectFile, handleSchemaRemove } = handlers

  return (
    <div className={styles.uploadSection ?? ''}>
      <div className={styles.uploadContainer ?? ''}>
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
            onFormatChange={state.setSelectedFormat}
            onRemove={handleSchemaRemove}
          />
        )}
      </div>
    </div>
  )
}

export const UploadSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
  isTransitioning = false,
}) => {
  const state = useUploadFormState()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  } = useFileAttachments()

  const handlers = useUploadFormHandlers(state, fileInputRef, clearAttachments)

  const hasContent = calculateHasContent({
    selectedFile: state.selectedFile,
    schemaStatus: state.schemaStatus,
    textContent: state.textContent,
    attachments,
  })

  const handleEnterKeySubmission = useEnterKeySubmission(
    hasContent,
    isPending,
    formRef,
  )

  const {
    dragActive: schemaDragActive,
    handleDrag: handleSchemaDrag,
    handleDrop: handleSchemaDrop,
  } = useFileDragAndDrop(handlers.handleSchemaFileDrop)

  const {
    dragActive: attachmentDragActive,
    handleDrag: handleAttachmentDrag,
    handleDrop: handleAttachmentDrop,
  } = useFileDragAndDrop(handleFileSelect)

  const { handleChange } = useAutoResizeTextarea(textareaRef, state.textContent)
  const handleTextareaChange = handleChange((e) => {
    state.setTextContent(e.target.value)
  })

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
        {state.selectedFile &&
          state.schemaStatus === 'valid' &&
          state.selectedFormat && (
            <input
              type="hidden"
              name="schemaFormat"
              value={state.selectedFormat}
            />
          )}
        <input
          ref={fileInputRef}
          type="file"
          name="schemaFile"
          onChange={handlers.handleSchemaFileSelect}
          accept=".sql,.rb,.prisma,.json"
          className={styles.hiddenFileInput}
          disabled={isPending}
        />
        {renderUploadSection(
          state,
          handlers,
          isPending,
          schemaDragActive,
          handleSchemaDrag,
          handleSchemaDrop,
        )}
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
              onCancel={handlers.handleReset}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
