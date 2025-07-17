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
          variant="outline-secondary"
          size="sm"
          rightIcon={<ChevronDown size={16} />}
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
              {`v${version.number}`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
