import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCliVersion } from '@/providers'
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
  const { cliVersion } = useCliVersion()

  const handleClickZoomOut = useCallback(() => {
    toolbarActionLogEvent({
      element: 'zoom',
      zoomLevel: zoomLevel.toFixed(2),
      showMode,
      cliVer: cliVersion.version,
      appEnv: cliVersion.envName,
    })
    zoomOut()
  }, [zoomOut, zoomLevel, showMode, cliVersion.version, cliVersion.envName])

  const handleClickZoomIn = useCallback(() => {
    toolbarActionLogEvent({
      element: 'zoom',
      zoomLevel: zoomLevel.toFixed(2),
      showMode: showMode,
      cliVer: cliVersion.version,
      appEnv: cliVersion.envName,
    })
    zoomIn()
  }, [zoomIn, zoomLevel, showMode, cliVersion.version, cliVersion.envName])

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
