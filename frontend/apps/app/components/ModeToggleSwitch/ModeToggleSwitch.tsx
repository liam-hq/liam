import type React from 'react'
import { useRef, useState } from 'react'
import styles from './ModeToggleSwitch.module.css'

type Mode = 'ask' | 'build'

interface ModeToggleSwitchProps {
  value?: Mode
  onChange?: (mode: Mode) => void
  className?: string
}

export const ModeToggleSwitch: React.FC<ModeToggleSwitchProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [internalMode, setInternalMode] = useState<Mode>('ask')
  const mode = value ?? internalMode

  const handleClick = (newMode: Mode) => {
    if (!value) setInternalMode(newMode)
    onChange?.(newMode)
  }

  // For keyboard navigation (left/right arrow)
  const askRef = useRef<HTMLButtonElement>(null)
  const buildRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    current: 'ask' | 'build',
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(current)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (current === 'ask' && e.key === 'ArrowRight') {
        buildRef.current?.focus()
      } else if (current === 'build' && e.key === 'ArrowLeft') {
        askRef.current?.focus()
      }
    }
  }

  return (
    <fieldset className={`${styles.root} ${className}`}>
      <legend className={styles.legend}>Mode selection</legend>
      <button
        ref={askRef}
        type="button"
        className={`${styles.segment} ${mode === 'ask' ? styles.active : ''}`}
        aria-pressed={mode === 'ask'}
        tabIndex={0}
        aria-label="Ask mode"
        aria-describedby="mode-desc"
        onClick={() => handleClick('ask')}
        onKeyDown={(e) => handleKeyDown(e, 'ask')}
      >
        Ask
      </button>
      <button
        ref={buildRef}
        type="button"
        className={`${styles.segment} ${mode === 'build' ? styles.active : ''}`}
        aria-pressed={mode === 'build'}
        tabIndex={0}
        aria-label="Build mode"
        aria-describedby="mode-desc"
        onClick={() => handleClick('build')}
        onKeyDown={(e) => handleKeyDown(e, 'build')}
      >
        Build
      </button>
      <span id="mode-desc" className={styles.legend}>
        Use Tab or Left/Right arrow keys to move, and Enter or Space to select
        mode.
      </span>
    </fieldset>
  )
}
