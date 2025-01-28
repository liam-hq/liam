import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, TidyUpIcon } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow } from '@xyflow/react'
import { type FC, type ReactNode, useCallback } from 'react'
import { useAutoLayout } from '../../useAutoLayout'
import styles from './TidyUpButton.module.css'

interface TidyUpButtonProps {
  children?: ReactNode
}

export const TidyUpButton: FC<TidyUpButtonProps> = ({ children = '' }) => {
  const { getNodes, getEdges } = useReactFlow()
  const { handleLayout } = useAutoLayout()
  const { showMode } = useUserEditingStore()
  const { version } = useVersion()
  const handleClick = useCallback(() => {
    toolbarActionLogEvent({
      element: 'tidyUp',
      showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
    handleLayout(getNodes(), getEdges())
  }, [handleLayout, showMode, getNodes, getEdges, version])

  return (
    <ToolbarButton asChild className={styles.menuButton}>
      <IconButton
        icon={<TidyUpIcon />}
        tooltipContent="Tidy up"
        onClick={handleClick}
      >
        {children}
      </IconButton>
    </ToolbarButton>
  )
}
