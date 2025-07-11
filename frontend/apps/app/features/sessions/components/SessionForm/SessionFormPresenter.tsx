import { type FC, useEffect, useRef, useState } from 'react'
import type { Projects } from '@/components/CommonLayout/AppBar/ProjectsDropdownMenu/services/getProjects'
import { createAccessibleOpacityTransition } from '@/utils/accessibleTransitions'
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
  onArtifactModeChange?: (isActive: boolean) => void
  artifactMode?: boolean
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
  onArtifactModeChange,
  artifactMode,
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

  // Smooth height animation using max-height
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // Use ResizeObserver to detect content changes with requestAnimationFrame throttling
    let ticking = false
    const updateHeight = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const currentPanel = container.querySelector('[role="tabpanel"]')
        if (currentPanel) {
          const height = currentPanel.scrollHeight
          if (prefersReducedMotion) {
            // Skip animation and set height immediately
            container.style.transition = 'none'
            container.style.maxHeight = `${height + 50}px`
          } else {
            // Set max-height slightly larger than actual height for smooth animation
            container.style.maxHeight = `${height + 50}px`
          }
        }
        ticking = false
      })
    }

    // Initial height update
    updateHeight()

    // Watch for content changes
    const resizeObserver = new ResizeObserver(updateHeight)
    const currentPanel = container.querySelector('[role="tabpanel"]')
    if (currentPanel) {
      resizeObserver.observe(currentPanel)
    }

    return () => {
      resizeObserver.disconnect()
    }
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
      <div ref={containerRef} className={styles.formContainer}>
        {mode === 'github' && (
          <div
            role="tabpanel"
            id="github-panel"
            aria-labelledby="github-tab"
            style={createAccessibleOpacityTransition(!isTransitioning)}
          >
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
              onArtifactModeChange={onArtifactModeChange}
              artifactMode={artifactMode}
            />
          </div>
        )}
        {mode === 'upload' && (
          <div
            role="tabpanel"
            id="upload-panel"
            aria-labelledby="upload-tab"
            style={createAccessibleOpacityTransition(!isTransitioning)}
          >
            <UploadSessionFormPresenter
              formError={formError}
              isPending={isPending}
              formAction={formAction}
              isTransitioning={isTransitioning}
              onArtifactModeChange={onArtifactModeChange}
              artifactMode={artifactMode}
            />
          </div>
        )}
        {mode === 'url' && (
          <div
            role="tabpanel"
            id="url-panel"
            aria-labelledby="url-tab"
            style={createAccessibleOpacityTransition(!isTransitioning)}
          >
            <URLSessionFormPresenter
              formError={formError}
              isPending={isPending}
              formAction={formAction}
              isTransitioning={isTransitioning}
              onArtifactModeChange={onArtifactModeChange}
              artifactMode={artifactMode}
            />
          </div>
        )}
      </div>
    </div>
  )
}
