import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, Minus, Plus } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useStore } from '@xyflow/react'
import { type FC, useCallback } from 'react'
import styles from './ZoomControls.module.css'

export const ZoomControls: FC = () => {
  const zoomLevel = useStore((store) => store.transform[2])
  const { zoomIn, zoomOut } = useCustomReactflow()
  const { showMode } = useUserEditingStore()
  const { version } = useVersion()

  const handleClickZoomOut = useCallback(() => {
    toolbarActionLogEvent({
      element: 'zoom',
      zoomLevel: zoomLevel.toFixed(2),
      showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
    zoomOut()
  }, [zoomOut, zoomLevel, showMode, version])

  const handleClickZoomIn = useCallback(() => {
    toolbarActionLogEvent({
      element: 'zoom',
      zoomLevel: zoomLevel.toFixed(2),
      showMode: showMode,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    })
    zoomIn()
  }, [zoomIn, zoomLevel, showMode, version])

  return (
    <div className={styles.wrapper}>
      <ToolbarButton asChild onClick={handleClickZoomOut}>
        <IconButton
          icon={<Minus />}
          tooltipContent="Zoom Out"
          aria-label="Zoom out"
        />
      </ToolbarButton>
      <span className={styles.zoomLevelText} aria-label="Zoom level">
        {Math.floor(zoomLevel * 100)}%
      </span>
      <ToolbarButton asChild onClick={handleClickZoomIn}>
        <IconButton
          icon={<Plus />}
          tooltipContent="Zoom In"
          aria-label="Zoom in"
        />
      </ToolbarButton>
    </div>
  )
}
