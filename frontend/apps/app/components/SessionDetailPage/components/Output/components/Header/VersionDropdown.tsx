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
import { useOutputUI } from '../../hooks/useOutputUI'
import { AVAILABLE_VERSIONS } from '../../mock/versionData'

export const VersionDropdown: FC = () => {
  const { state, actions } = useOutputUI()
  const { selectedVersion } = state
  const { setSelectedVersion } = actions

  const handleVersionSelect = (version: number) => {
    setSelectedVersion(version)
  }

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline-secondary"
          size="sm"
          rightIcon={<ChevronDown size={16} />}
        >
          v{selectedVersion}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8}>
          {AVAILABLE_VERSIONS.map((version) => (
            <DropdownMenuItem
              key={version}
              onSelect={() => handleVersionSelect(version)}
            >
              v{version}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}
