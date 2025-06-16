'use client'

import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import type { FC } from 'react'
import { useActionState, useEffect, useTransition } from 'react'
import { createSession } from '../../actions/createSession'
import { getBranches } from '../../actions/getBranches'
import { SessionFormPresenter } from './SessionFormPresenter'

type Props = {
  projects: Projects
  defaultProjectId?: string
}

export const SessionForm: FC<Props> = ({ projects, defaultProjectId }) => {
  const [, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState(createSession, {
    success: false,
  })

  const [branchesState, branchesAction, isBranchesLoading] = useActionState(
    getBranches,
    { branches: [], loading: false },
  )

  const handleProjectChange = (projectId: string) => {
    startTransition(() => {
      const formData = new FormData()
      formData.append('projectId', projectId)
      branchesAction(formData)
    })
  }

  // Auto-load branches when a default project is provided (e.g., from ProjectSessionsPage)
  // This ensures users don't need to manually reselect the project to see branch options
  useEffect(() => {
    if (defaultProjectId && projects.some((p) => p.id === defaultProjectId)) {
      startTransition(() => {
        const formData = new FormData()
        formData.append('projectId', defaultProjectId)
        branchesAction(formData)
      })
    }
  }, [defaultProjectId, projects, branchesAction])

  return (
    <SessionFormPresenter
      projects={projects}
      defaultProjectId={defaultProjectId}
      branches={branchesState.branches}
      isBranchesLoading={isBranchesLoading}
      branchesError={branchesState.error}
      formError={state.error}
      isPending={isPending}
      onProjectChange={handleProjectChange}
      formAction={formAction}
    />
  )
}
