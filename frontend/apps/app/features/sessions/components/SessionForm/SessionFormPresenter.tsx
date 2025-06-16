import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import type { FC } from 'react'
import { useState } from 'react'
import { GitHubSessionFormPresenter } from './GitHubSessionFormPresenter'
import styles from './SessionFormPresenter.module.css'
import { type SessionMode, SessionModeSelector } from './SessionModeSelector'
import { URLSessionFormPresenter } from './URLSessionFormPresenter'
import { UploadSessionFormPresenter } from './UploadSessionFormPresenter'

type Branch = {
  name: string
  sha: string
  protected: boolean
}

type Props = {
  projects: Projects
  defaultProjectId?: string
  branches: Branch[]
  isBranchesLoading: boolean
  branchesError?: string
  formError?: string
  isPending: boolean
  onProjectChange: (projectId: string) => void
  formAction: (formData: FormData) => void
}

export const SessionFormPresenter: FC<Props> = ({
  projects,
  defaultProjectId,
  branches,
  isBranchesLoading,
  branchesError,
  formError,
  isPending,
  onProjectChange,
  formAction,
}) => {
  const [mode, setMode] = useState<SessionMode>('github')

  const renderFormPresenter = () => {
    switch (mode) {
      case 'github':
        return (
          <GitHubSessionFormPresenter
            projects={projects}
            defaultProjectId={defaultProjectId}
            branches={branches}
            isBranchesLoading={isBranchesLoading}
            branchesError={branchesError}
            formError={formError}
            isPending={isPending}
            onProjectChange={onProjectChange}
            formAction={formAction}
          />
        )
      case 'upload':
        return (
          <UploadSessionFormPresenter
            formError={formError}
            isPending={isPending}
            formAction={formAction}
          />
        )
      case 'url':
        return (
          <URLSessionFormPresenter
            formError={formError}
            isPending={isPending}
            formAction={formAction}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.container}>
      <SessionModeSelector selectedMode={mode} onModeChange={setMode} />
      {renderFormPresenter()}
    </div>
  )
}
