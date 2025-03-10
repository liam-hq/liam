import { CommonLayout } from '@/components/CommonLayout'
import type { ReactNode } from 'react'
import '@/styles/globals.css'

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <CommonLayout>{children}</CommonLayout>
}
