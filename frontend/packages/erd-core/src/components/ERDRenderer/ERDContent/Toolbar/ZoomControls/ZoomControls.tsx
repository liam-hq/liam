import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { IconButton, Minus, Plus } from '@liam-hq/ui'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow, useStore } from '@xyflow/react'
import { type FC, useCallback } from 'react'
import styles from './ZoomControls.module.css'

export const ZoomControls: FC = () => {
  const zoomLevel = useStore((store) => store.transform[2])
  const { zoomIn, zoomOut } = useReactFlow()
  const { showMode } = useUserEditingStore()
  const { version } = useVersion()

  const handleClickZoomOut = useCallback(() => {
    version.displayedOn === 'cli' &&
      toolbarActionLogEvent({
        element: 'zoom',
        zoomLevel: zoomLevel.toFixed(2),
        showMode,
        cliVer: version.version,
        appEnv: version.envName,
      })
    zoomOut()
  }, [zoomOut, zoomLevel, showMode, version])

  const handleClickZoomIn = useCallback(() => {
    version.displayedOn === 'cli' &&
      toolbarActionLogEvent({
        element: 'zoom',
        zoomLevel: zoomLevel.toFixed(2),
        showMode: showMode,
        cliVer: version.version,
        appEnv: version.envName,
      })
    zoomIn()
  }, [zoomIn, zoomLevel, showMode, version])

  return (
    <div className={styles.wrapper}>
      <ToolbarButton asChild onClick={handleClickZoomOut}>
        <IconButton icon={<Minus />} tooltipContent="Zoom Out" />
      </ToolbarButton>
      <span className={styles.zoomLevelText}>
        {Math.floor(zoomLevel * 100)}%
      </span>
      <ToolbarButton asChild onClick={handleClickZoomIn}>
        <IconButton icon={<Plus />} tooltipContent="Zoom In" />
      </ToolbarButton>
    </div>
  )
}
