import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, Scan } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
} from 'react'
import styles from './Fitview.module.css'

interface FitviewButtonProps {
  children?: ReactNode
  size?: ComponentProps<typeof IconButton>['size']
}

export const FitviewButton: FC<FitviewButtonProps> = ({
  children = '',
  size = 'md',
}) => {
  const { fitView } = useCustomReactflow()
  const { showMode } = useUserEditingStore()
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
    fitView()
  }, [fitView, showMode, version])

  return (
    <ToolbarButton asChild onClick={handleClick} className={styles.menuButton}>
      <IconButton
        size={size}
        icon={<Scan />}
        tooltipContent="Zoom to Fit"
        aria-label="Zoom to fit"
      >
        {children}
      </IconButton>
    </ToolbarButton>
  )
}
