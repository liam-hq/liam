import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ChatInput.module.css'

type Props = {
  onSignUpClick: () => void
}

export const CtaBar: FC<Props> = ({ onSignUpClick }) => {
  return (
    <div className={styles.ctaBar}>
      <span className={styles.ctaText}>Sign up to use Liam</span>
      <Button
        type="button"
        variant="solid-primary"
        size="sm"
        className={styles.ctaButton}
        onClick={onSignUpClick}
      >
        Sign up
      </Button>
    </div>
  )
}
