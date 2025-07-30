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
import type { FC } from 'react'
import type { Version } from '@/components/SessionDetailPage/types'
import styles from './VersionDropdown.module.css'

type Props = {
  versions: Version[]
  selectedVersion: Version
  onSelectedVersionChange: (version: Version) => void
}

export const VersionDropdown: FC<Props> = ({
  versions,
  selectedVersion,
  onSelectedVersionChange,
}) => {
  const handleVersionSelect = (version: Version) => {
    onSelectedVersionChange(version)
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost-secondary"
          size="sm"
          rightIcon={<ChevronDown size={16} />}
          className={styles.button}
        >
          {`v${selectedVersion?.number}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8}>
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onSelect={() => handleVersionSelect(version)}
            >
              {`Version ${version.number}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
