import { computeAutoLayout } from '@/features/erd/utils'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, TidyUpIcon } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow } from '@xyflow/react'
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
} from 'react'
import styles from './TidyUpButton.module.css'

interface TidyUpButtonProps {
  children?: ReactNode
  size?: ComponentProps<typeof IconButton>['size']
}

export const TidyUpButton: FC<TidyUpButtonProps> = ({
  children = '',
  size = 'md',
}) => {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  const { fitView } = useCustomReactflow()
  const { showMode } = useUserEditingStore()
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
    <ToolbarButton asChild className={styles.menuButton}>
      <IconButton
        icon={<TidyUpIcon />}
        tooltipContent="Tidy up"
        onClick={handleClick}
        size={size}
        aria-label="Tidy up"
      >
        {children}
      </IconButton>
    </ToolbarButton>
  )
}
