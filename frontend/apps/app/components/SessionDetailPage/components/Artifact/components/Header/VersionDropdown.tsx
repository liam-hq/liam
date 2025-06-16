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
import { useState } from 'react'

type Version = {
  id: string
  label: string
}

const versions: Version[] = [
  { id: 'v0', label: 'v0' },
  { id: 'v1', label: 'v1' },
  { id: 'v2', label: 'v2' },
]

export const VersionDropdown: FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<Version>(versions[0])

  const handleVersionSelect = (version: Version) => {
    setSelectedVersion(version)
    // TODO: Implement version switching functionality
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline-secondary"
          size="sm"
          rightIcon={<ChevronDown size={16} />}
        >
          {selectedVersion.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8}>
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onSelect={() => handleVersionSelect(version)}
            >
              {version.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
