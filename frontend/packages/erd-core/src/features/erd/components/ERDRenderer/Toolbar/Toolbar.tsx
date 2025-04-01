import type { FC } from 'react'
import { DesktopToolbar } from './DesktopToolbar'
import { MobileToolbar } from './MobileToolbar'

interface ToolbarProps {
  projectId?: string | undefined
  branchOrCommit?: string | undefined
}

export const Toolbar: FC<ToolbarProps> = ({ projectId, branchOrCommit }) => {
  return (
    <>
      <MobileToolbar />
      <DesktopToolbar projectId={projectId} branchOrCommit={branchOrCommit} />
    </>
  )
}
