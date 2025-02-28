import type { FC } from 'react'
import { Button } from '../Button'
import styles from './CookieConsent.module.css'

type Props = {
  open: boolean
  onClickAccept: () => void
  onClickDeny: () => void
}

export const CookieConsent: FC<Props> = ({
  open,
  onClickAccept,
  onClickDeny,
}) => {
  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h4 className={styles.title}>Liam ERD Cookie Consent</h4>
        <div>
          <p className={styles.description}>
            By clicking “Accept All Cookies”, you agree to the storing of
            cookies on your device to enhance site navigation, analyze site
            usage, and assist in our marketing efforts.
          </p>
          <a href="/legal/privacy" className={styles.link}>
            Privacy Policy
          </a>
        </div>
      </div>
      <div className={styles.controls}>
        <Button
          variant="outline-secondary"
          className={styles.button}
          onClick={onClickDeny}
        >
          Reject All Cookies
        </Button>
        <Button
          variant="solid-primary"
          className={styles.button}
          onClick={onClickAccept}
        >
          Accept
        </Button>
      </div>
    </div>
  )
}
