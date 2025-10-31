'use client'
import { RemoveButton } from '@liam-hq/ui'
import type { FormatType } from 'components/FormatIcon'
import { FormatSelectDropdown } from 'features/sessions/components/shared/FormatSelectDropdown'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { type ChangeEvent, type FC, useCallback } from 'react'
import styles from './SetSchemaForm.module.css'

type Props = {
  filePath: string
  format: FormatType
  disabled?: boolean
  onFilePathChange: (path: string) => void
  onFormatChange: (format: FormatType) => void
}

export const SetSchemaForm: FC<Props> = ({
  filePath,
  format,
  disabled,
  onFilePathChange,
  onFormatChange,
}) => {
  const handleChangeFilePath = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onFilePathChange(e.target.value)
    },
    [onFilePathChange],
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.item}>
        <div className={styles.itemHeader}>
          <div className={styles.itemTitle}>Select Schema Format</div>
          <FormatSelectDropdown
            selectedFormat={format}
            onFormatChange={onFormatChange}
          />
        </div>
      </div>
      <div className={styles.item}>
        <div className={styles.itemHeader}>
          <div className={styles.itemTitle}>Set Schema File Path</div>
          {/* TODO: Update Link href to appropriate document URL */}
          <Link href="/" className={styles.link}>
            <span className={styles.linkText}>View Document</span>
            <ChevronRight className={styles.linkIcon} />
          </Link>
        </div>
        <form className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={filePath}
              placeholder="Enter schema file path (e.g., db/schema.rb)"
              disabled={disabled}
              className={styles.input}
              onChange={handleChangeFilePath}
            />
            {filePath !== '' && (
              <RemoveButton
                onClick={() => onFilePathChange('')}
                variant="transparent"
                size="sm"
                className={styles.removeButton}
                aria-label="Clear input"
              />
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
