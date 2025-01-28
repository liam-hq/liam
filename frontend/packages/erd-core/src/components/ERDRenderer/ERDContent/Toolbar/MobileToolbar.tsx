import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useVersion } from '@/providers'
import { useUserEditingStore } from '@/stores'
import { Ellipsis } from '@liam-hq/ui'
import { IconButton, Minus, Plus } from '@liam-hq/ui'
import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import { ToolbarButton } from '@radix-ui/react-toolbar'
import { useReactFlow, useStore } from '@xyflow/react'
import clsx from 'clsx'
import { useState } from 'react'
import { type FC, useCallback } from 'react'
import { FitviewButton } from './FitviewButton'
import styles from './MobileToolbar.module.css'
import { ShowModeMenu } from './ShowModeMenu'
import { TidyUpButton } from './TidyUpButton'

export const MobileToolbar: FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const toggle = () => {
    setIsOpen((prev) => !prev)
    setHasInteracted(true)
  }

  const zoomLevel = useStore((store) => store.transform[2])
  const { zoomIn, zoomOut } = useReactFlow()
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
    <ToolbarPrimitive.Root
      className={clsx(styles.root, {
        [styles.open]: isOpen,
        [styles.closed]: hasInteracted && !isOpen,
        [styles.initial]: !hasInteracted && !isOpen,
      })}
    >
      <div className={isOpen ? styles.hidden : styles.ellipsis}>
        <button type="button" onClick={toggle}>
          <Ellipsis color="var(--global-foreground)" />
        </button>
      </div>
      <div className={!isOpen ? styles.hidden : ''}>
        <div className={styles.wrapper}>
          <div className={styles.zoomLevelText}>
            <div className={styles.zoom}>Zoom</div>
            <div className={styles.zoomPercent}>
              {Math.floor(zoomLevel * 100)}%
            </div>
          </div>
          <hr className={styles.divider} />
          <div className={styles.buttonGroup}>
            <ToolbarButton
              asChild
              onClick={handleClickZoomIn}
              className={styles.menuButton}
            >
              <IconButton icon={<Plus />} tooltipContent="Zoom In">
                Zoom in
              </IconButton>
            </ToolbarButton>
            <ToolbarButton
              asChild
              onClick={handleClickZoomOut}
              className={styles.menuButton}
            >
              <IconButton icon={<Minus />} tooltipContent="Zoom Out">
                Zoom out
              </IconButton>
            </ToolbarButton>

            <FitviewButton>Zoom to Fit</FitviewButton>
            <TidyUpButton>Tidy up</TidyUpButton>
          </div>
          <hr className={styles.divider} />

          {/* TODO: Apply mobile design */}
          <ShowModeMenu />

          <button type="button" className={styles.closeButton} onClick={toggle}>
            close
          </button>
        </div>
      </div>
    </ToolbarPrimitive.Root>
  )
}
