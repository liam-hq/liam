'use client'

import { Button } from '@liam-hq/ui'
import { add, getTime, isAfter } from 'date-fns'
import { type FC, useCallback, useEffect, useState } from 'react'
import { GTM_CONSENT_MODE_KEY, updateConsent } from '@/libs/gtm'
import styles from './CookieConsent.module.css'

const COOKIE_CONSENT_EXPIRE_KEY = 'cookieConsentExpire'

export const CookieConsent: FC = () => {
  const [open, setOpen] = useState(false)

  const handleClickAccept = useCallback(() => {
    const now = new Date()
    const expire = getTime(add(now, { years: 1 }))

    updateConsent('granted')
    localStorage.setItem(COOKIE_CONSENT_EXPIRE_KEY, `${expire}`)
    setOpen(false)
  }, [])

  const handleClickDeny = useCallback(() => {
    const now = new Date()
    const expire = getTime(add(now, { years: 1 }))

    updateConsent('denied')
    localStorage.setItem(COOKIE_CONSENT_EXPIRE_KEY, `${expire}`)
    setOpen(false)
  }, [])

  // NOTE: Display if unanswered or 1 year have passed since the last answer.
  useEffect(() => {
    const consentMode = localStorage.getItem(GTM_CONSENT_MODE_KEY)
    const expire = Number(localStorage.getItem(COOKIE_CONSENT_EXPIRE_KEY))

    if (!consentMode) {
      setOpen(true)
      return
    }

    const now = new Date()
    const expireDate = new Date(expire)

    if (isAfter(now, expireDate)) {
      setOpen(true)
      return
    }
  }, [])

  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <h4 className={styles.title}>Liam Cookie Consent</h4>
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
          onClick={handleClickDeny}
        >
          Reject All Cookies
        </Button>
        <Button
          variant="solid-primary"
          className={styles.button}
          onClick={handleClickAccept}
        >
          Accept All Cookies
        </Button>
      </div>
    </div>
  )
}
