import { ChevronDown, Minus, Plus } from '@liam-hq/ui'
import { useStore } from '@xyflow/react'
import { type FC, useCallback } from 'react'
import { toolbarActionLogEvent } from '@/features/gtm/utils'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useVersion } from '@/providers'
import type { ShowMode } from '@/schemas/showMode'
import { useUserEditing } from '@/stores'
import { FitviewButton } from '../FitviewButton'
import { TidyUpButton } from '../TidyUpButton'
import { ToolbarIconButton } from '../ToolbarIconButton'
import styles from './OpenedMobileToolbar.module.css'

type Props = {
  toggleOpenClose: () => void
  toggleShowModeMenu: () => void
}

export const OpenedMobileToolbar: FC<Props> = ({
  toggleOpenClose,
  toggleShowModeMenu,
}) => {
  const { zoomIn, zoomOut } = useCustomReactflow()
  const zoomLevel = useStore((store) => store.transform[2])
  const { showMode } = useUserEditing()
  const { version } = useVersion()
  const LabelList: Record<ShowMode, string> = {
    ALL_FIELDS: 'All Fields',
    TABLE_NAME: 'Table Name',
    KEY_ONLY: 'Key Only',
  }
  const showModeLabel = LabelList[showMode]

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
      <div className={styles.zoomLevelText}>
        <div className={styles.zoom}>Zoom</div>
        <div className={styles.zoomPercent} aria-label="Zoom level">
          {Math.floor(zoomLevel * 100)}%
        </div>
      </div>
      <hr className={styles.divider} />
      <div className={styles.buttonGroup}>
        <ToolbarIconButton
          onClick={handleClickZoomIn}
          size="sm"
          tooltipContent="Zoom In"
          label="Zoom in"
          icon={<Plus />}
        >
          Zoom in
        </ToolbarIconButton>
        <ToolbarIconButton
          onClick={handleClickZoomOut}
          size="sm"
          tooltipContent="Zoom Out"
          label="Zoom out"
          icon={<Minus />}
        >
          Zoom out
        </ToolbarIconButton>

        <FitviewButton size="sm">Zoom to Fit</FitviewButton>
        <TidyUpButton size="sm">Tidy up</TidyUpButton>
      </div>
      <hr className={styles.divider} />

      <div className={styles.showMode}>
        <div className={styles.text}>show</div>
        <button
          type="button"
          onClick={toggleShowModeMenu}
          className={styles.showModeMenuButton}
          aria-label="Show mode"
        >
          {showModeLabel}
          <div className={styles.cheveron}>
            <ChevronDown color="var(--global-foreground, #fff)" />
          </div>
        </button>
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={toggleOpenClose}
      >
        Close
      </button>
    </div>
  )
}
