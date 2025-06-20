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
import { type FC, useCallback, useEffect, useState, useTransition } from 'react'
import type { Version } from '../../../../../types'
import { useRealtimeVersions } from './hooks/useRealtimeVersions'
import { getSchemaVersions } from './services/getSchemaVersions'

type Props = {
  designSessionId: string
  currentVersion: Version | null
  onCurrentVersionChange: (version: Version) => void
}

export const VersionDropdown: FC<Props> = ({
  designSessionId,
  currentVersion,
  onCurrentVersionChange,
}) => {
  const [isPending, startTransition] = useTransition()
  const [versions, setVersions] = useState<Version[]>([])

  const handleVersionSelect = (version: Version) => {
    onCurrentVersionChange(version)
  }

  const getVersions = useCallback(async (designSessionId: string) => {
    startTransition(async () => {
      const versions = await getSchemaVersions(designSessionId)

      setVersions(versions)
    })
  }, [])

  const handleVersionsUpdate = useCallback(
    (triggeredDesignSessionId: string) => {
      getVersions(triggeredDesignSessionId)
    },
    [getVersions],
  )

  useRealtimeVersions(designSessionId, handleVersionsUpdate)

  useEffect(() => {
    getVersions(designSessionId)
  }, [designSessionId, getVersions])

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger asChild>
        <Button
          isLoading={isPending}
          variant="outline-secondary"
          size="sm"
          rightIcon={<ChevronDown size={16} />}
        >
          {`v${currentVersion?.number}`}
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
