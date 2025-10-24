'use client'

import { type FC, useActionState, useEffect, useTransition } from 'react'
import type { Projects } from '../../../../components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { useSessionNavigation } from '../shared/hooks/useSessionNavigation'
import { createGitHubSession } from './actions/createGitHubSession'
import { getBranches } from './actions/getBranches'
import { getSchemaFilePath } from './actions/getSchemaFilePath'
import { GitHubSessionFormPresenter } from './GitHubSessionFormPresenter'

type Props = {
  projects: Projects
  defaultProjectId?: string
}

export const GitHubSessionForm: FC<Props> = ({
  projects,
  defaultProjectId,
}) => {
  const [, startChangingProject] = useTransition()
  const [state, formAction, isPending] = useActionState(createGitHubSession, {
    success: false,
    error: '',
  })

  const [branchesState, branchesAction, isBranchesLoading] = useActionState(
    getBranches,
    { branches: [], loading: false },
  )

  const [schemaPathState, schemaPathAction, isSchemaPathLoading] =
    useActionState(getSchemaFilePath, { path: null })

  const { isRouting } = useSessionNavigation(state)

  const handleProjectChange = (projectId: string) => {
    startChangingProject(() => {
      const formData = new FormData()
      formData.append('projectId', projectId)
      branchesAction(formData)
      schemaPathAction(formData)
    })
  }

  // Auto-load branches when a default project is provided (e.g., from ProjectSessionsPage)
  // This ensures users don't need to manually reselect the project to see branch options
  useEffect(() => {
    if (defaultProjectId && projects.some((p) => p.id === defaultProjectId)) {
      startChangingProject(() => {
        const formData = new FormData()
        formData.append('projectId', defaultProjectId)
        branchesAction(formData)
        schemaPathAction(formData)
      })
    }
  }, [defaultProjectId, projects, branchesAction, schemaPathAction])

  return (
    <GitHubSessionFormPresenter
      projects={projects}
      defaultProjectId={defaultProjectId}
      branches={branchesState.branches}
      isBranchesLoading={isBranchesLoading}
      isBranchesError={!!branchesState.error}
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      onProjectChange={handleProjectChange}
      formAction={formAction}
      schemaFilePath={schemaPathState.path}
      isSchemaPathLoading={isSchemaPathLoading}
    />
  )
}
