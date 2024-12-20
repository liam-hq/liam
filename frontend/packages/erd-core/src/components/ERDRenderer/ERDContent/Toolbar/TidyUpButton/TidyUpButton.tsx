import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCliVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, TidyUpIcon } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { type FC, useCallback } from 'react'
import { useAutoLayout } from '../../useAutoLayout'

export const TidyUpButton: FC = () => {
  const { handleLayout } = useAutoLayout()
  const { showMode } = useUserEditingStore()
  const { cliVersion } = useCliVersion()
  const handleClick = useCallback(() => {
    toolbarActionLogEvent({
      element: 'tidyUp',
      showMode,
      cliVer: cliVersion.version,
      appEnv: cliVersion.envName,
    })
    handleLayout()
  }, [handleLayout, showMode, cliVersion.version, cliVersion.envName])

  return (
    <ToolbarButton asChild>
      <IconButton
        icon={<TidyUpIcon />}
        tooltipContent="Tidy up"
        onClick={handleClick}
      />
    </ToolbarButton>
  )
}
