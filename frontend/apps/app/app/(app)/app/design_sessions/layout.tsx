import type { ReactNode } from 'react'
import { CommonLayout } from '@/components/CommonLayout'

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <CommonLayout>{children}</CommonLayout>
}
