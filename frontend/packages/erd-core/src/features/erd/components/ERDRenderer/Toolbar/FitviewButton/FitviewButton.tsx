import { type IconButton, Scan } from '@liam-hq/ui'
import { useReactFlow } from '@xyflow/react'
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
} from 'react'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useUserEditing } from '@/stores'
import { ToolbarIconButton } from '../ToolbarIconButton'

interface FitviewButtonProps {
  children?: ReactNode
  size?: ComponentProps<typeof IconButton>['size']
}

export const FitviewButton: FC<FitviewButtonProps> = ({
  children = '',
  size = 'md',
}) => {
  const { fitView } = useReactFlow()
  const { showMode } = useUserEditing()
  const { version } = useVersion()

  const handleClick = useCallback(() => {
    toolbarActionLogEvent({
      element: 'fitview',
      showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
    fitView({
      padding: 0.1,
      duration: 0,
    })
  }, [fitView, showMode, version])

  return (
    <ToolbarIconButton
      onClick={handleClick}
      size={size}
      tooltipContent="Zoom to Fit"
      label="Zoom to fit"
      icon={<Scan />}
    >
      {children}
    </ToolbarIconButton>
  )
}
