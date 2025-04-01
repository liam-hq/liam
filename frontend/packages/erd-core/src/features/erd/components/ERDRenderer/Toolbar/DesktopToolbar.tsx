import * as ToolbarPrimitive from '@radix-ui/react-toolbar'
import type { FC } from 'react'
import styles from './DesktopToolbar.module.css'
import { FitviewButton } from './FitviewButton'
import { GroupButton } from './GroupButton'
import { ShowModeMenu } from './ShowModeMenu'
import { TidyUpButton } from './TidyUpButton'
import { ZoomControls } from './ZoomControls'

interface DesktopToolbarProps {
  projectId?: string | undefined
  branchOrCommit?: string | undefined
}

export const DesktopToolbar: FC<DesktopToolbarProps> = ({
  projectId,
  branchOrCommit,
}) => {
  return (
    <ToolbarPrimitive.Root className={styles.root} aria-label="Toolbar">
      <ZoomControls />
      <ToolbarPrimitive.Separator className={styles.separator} />
      <div className={styles.buttons}>
        <FitviewButton />
        <TidyUpButton />
        {projectId && branchOrCommit && (
          <GroupButton projectId={projectId} branchOrCommit={branchOrCommit} />
        )}

        {/* TODO: enable once implemented */}
        {/* <ViewControlButton /> */}
      </div>
      <ToolbarPrimitive.Separator className={styles.separator} />
      <ShowModeMenu />
    </ToolbarPrimitive.Root>
  )
}
