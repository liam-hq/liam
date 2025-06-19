'use client'

import { add, getTime, isAfter } from 'date-fns'
import { Banner } from '@/components'
import './global.css'
import { CookieConsent } from '@liam-hq/ui'
import { GoogleTagManager } from '@next/third-parties/google'
import { RootProvider } from 'fumadocs-ui/provider'
import { Inter } from 'next/font/google'
import { type ReactNode, useCallback, useEffect, useId, useState } from 'react'
import {
  GTM_CONSENT_MODE_KEY,
  GTM_ID,
  GTMConsent,
  GtagScript,
  updateConsent,
} from '@/lib/gtm'

const COOKIE_CONSENT_EXPIRE_KEY = 'cookieConsentExpire'

const inter = Inter({
  subsets: ['latin'],
})

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const bannerId = useId()

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

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <GoogleTagManager
        gtmId={GTM_ID}
        dataLayer={{ appEnv: process.env.NEXT_PUBLIC_ENV_NAME ?? '' }}
      />
      <GtagScript />
      <GTMConsent />
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{
            options: {
              api: '/docs/api/search',
            },
          }}
        >
          <Banner
            id={bannerId}
            variant="dark"
            link="https://liambx.com/blog/liam-erd-introduction"
          >
            {"We're launched Liam ERD!"}
          </Banner>
          {children}
        </RootProvider>
        <CookieConsent
          open={open}
          onClickAccept={handleClickAccept}
          onClickDeny={handleClickDeny}
        />
      </body>
    </html>
  )
}
