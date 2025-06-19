import { Minus, Plus } from '@liam-hq/ui'
import { useStore } from '@xyflow/react'
import { type FC, useCallback } from 'react'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersion } from '@/providers'
import { useUserEditing } from '@/stores'
import { ToolbarIconButton } from '../ToolbarIconButton'
import styles from './ZoomControls.module.css'

export const ZoomControls: FC = () => {
  const zoomLevel = useStore((store) => store.transform[2])
  const { zoomIn, zoomOut } = useCustomReactflow()
  const { showMode } = useUserEditing()
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
      <ToolbarIconButton
        onClick={handleClickZoomOut}
        tooltipContent="Zoom Out"
        label="Zoom out"
        icon={<Minus />}
      />
      <output className={styles.zoomLevelText}>
        {Math.floor(zoomLevel * 100)}%
      </output>
      <ToolbarIconButton
        onClick={handleClickZoomIn}
        tooltipContent="Zoom In"
        label="Zoom in"
        icon={<Plus />}
      />
    </div>
  )
}
