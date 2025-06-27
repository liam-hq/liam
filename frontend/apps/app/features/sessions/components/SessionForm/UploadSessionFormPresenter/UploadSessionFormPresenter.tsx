import { Button } from '@liam-hq/ui'
import clsx from 'clsx'
import { type ChangeEvent, type FC, useRef, useState } from 'react'
import {
  FormatIcon,
  type FormatType,
} from '../../../../../components/FormatIcon/FormatIcon'
import { AttachmentsContainer } from '../AttachmentsContainer'
import { FormatSelectDropdown } from '../FormatSelectDropdown'
import { useFileAttachments } from '../hooks/useFileAttachments'
import { useFileDragAndDrop } from '../hooks/useFileDragAndDrop'
import { SessionFormActions } from '../SessionFormActions'
import { DropZone } from './DropZone'
import { SchemaFileSection } from './SchemaFileSection'
import styles from './UploadSessionFormPresenter.module.css'
import { getFileFormat, isValidFileExtension } from './utils/fileValidation'

type Props = {
  formError?: string
  isPending: boolean
  formAction: (formData: FormData) => void
}

// Helper function to handle file processing
const processFile = (
  file: File,
  setIsValidSchema: (valid: boolean) => void,
  setSelectedFile: (file: File) => void,
  setSelectedFormat: (format: FormatType) => void,
) => {
  const isValid = isValidFileExtension(file.name)
  setIsValidSchema(isValid)
  setSelectedFile(file)
  if (isValid) {
    setSelectedFormat(getFileFormat(file.name))
  }
}

export const UploadSessionFormPresenter: FC<Props> = ({
  formError,
  isPending,
  formAction,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<FormatType | null>(null)
  const [textContent, setTextContent] = useState('')
  const [isValidSchema, setIsValidSchema] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // File attachments hook
  const {
    attachments,
    handleFileSelect,
    handleRemoveAttachment,
    clearAttachments,
  } = useFileAttachments()

  // File drag and drop for schema file
  const handleSchemaFileDrop = (files: FileList) => {
    const file = files[0]
    if (file) {
      processFile(file, setIsValidSchema, setSelectedFile, setSelectedFormat)
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
      processFile(file, setIsValidSchema, setSelectedFile, setSelectedFormat)
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
    setTextContent(textarea.value)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setSelectedFormat(null)
    setTextContent('')
    setIsValidSchema(true)
    clearAttachments()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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
      <form action={formAction}>
        {selectedFile && isValidSchema && selectedFormat && (
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
              isValidSchema={isValidSchema}
            />
            <input
              ref={fileInputRef}
              type="file"
              name="schemaFile"
              onChange={handleSchemaFileSelect}
              accept=".sql,.rb,.prisma,.json,.yaml,.yml"
              className={styles.hiddenFileInput}
              disabled={isPending}
            />
            {selectedFile && selectedFormat && (
              <SchemaFileSection
                selectedFile={selectedFile}
                isValidSchema={isValidSchema}
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
                onRemoveFile={() => {
                  setSelectedFile(null)
                  setIsValidSchema(true)
                  setSelectedFormat(null)
                }}
              />
            )}
          </div>
        </div>
        <div className={styles.divider} />
        <div
          className={`${styles.inputSection} ${attachmentDragActive ? styles.dragActive : ''}`}
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
              className={styles.textarea}
              disabled={isPending}
              rows={4}
            />
            {formError && <p className={styles.error}>{formError}</p>}
          </div>
          <div className={styles.buttonContainer}>
            <SessionFormActions
              isPending={isPending}
              hasContent={
                !!selectedFile ||
                textContent.trim().length > 0 ||
                attachments.length > 0
              }
              onFileSelect={handleFileSelect}
              onCancel={handleReset}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
