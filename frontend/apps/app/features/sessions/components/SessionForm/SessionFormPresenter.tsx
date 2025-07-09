import { type FC, useEffect, useRef, useState } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { createAccessibleHeightTransition } from '@/utils/accessibleTransitions'
import { GitHubSessionFormPresenter } from './GitHubSessionFormPresenter'
import styles from './SessionFormPresenter.module.css'
import { type SessionMode, SessionModeSelector } from './SessionModeSelector'
import { UploadSessionFormPresenter } from './UploadSessionFormPresenter'
import { URLSessionFormPresenter } from './URLSessionFormPresenter'

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
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fadeInTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleModeChange = (newMode: SessionMode) => {
    if (newMode === mode || isTransitioning) return

    const container = containerRef.current
    if (!container) return

    // Clear any existing timers
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
    if (fadeInTimerRef.current) clearTimeout(fadeInTimerRef.current)

    // Start fade out
    setIsTransitioning(true)

    // Wait for fade out to complete
    fadeOutTimerRef.current = setTimeout(() => {
      // Change mode (this will trigger height calculation in useEffect)
      setMode(newMode)
    }, 150) // Fade out duration

    // Start fade in after mode change and height animation
    const FADE_OUT_DURATION = 150
    const HEIGHT_TRANSITION_DURATION = 300
    fadeInTimerRef.current = setTimeout(() => {
      setIsTransitioning(false)
    }, FADE_OUT_DURATION + HEIGHT_TRANSITION_DURATION)
  }

  useEffect(() => {
    // Set height when mode changes
    const timer = setTimeout(() => {
      const container = containerRef.current
      const currentPanel = container?.querySelector('[role="tabpanel"]')

      if (container && currentPanel) {
        const height = currentPanel.scrollHeight
        container.style.height = `${height}px`
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [mode])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current)
      if (fadeInTimerRef.current) clearTimeout(fadeInTimerRef.current)
    }
  }, [])

  return (
    <div className={styles.container}>
      <SessionModeSelector
        selectedMode={mode}
        onModeChange={handleModeChange}
      />
      <div
        ref={containerRef}
        className={styles.formContainer}
        style={createAccessibleHeightTransition()}
      >
        {mode === 'github' && (
          <div role="tabpanel" id="github-panel" aria-labelledby="github-tab">
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
              isTransitioning={isTransitioning}
            />
          </div>
        )}
        {mode === 'upload' && (
          <div role="tabpanel" id="upload-panel" aria-labelledby="upload-tab">
            <UploadSessionFormPresenter
              formError={formError}
              isPending={isPending}
              formAction={formAction}
              isTransitioning={isTransitioning}
            />
          </div>
        )}
        {mode === 'url' && (
          <div role="tabpanel" id="url-panel" aria-labelledby="url-tab">
            <URLSessionFormPresenter
              formError={formError}
              isPending={isPending}
              formAction={formAction}
              isTransitioning={isTransitioning}
            />
          </div>
        )}
      </div>
    </div>
  )
}
