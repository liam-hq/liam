import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, TidyUpIcon } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { type FC, useCallback } from 'react'
import { useNodesContext } from '../../../../../providers/NodesProvider'
import { useAutoLayout } from '../../useAutoLayout'

export const TidyUpButton: FC = () => {
  const { nodes, edges } = useNodesContext()
  const { handleLayout } = useAutoLayout()
  const { showMode } = useUserEditingStore()
  const { version } = useVersion()

  const handleClick = useCallback(() => {
    version.displayedOn === 'cli' &&
      toolbarActionLogEvent({
        element: 'tidyUp',
        showMode,
        cliVer: version.version,
        appEnv: version.envName,
      })
    handleLayout(nodes, edges)
  }, [showMode, nodes, edges, version, handleLayout])

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
