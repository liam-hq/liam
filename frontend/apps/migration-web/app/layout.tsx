import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Liam Migration',
  description: 'Liam Migration',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
