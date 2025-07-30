'use client'

import {
  Button,
  ChevronDown,
  Download,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  FileText,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ExportDropdown.module.css'

export const ExportDropdown: FC = () => {
  const handleDownloadMigrations = () => {
    // TODO: Implement Migrations download functionality
  }

  const handleDownloadSchema = () => {
    // TODO: Implement schema file download functionality
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline-secondary"
          size="sm"
          leftIcon={<Download size={16} />}
          rightIcon={<ChevronDown size={16} />}
          className={styles.button}
        >
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8}>
          <DropdownMenuItem
            leftIcon={<Download size={16} />}
            onSelect={handleDownloadMigrations}
          >
            Download Migrations
          </DropdownMenuItem>
          <DropdownMenuItem
            leftIcon={<FileText size={16} />}
            onSelect={handleDownloadSchema}
          >
            Download Schema File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
