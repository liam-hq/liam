import clsx from 'clsx'
import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import type React from 'react'
import './globals.css'
import { ToastProvider } from '@liam-hq/ui'
import { GoogleTagManager } from '@next/third-parties/google'
import { GTM_ID, GTMConsent, GtagScript } from '@/libs/gtm'

const inter = Inter({
  subsets: ['latin'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--message-font',
})

const imageUrl = '/assets/liam_erd.png'

export const metadata: Metadata = {
  title: 'Liam ERD',
  description:
    'Automatically generates beautiful and easy-to-read ER diagrams from your database.',
  openGraph: {
    siteName: 'Liam',
    type: 'website',
    locale: 'en_US',
    images: imageUrl,
  },
  twitter: {},
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <GoogleTagManager
        gtmId={GTM_ID}
        dataLayer={{ appEnv: process.env.NEXT_PUBLIC_ENV_NAME ?? '' }}
      />
      <GtagScript />
      <GTMConsent />
      <body className={clsx(inter.className, montserrat.variable)}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
