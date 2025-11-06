import {
  Copy,
  Download,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ExportButton.module.css'

export const ExportButton: FC = () => {
  const handleCopyPostgreSQL = async () => {}
  const handleCopyYaml = async () => {}

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <button type="button" className={styles.iconWrapper}>
          <Download className={styles.icon} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem
            size="sm"
            leftIcon={<Copy size={16} />}
            onSelect={handleCopyPostgreSQL}
          >
            Copy PostgreSQL
          </DropdownMenuItem>
          <DropdownMenuItem
            size="sm"
            leftIcon={<Copy size={16} />}
            onSelect={handleCopyYaml}
          >
            Copy YAML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
