'use client'

import { HumanMessage } from '@langchain/core/messages'
import { useRouter } from 'next/navigation'
import { type FC, useActionState, useEffect, useTransition } from 'react'
import type { Projects } from '../../../../components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { LG_INITIAL_MESSAGE_PREFIX } from '../../../../constants/storageKeys'
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
  const router = useRouter()
  const [, startChangingProject] = useTransition()
  const [isRouting, startRouting] = useTransition()
  const [state, formAction, isPending] = useActionState(createGitHubSession, {
    success: false,
    error: '',
  })

  const [branchesState, branchesAction, isBranchesLoading] = useActionState(
    getBranches,
    { branches: [], loading: false },
  )

  const [schemaPathState, schemaPathAction] = useActionState(
    getSchemaFilePath,
    { path: null },
  )

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

  useEffect(() => {
    if (!state.success) return

    startRouting(() => {
      // Store the initial message for optimistic rendering
      const humanMessage = new HumanMessage({
        id: crypto.randomUUID(),
        content: state.initialMessage,
        additional_kwargs: {
          userName: state.userName,
        },
      })
      sessionStorage.setItem(
        `${LG_INITIAL_MESSAGE_PREFIX}:${state.designSessionId}`,
        JSON.stringify(humanMessage),
      )

      router.push(state.redirectTo)
    })
  }, [state, router])

  return (
    <GitHubSessionFormPresenter
      projects={projects}
      defaultProjectId={defaultProjectId}
      branches={branchesState.branches}
      isBranchesLoading={isBranchesLoading}
      branchesError={branchesState.error}
      formError={!state.success ? state.error : undefined}
      isPending={isPending || isRouting}
      onProjectChange={handleProjectChange}
      formAction={formAction}
      schemaFilePath={schemaPathState.path}
      isTransitioning={false}
    />
  )
}
