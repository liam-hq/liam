import { type IconButton, TidyUpIcon } from '@liam-hq/ui'
import { useReactFlow } from '@xyflow/react'
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
} from 'react'
import { useVersionOrThrow } from '../../../../../../providers'
import { useUserEditingOrThrow } from '../../../../../../stores'
import { toolbarActionLogEvent } from '../../../../../gtm/utils'
import { useCustomReactflow } from '../../../../../reactflow/hooks'
import { computeAutoLayout } from '../../../../utils'
import { ToolbarIconButton } from '../ToolbarIconButton'

type TidyUpButtonProps = {
  children?: ReactNode
  size?: ComponentProps<typeof IconButton>['size']
}

export const TidyUpButton: FC<TidyUpButtonProps> = ({
  children = '',
  size = 'md',
}) => {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const { fitView } = useCustomReactflow()
  const { showMode } = useUserEditingOrThrow()
  const { version } = useVersionOrThrow()

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
