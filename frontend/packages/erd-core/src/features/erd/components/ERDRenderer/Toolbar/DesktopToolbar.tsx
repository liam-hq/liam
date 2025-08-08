import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import type { FC, ReactNode } from 'react'
import styles from './DesktopToolbar.module.css'
import { FitviewButton } from './FitviewButton'
import { ShowModeMenu } from './ShowModeMenu'
import { TidyUpButton } from './TidyUpButton'
import { ZoomControls } from './ZoomControls'

type Props = {
  customActions?: ReactNode
}

export const DesktopToolbar: FC<Props> = ({ customActions }) => {
  return (
    <ToolbarPrimitive.Root
      className={styles.root}
      aria-label="Toolbar"
      data-testid="toolbar"
    >
      <ZoomControls />
      <ToolbarPrimitive.Separator className={styles.separator} />
      <div className={styles.buttons}>
        <FitviewButton />
        <TidyUpButton />
        {customActions}
      </div>
      <ToolbarPrimitive.Separator className={styles.separator} />
      <ShowModeMenu />
    </ToolbarPrimitive.Root>
  )
}
