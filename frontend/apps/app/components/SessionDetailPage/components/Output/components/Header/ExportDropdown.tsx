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

export const ExportDropdown: FC = () => {
  const handleDownloadMigrations = () => {
    // Migrations download functionality
  }

  const handleDownloadSchema = () => {
    // Schema file download functionality
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline-secondary"
          size="sm"
          leftIcon={<Download size={16} />}
          rightIcon={<ChevronDown size={16} />}
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
