import { AlertTriangle, Check, X } from '@liam-hq/ui'
import type { FC } from 'react'
import type { FormatType } from '@/components/FormatIcon/FormatIcon'
import { FormatIcon } from '@/components/FormatIcon/FormatIcon'
import { FormatSelectDropdown } from '@/features/sessions/components/SessionForm/FormatSelectDropdown'
import styles from './UploadSessionFormPresenter.module.css'
import { getDisplayFormat, getFileFormat } from './utils/fileValidation'

type Props = {
  selectedFile: File
  isValidSchema: boolean
  selectedFormat: FormatType
  onFormatChange: (format: FormatType) => void
  onRemoveFile: () => void
}

export const SchemaFileSection: FC<Props> = ({
  selectedFile,
  isValidSchema,
  selectedFormat,
  onFormatChange,
  onRemoveFile,
}) => {
  return (
    <div className={styles.validSchemaContainer}>
      <div className={styles.validSchemaMessage}>
        <div className={styles.fetchStatus}>
          {isValidSchema ? (
            <>
              <Check size={12} className={styles.checkIcon} />
              <span className={styles.validSchemaText}>Valid Schema</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} className={styles.invalidIcon} />
              <span className={styles.invalidSchemaText}>Invalid Schema</span>
            </>
          )}
        </div>
        {isValidSchema ? (
          <span className={styles.detectedText}>
            Detected as{' '}
            <span className={styles.formatName}>
              {getDisplayFormat(selectedFile.name)}
            </span>{' '}
            based on file extension.
          </span>
        ) : (
          <span className={styles.detectedText}>
            Unsupported file type. Please upload .sql, .rb, .prisma, or .json
            (tbls) files.
          </span>
        )}
      </div>
      {isValidSchema && (
        <div className={styles.matchFiles}>
          <div className={styles.matchFileItem}>
            <div className={styles.uploadedFile}>
              <FormatIcon format={getFileFormat(selectedFile.name)} size={16} />
              <span className={styles.fileName}>{selectedFile.name}</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={onRemoveFile}
                aria-label="Remove file"
              >
                <X size={10} />
              </button>
            </div>
            <FormatSelectDropdown
              selectedFormat={selectedFormat}
              onFormatChange={onFormatChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}
