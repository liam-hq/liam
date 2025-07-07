'use client'

import { type FC, useEffect } from 'react'
import { GTM_CONSENT_MODE_KEY } from './constants'

export const GTMConsent: FC = () => {
  useEffect(() => {
    const consentMode = localStorage.getItem(GTM_CONSENT_MODE_KEY)
    if (consentMode === null) {
      window.gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied',
        functionality_storage: 'denied',
        security_storage: 'denied',
      })
    } else {
      window.gtag('consent', 'default', JSON.parse(consentMode))
    }
  }, [])

  return null
}
