import { ClipboardList, GithubLogo, Link, Upload } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useEffect, useId, useRef } from 'react'
import styles from './SessionModeSelector.module.css'

export type SessionMode = 'scratch' | 'github' | 'upload' | 'url' | 'paste'

export type ModeIds = {
  tabId: string
  panelId: string
}

type Props = {
  selectedMode: SessionMode
  onModeChange: (mode: SessionMode, ids: ModeIds) => void
}

const modes: { mode: SessionMode; label: string; icon: React.ReactElement }[] =
  [
    {
      mode: 'scratch',
      label: 'Scratch',
      icon: <></>,
    },
    {
      mode: 'github',
      label: 'Import from GitHub',
      icon: <GithubLogo className={styles.modeButtonIcon} />,
    },
    {
      mode: 'upload',
      label: 'Import from File',
      icon: <Upload size={16} className={styles.modeButtonIcon} />,
    },
    {
      mode: 'url',
      label: 'Import from URL',
      icon: <Link size={16} className={styles.modeButtonIcon} />,
    },
    {
      mode: 'paste',
      label: 'Paste Schema',
      icon: <ClipboardList size={16} className={styles.modeButtonIcon} />,
    },
  ]

export const SessionModeSelector: FC<Props> = ({
  selectedMode,
  onModeChange,
}) => {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])
  const backgroundRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldFocusOnModeChange = useRef(false)

  // Generate unique IDs for all modes
  const baseId = useId()
  const modeIds: Record<SessionMode, ModeIds> = {
    scratch: {
      tabId: `${baseId}-scratch-tab`,
      panelId: `${baseId}-scratch-panel`,
    },
    github: {
      tabId: `${baseId}-github-tab`,
      panelId: `${baseId}-github-panel`,
    },
    upload: {
      tabId: `${baseId}-upload-tab`,
      panelId: `${baseId}-upload-panel`,
    },
    url: {
      tabId: `${baseId}-url-tab`,
      panelId: `${baseId}-url-panel`,
    },
    paste: {
      tabId: `${baseId}-paste-tab`,
      panelId: `${baseId}-paste-panel`,
    },
  }

  const getTabId = (mode: SessionMode) => modeIds[mode].tabId
  const getPanelId = (mode: SessionMode) => modeIds[mode].panelId

  useEffect(() => {
    // Only focus when mode changes via arrow keys, not on initial render
    if (shouldFocusOnModeChange.current) {
      const selectedIndex = modes.findIndex((m) => m.mode === selectedMode)
      if (selectedIndex !== -1 && buttonsRef.current[selectedIndex]) {
        buttonsRef.current[selectedIndex]?.focus()
      }
      shouldFocusOnModeChange.current = false
    }
  }, [selectedMode])

  useEffect(() => {
    const selectedIndex = modes.findIndex((m) => m.mode === selectedMode)
    const selectedButton = buttonsRef.current[selectedIndex]
    const background = backgroundRef.current
    const container = containerRef.current

    if (selectedButton && background && container) {
      const containerRect = container.getBoundingClientRect()
      const buttonRect = selectedButton.getBoundingClientRect()
      const translateX = buttonRect.left - containerRect.left
      const width = buttonRect.width

      background.style.transform = `translateX(${translateX}px)`
      background.style.width = `${width}px`
    }
  }, [selectedMode])

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number | null = null

    switch (e.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : modes.length - 1
        break
      case 'ArrowRight':
        newIndex = currentIndex < modes.length - 1 ? currentIndex + 1 : 0
        break
      case 'Home':
        newIndex = 0
        break
      case 'End':
        newIndex = modes.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    if (newIndex === null) return

    shouldFocusOnModeChange.current = true
    const newMode = modes[newIndex]?.mode ?? 'github'
    onModeChange(newMode, modeIds[newMode])
  }

  const setButtonRef =
    (index: number) => (element: HTMLButtonElement | null) => {
      if (buttonsRef.current && element) {
        buttonsRef.current[index] = element
      }
    }

  return (
    <div
      ref={containerRef}
      className={styles.modeButtons}
      role="tablist"
      aria-label="Session mode selector"
    >
      <div ref={backgroundRef} className={styles.modeButtonBackground} />
      {modes.map((modeItem, index) => {
        const currentIndex = index
        return (
          <button
            key={modeItem.mode}
            ref={setButtonRef(currentIndex)}
            type="button"
            role="tab"
            id={getTabId(modeItem.mode)}
            aria-selected={selectedMode === modeItem.mode}
            aria-controls={getPanelId(modeItem.mode)}
            tabIndex={selectedMode === modeItem.mode ? 0 : -1}
            className={clsx(
              styles.modeButton,
              selectedMode === modeItem.mode ? styles.modeButtonActive : '',
            )}
            onClick={() => onModeChange(modeItem.mode, modeIds[modeItem.mode])}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {modeItem.icon}
            {modeItem.label}
          </button>
        )
      })}
    </div>
  )
}
