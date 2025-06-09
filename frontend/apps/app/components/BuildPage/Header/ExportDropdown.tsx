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
  const handleDownloadDDL = () => {
    // TODO: DDLダウンロード機能を実装
    // DDLダウンロード処理をここに実装
  }

  const handleDownloadSchema = () => {
    // TODO: スキーマファイルダウンロード機能を実装
    // スキーマファイルダウンロード処理をここに実装
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
            onSelect={handleDownloadDDL}
          >
            DDLをダウンロード
          </DropdownMenuItem>
          <DropdownMenuItem
            leftIcon={<FileText size={16} />}
            onSelect={handleDownloadSchema}
          >
            schemaファイルをダウンロード
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
