import clsx from 'clsx'
import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import { ToastProvider } from '@liam-hq/ui'
import { CookieConsent } from '../components/CookieConsent'

const inter = Inter({
  subsets: ['latin'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--message-font',
})

const imageUrl = '/assets/liam_erd.png'

export const metadata: Metadata = {
  title: 'Liam DB',
  description:
    'Build and manage your database schemas with Liam DB. Create, visualize, and collaborate on database designs.',
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
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, montserrat.variable)}>
        <ToastProvider>
          <CookieConsent />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
