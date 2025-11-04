import type { ReactNode } from 'react'
import { CommonLayout } from '../../components/CommonLayout'
import { RemountOnRefresh } from './RemountOnRefresh'

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <RemountOnRefresh>
      <CommonLayout>{children}</CommonLayout>
    </RemountOnRefresh>
  )
}
