import { GoogleTagManager } from '@next/third-parties/google'
import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import { Footer, Header } from '@/components'
import type { Lang } from '@/features/i18n'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Liam',
  description: 'Liam blog',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
  params: { lang },
}: Readonly<{
  children: ReactNode
  params: {
    lang: Lang
  }
}>) {
  return (
    <html lang={lang}>
      <GoogleTagManager gtmId="GTM-5R7SGLCC" />
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
