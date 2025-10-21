import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './InstallationEmpty.module.css'

type Props = {
  githubAppUrl?: string
  onContinueWithGitHub?: () => void
}

export const InstallationEmpty: FC<Props> = ({
  githubAppUrl,
  onContinueWithGitHub,
}) => {
  const handleContinue = () => {
    if (onContinueWithGitHub) {
      onContinueWithGitHub()
    } else if (githubAppUrl) {
      window.open(githubAppUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.illustration}>
        {/* GitHub Octocat illustration */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.octocatSvg}
        >
          <title>GitHub Octocat illustration</title>
          {/* Main Octocat body */}
          <circle cx="60" cy="60" r="45" fill="#24292e" />

          {/* Eyes */}
          <circle cx="48" cy="50" r="6" fill="white" />
          <circle cx="72" cy="50" r="6" fill="white" />
          <circle cx="48" cy="50" r="3" fill="#24292e" />
          <circle cx="72" cy="50" r="3" fill="#24292e" />

          {/* Mouth */}
          <path
            d="M50 70 Q60 80 70 70"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Tentacles */}
          <path d="M25 75 Q20 85 25 95 Q30 85 25 75" fill="#24292e" />
          <path d="M95 75 Q100 85 95 95 Q90 85 95 75" fill="#24292e" />

          {/* Stars around */}
          <circle cx="30" cy="30" r="2" fill="#f1c40f" />
          <circle cx="90" cy="35" r="1.5" fill="#f1c40f" />
          <circle cx="25" cy="55" r="1" fill="#f1c40f" />
          <circle cx="95" cy="65" r="1.5" fill="#f1c40f" />
        </svg>
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>
          Your GitHub account requires re-authentication to see your
          repositories.
        </h2>

        <Button
          size="lg"
          variant="solid-primary"
          onClick={handleContinue}
          className={styles.continueButton}
        >
          Continue with GitHub
        </Button>
      </div>
    </div>
  )
}
