import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCliVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, TidyUpIcon } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow } from '@xyflow/react'
import { type FC, useCallback } from 'react'
import { useERDContentContext } from '../../ERDContentContext'
import { useAutoLayout } from '../../useAutoLayout'

export const TidyUpButton: FC = () => {
  const { getNodes, getEdges } = useReactFlow()
  const { handleLayout } = useAutoLayout()
  const { showMode } = useUserEditingStore()
  const { cliVersion } = useCliVersion()
  const {
    actions: { setAutoLayoutComplete },
  } = useERDContentContext()
  const handleClick = useCallback(() => {
    toolbarActionLogEvent({
      element: 'tidyUp',
      showMode,
      cliVer: cliVersion.version,
      appEnv: cliVersion.envName,
    })
    setAutoLayoutComplete(false)
    handleLayout(getNodes(), getEdges())
  }, [
    handleLayout,
    showMode,
    setAutoLayoutComplete,
    getNodes,
    getEdges,
    cliVersion.version,
    cliVersion.envName,
  ])

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
