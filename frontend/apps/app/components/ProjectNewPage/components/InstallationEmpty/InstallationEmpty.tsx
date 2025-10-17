import { Button, GithubLogo } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './InstallationEmpty.module.css'
import { JackAndOctCat } from './JackAndOctCat'

type Props = {
  githubAppUrl?: string
}

export const InstallationEmpty: FC<Props> = ({ githubAppUrl }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <JackAndOctCat className={styles.illustration} />
        <p className={styles.message}>
          Your GitHub account requires re-authentication to see your
          repositories.
        </p>
        <Button
          size="lg"
          variant="solid-primary"
          leftIcon={<GithubLogo />}
          onClick={() => {
            if (githubAppUrl) {
              window.open(githubAppUrl, '_blank', 'noopener,noreferrer')
            }
          }}
        >
          Continue with GitHub
        </Button>
      </div>
    </div>
  )
}
