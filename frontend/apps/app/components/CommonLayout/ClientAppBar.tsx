'use client'

import type { Tables } from '@liam-hq/db/supabase/database.types'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AppBar } from '../AppBar/AppBar'

type Project = Tables<'Project'>

type ClientAppBarProps = {
  project?: Project | null
  branchName?: string
  branchTag?: string
  avatarInitial?: string
  avatarColor?: string
}

export function ClientAppBar({
  project: initialProject,
  branchName = 'main', // TODO: get branch name from database
  branchTag = 'production', // TODO: get branch tag from database
  avatarInitial = 'L',
  avatarColor = 'var(--color-teal-800)',
}: ClientAppBarProps) {
  const pathname = usePathname()
  const [project, _setProject] = useState<Project | null>(
    initialProject || null,
  )
  const isMinimal = !pathname?.includes('/projects/')

  // Try to extract projectId from URL for client-side rendering
  const projectsPattern = /\/app\/projects\/(\d+)(?:\/|$)/
  const match = pathname?.match(projectsPattern)
  const _projectId = match?.[1] ?? undefined

  return (
    <AppBar
      project={project || undefined}
      branchName={branchName}
      branchTag={branchTag}
      avatarInitial={avatarInitial}
      avatarColor={avatarColor}
      minimal={isMinimal}
    />
  )
}
