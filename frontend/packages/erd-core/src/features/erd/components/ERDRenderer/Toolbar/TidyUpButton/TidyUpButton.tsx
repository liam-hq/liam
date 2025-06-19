import { computeAutoLayout } from '@/features/erd/utils'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useUserEditing } from '@/stores'
import { type IconButton, TidyUpIcon } from '@liam-hq/ui'
import { useReactFlow } from '@xyflow/react'
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
} from 'react'
import { ToolbarIconButton } from '../ToolbarIconButton'

interface TidyUpButtonProps {
  children?: ReactNode
  size?: ComponentProps<typeof IconButton>['size']
}

export const TidyUpButton: FC<TidyUpButtonProps> = ({
  children = '',
  size = 'md',
}) => {
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow()
  const { showMode } = useUserEditing()
  const { version } = useVersion()

  const handleClick = useCallback(async () => {
    toolbarActionLogEvent({
      element: 'tidyUp',
      showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })

    const { nodes } = await computeAutoLayout(getNodes(), getEdges())
    setNodes(nodes)
    fitView()
  }, [showMode, getNodes, getEdges, setNodes, fitView, version])

  return (
    <ToolbarIconButton
      onClick={handleClick}
      size={size}
      tooltipContent="Tidy up"
      label="Tidy up"
      icon={<TidyUpIcon />}
    >
      {children}
    </ToolbarIconButton>
  )
}
