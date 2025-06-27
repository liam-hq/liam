import {
  Check,
  ChevronDown,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { FormatIcon, type FormatType } from '@/components/FormatIcon/FormatIcon'
import styles from './FormatSelectDropdown.module.css'

interface FormatOption {
  format: FormatType
  label: string
}

interface FormatSelectDropdownProps {
  selectedFormat: FormatType
  onFormatChange: (format: FormatType) => void
}

const formatOptions: FormatOption[] = [
  { format: 'postgres', label: 'postgresql' },
  { format: 'prisma', label: 'prisma' },
  { format: 'schemarb', label: 'schemarb' },
  { format: 'tbls', label: 'tbls' },
]

export const FormatSelectDropdown: FC<FormatSelectDropdownProps> = ({
  selectedFormat,
  onFormatChange,
}) => {
  const selectedOption =
    formatOptions.find((option) => option.format === selectedFormat) ||
    formatOptions[0]

  const handleSelectFormat = (format: FormatType) => {
    onFormatChange(format)
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <button type="button" className={styles.trigger}>
          <FormatIcon format={selectedOption.format} size={16} />
          <span className={styles.label}>{selectedOption.label}</span>
          <ChevronDown size={12} className={styles.chevron} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className={styles.dropdown} align="start">
        {formatOptions.map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={() => handleSelectFormat(option.format)}
            className={`${styles.menuItem} ${option.format === selectedFormat ? styles.menuItemSelected : ''}`}
          >
            <div className={styles.menuContent}>
              <FormatIcon format={option.format} size={16} />
              <span className={styles.menuLabel}>{option.label}</span>
            </div>
            {option.format === selectedFormat && (
              <Check size={10} className={styles.checkIcon} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}
