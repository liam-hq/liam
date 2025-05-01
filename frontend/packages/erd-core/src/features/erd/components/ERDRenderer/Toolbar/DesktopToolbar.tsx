import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import type { FC } from 'react'
import { CommentButton } from './CommentButton'
import styles from './DesktopToolbar.module.css'
import { FitviewButton } from './FitviewButton'
import { GroupButton } from './GroupButton'
import { ShowModeMenu } from './ShowModeMenu'
import { TidyUpButton } from './TidyUpButton'
import { ZoomControls } from './ZoomControls'

type DesktopToolbarProps = {
  withGroupButton?: boolean
}

export const DesktopToolbar: FC<DesktopToolbarProps> = ({
  withGroupButton = false,
}) => {
  return (
    <ToolbarPrimitive.Root className={styles.root} aria-label="Toolbar">
      <ZoomControls />
      <ToolbarPrimitive.Separator className={styles.separator} />
      <div className={styles.buttons}>
        <FitviewButton />
        <TidyUpButton />
        {withGroupButton && <GroupButton />}
        <CommentButton />
        {/* TODO: enable once implemented */}
        {/* <ViewControlButton /> */}
      </div>
      <ToolbarPrimitive.Separator className={styles.separator} />
      <ShowModeMenu />
    </ToolbarPrimitive.Root>
  )
}
