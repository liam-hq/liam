import { GithubLogo, Link, Upload } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './SessionModeSelector.module.css'

export type SessionMode = 'github' | 'upload' | 'url'

type Props = {
  selectedMode: SessionMode
  onModeChange: (mode: SessionMode) => void
}

export const SessionModeSelector: FC<Props> = ({
  selectedMode,
  onModeChange,
}) => {
  return (
    <div className={styles.modeButtons}>
      <button
        type="button"
        className={`${styles.modeButton} ${selectedMode === 'github' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('github')}
      >
        <GithubLogo className={styles.modeButtonIcon} />
        Import Schema from GitHub
      </button>
      <button
        type="button"
        className={`${styles.modeButton} ${selectedMode === 'upload' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('upload')}
      >
        <Upload size={16} className={styles.modeButtonIcon} />
        Start from Upload
      </button>
      <button
        type="button"
        className={`${styles.modeButton} ${selectedMode === 'url' ? styles.modeButtonActive : ''}`}
        onClick={() => onModeChange('url')}
      >
        <Link size={16} className={styles.modeButtonIcon} />
        Use Existing Schema (URL)
      </button>
    </div>
  )
}
