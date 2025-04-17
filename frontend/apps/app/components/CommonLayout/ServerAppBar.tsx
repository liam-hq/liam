import { getProject } from '@/features/projects/pages/ProjectDetailPage/getProject'
import type { Tables } from '@liam-hq/db/supabase/database.types'
import type { ReactNode } from 'react'
import { AppBar } from '../AppBar/AppBar'

type ServerAppBarProps = {
  projectId?: string
  branchName?: string
  branchTag?: string
  avatarInitial?: string
  avatarColor?: string
  minimal?: boolean
  children?: ReactNode
}

export async function ServerAppBar({
  projectId,
  branchName = 'main',
  branchTag = 'production',
  avatarInitial = 'L',
  avatarColor = 'var(--color-teal-800)',
  minimal = false,
  children,
}: ServerAppBarProps) {
  let project: Tables<'Project'> | null = null
  if (projectId) {
    project = await getProject(projectId)
  }

  return (
    <AppBar
      project={project || undefined}
      branchName={branchName}
      branchTag={branchTag}
      avatarInitial={avatarInitial}
      avatarColor={avatarColor}
      minimal={minimal}
    >
      {children}
    </AppBar>
  )
}
