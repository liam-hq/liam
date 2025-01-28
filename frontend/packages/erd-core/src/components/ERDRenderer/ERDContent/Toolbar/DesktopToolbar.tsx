import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import type { FC } from 'react'
import styles from './DesktopToolbar.module.css'
import { FitviewButton } from './FitviewButton'
import { ShowModeMenu } from './ShowModeMenu'
import { TidyUpButton } from './TidyUpButton'
import { ZoomControls } from './ZoomControls'

export const DesktopToolbar: FC = () => {
  return (
    <ToolbarPrimitive.Root className={styles.root}>
      <ZoomControls />
      <ToolbarPrimitive.Separator className={styles.separator} />
      <div className={styles.buttons}>
        <FitviewButton />
        <TidyUpButton />
        {/* TODO: enable once implemented */}
        {/* <ViewControlButton /> */}
      </div>
      <ToolbarPrimitive.Separator className={styles.separator} />
      <ShowModeMenu />
    </ToolbarPrimitive.Root>
  )
}
