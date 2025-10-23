'use client'

import {
  Button,
  ChevronDown,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@liam-hq/ui'
import { type FC, useCallback, useState } from 'react'
import type { Version } from '../../../../../types'
import styles from './VersionDropdown.module.css'

type Props = {
  versions: Version[] | undefined
  selectedVersion: Version | null
  onSelectedVersionChange: (version: Version) => void
}

export const VersionDropdown: FC<Props> = ({
  versions,
  selectedVersion,
  onSelectedVersionChange,
}) => {
  const disabled = !versions || versions.length === 0 || !selectedVersion

  const handleVersionSelect = (version: Version) => {
    onSelectedVersionChange(version)
  }

  const [open, setOpen] = useState(false)
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled) {
        setOpen(false)
        return
      }

      setOpen(open)
    },
    [disabled],
  )

  const getVersionLabel = (version: Version) => {
    if (version.number === 0) {
      return 'v0 (Initial)'
    }
    return `v${version.number}`
  }

  const getVersionMenuLabel = (version: Version) => {
    if (version.number === 0) {
      return 'Version 0 (Initial)'
    }
    return `Version ${version.number}`
  }

  return (
    <DropdownMenuRoot open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled}
          variant="ghost-secondary"
          size="sm"
          rightIcon={<ChevronDown size={16} />}
          className={styles.button}
        >
          {selectedVersion ? getVersionLabel(selectedVersion) : '-'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8}>
          {versions?.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onSelect={() => handleVersionSelect(version)}
            >
              {getVersionMenuLabel(version)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
