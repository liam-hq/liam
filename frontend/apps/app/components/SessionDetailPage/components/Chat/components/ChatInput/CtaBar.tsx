import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './CtaBar.module.css'

type Props = {
  onSignUpClick: () => void
}

export const CtaBar: FC<Props> = ({ onSignUpClick }) => {
  return (
    <div className={styles.ctaBar}>
      <span className={styles.ctaText}>Sign up to use Liam DB</span>
      <Button
        type="button"
        variant="solid-inverse"
        size="sm"
        className={styles.ctaButton}
        onClick={onSignUpClick}
      >
        Sign up
      </Button>
    </div>
  )
}
