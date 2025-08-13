import type { ChangeEvent, FC } from 'react'
import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import {
  SchemaInfoSection,
  type SchemaStatus,
} from '../../../GitHubSessionForm/SchemaInfoSection'
import { DropZone } from '../DropZone'
import styles from '../UploadSessionFormPresenter.module.css'
import { processUploadedFile } from '../utils/fileProcessing'

type Props = {
  isPending: boolean
  schemaDragActive: boolean
  isHovered: boolean
  selectedFile: File | null
  schemaStatus: SchemaStatus
  detectedFormat: FormatType | null
  selectedFormat: FormatType | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onSelectFile: () => void
  onSchemaDrop: (e: React.DragEvent) => void
  onSchemaDrag: (e: React.DragEvent) => void
  onHoverChange: (hovered: boolean) => void
  onFileProcess: (
    file: File,
    status: SchemaStatus,
    detectedFormat: FormatType | null,
    selectedFormat: FormatType | null,
  ) => void
  onFormatChange: (format: FormatType | null) => void
  onRemoveSchema: () => void
}

export const SchemaUploadSection: FC<Props> = ({
  isPending,
  schemaDragActive,
  isHovered,
  selectedFile,
  schemaStatus,
  detectedFormat,
  selectedFormat,
  fileInputRef,
  onSelectFile,
  onSchemaDrop,
  onSchemaDrag,
  onHoverChange,
  onFileProcess,
  onFormatChange,
  onRemoveSchema,
}) => {
  const handleSchemaFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const {
        status,
        detectedFormat: newDetectedFormat,
        selectedFormat: newSelectedFormat,
      } = processUploadedFile(file, fileInputRef)
      onFileProcess(file, status, newDetectedFormat, newSelectedFormat)
    }
  }

  return (
    <div className={styles.uploadSection ?? ''}>
      <div className={styles.uploadContainer ?? ''}>
        <DropZone
          isPending={isPending}
          schemaDragActive={schemaDragActive}
          isHovered={isHovered}
          onSelectFile={onSelectFile}
          onDragEnter={onSchemaDrag}
          onDragLeave={onSchemaDrag}
          onDragOver={onSchemaDrag}
          onDrop={onSchemaDrop}
          onMouseEnter={() => !isPending && onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
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
            onFormatChange={onFormatChange}
            onRemove={onRemoveSchema}
          />
        )}
      </div>
    </div>
  )
}
