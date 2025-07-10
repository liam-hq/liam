import { GithubLogo, Link, Upload } from '@liam-hq/ui'
import { type FC, useEffect, useRef } from 'react'
import styles from './SessionModeSelector.module.css'

export type SessionMode = 'github' | 'upload' | 'url'

type Props = {
  selectedMode: SessionMode
  onModeChange: (mode: SessionMode) => void
}

const modes: { mode: SessionMode; label: string; icon: React.ReactElement }[] =
  [
    {
      mode: 'github',
      label: 'Import Schema from GitHub',
      icon: <GithubLogo className={styles.modeButtonIcon} />,
    },
    {
      mode: 'upload',
      label: 'Start from Upload',
      icon: <Upload size={16} className={styles.modeButtonIcon} />,
    },
    {
      mode: 'url',
      label: 'Use Existing Schema (URL)',
      icon: <Link size={16} className={styles.modeButtonIcon} />,
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
    let newIndex = currentIndex

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : modes.length - 1
        shouldFocusOnModeChange.current = true
        break
      case 'ArrowRight':
        e.preventDefault()
        newIndex = currentIndex < modes.length - 1 ? currentIndex + 1 : 0
        shouldFocusOnModeChange.current = true
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        shouldFocusOnModeChange.current = true
        break
      case 'End':
        e.preventDefault()
        newIndex = modes.length - 1
        shouldFocusOnModeChange.current = true
        break
      default:
        return
    }

    onModeChange(modes[newIndex].mode)
  }

  return (
    <div
      ref={containerRef}
      className={styles.modeButtons}
      role="tablist"
      aria-label="Session mode selector"
    >
      <div ref={backgroundRef} className={styles.modeButtonBackground} />
      {modes.map((modeItem, index) => (
        <button
          key={modeItem.mode}
          ref={(el) => {
            buttonsRef.current[index] = el
          }}
          type="button"
          role="tab"
          id={`${modeItem.mode}-tab`}
          aria-selected={selectedMode === modeItem.mode}
          aria-controls={`${modeItem.mode}-panel`}
          tabIndex={selectedMode === modeItem.mode ? 0 : -1}
          className={`${styles.modeButton} ${
            selectedMode === modeItem.mode ? styles.modeButtonActive : ''
          }`}
          onClick={() => onModeChange(modeItem.mode)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {modeItem.icon}
          {modeItem.label}
        </button>
      ))}
    </div>
  )
}
