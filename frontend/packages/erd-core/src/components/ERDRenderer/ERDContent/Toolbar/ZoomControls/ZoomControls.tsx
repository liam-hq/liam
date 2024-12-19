import { clickLogEvent } from '@/features/gtm/utils'
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

  const handleClickZoomOut = useCallback(() => {
    clickLogEvent({
      element: 'zoom',
      zoomLevel: zoomLevel.toFixed(2),
      showMode: showMode,
    })
    zoomOut()
  }, [zoomOut, zoomLevel, showMode])

  const handleClickZoomIn = useCallback(() => {
    clickLogEvent({
      element: 'zoom',
      zoomLevel: zoomLevel.toFixed(2),
      showMode: showMode,
    })
    zoomIn()
  }, [zoomIn, zoomLevel, showMode])

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
