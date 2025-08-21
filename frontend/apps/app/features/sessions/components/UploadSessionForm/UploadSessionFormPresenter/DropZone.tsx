import clsx from 'clsx'
import type { DragEvent, FC, KeyboardEvent } from 'react'
import styles from './DropZone.module.css'
import { FileIcon } from './FileIcon'

type Props = {
  isPending: boolean
  schemaDragActive: boolean
  isHovered: boolean
  onSelectFile?: () => void
  onDragEnter?: (e: DragEvent) => void
  onDragLeave?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  hasSelectedFile: boolean
  isValidSchema: boolean
}

export const DropZone: FC<Props> = ({
  isPending,
  schemaDragActive,
  isHovered,
  onSelectFile,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onMouseEnter,
  onMouseLeave,
  hasSelectedFile,
  isValidSchema,
}) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isPending && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onSelectFile?.()
    }
  }

  return (
    <button
      type="button"
      className={clsx(
        styles.dropZone,
        schemaDragActive && styles.dropZoneActive,
        isPending && styles.dropZoneDisabled,
      )}
      onClick={isPending || !onSelectFile ? undefined : onSelectFile}
      onKeyDown={handleKeyDown}
      onDragEnter={isPending || !onDragEnter ? undefined : onDragEnter}
      onDragLeave={isPending || !onDragLeave ? undefined : onDragLeave}
      onDragOver={isPending || !onDragOver ? undefined : onDragOver}
      onDrop={isPending || !onDrop ? undefined : onDrop}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={isPending}
      aria-label="Upload area - drag and drop or click to select schema file"
    >
      <div className={styles.dropZoneContent}>
        <div className={styles.iconContainer}>
          <FileIcon isHovered={isHovered} isDragActive={schemaDragActive} />
          <div className={styles.extensionTags}>
            <span className={styles.extensionTag}>.sql</span>
            <span className={styles.extensionTag}>.rb</span>
            <span className={styles.extensionTag}>.prisma</span>
            <span className={styles.extensionTag}>.json</span>
          </div>
        </div>
        <p className={styles.dropZoneText}>
          Drag & drop your schema file or click to upload
        </p>
        <p className={styles.dropZoneSubtext}>
          Supported formats: .sql, .rb, .prisma, .json (tbls)
        </p>
        <span
          className={clsx(
            styles.selectFileButton,
            hasSelectedFile && isValidSchema && styles.selectFileButtonOutline,
            isPending && styles.selectFileButtonDisabled,
          )}
        >
          Select File
        </span>
      </div>
    </button>
  )
}
