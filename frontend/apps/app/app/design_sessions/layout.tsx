import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { CommonLayout } from '../../components/CommonLayout'
import { RemountOnRefresh } from './RemountOnRefresh'

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <Suspense fallback={<CommonLayout>{children}</CommonLayout>}>
      <RemountOnRefresh>
        <CommonLayout>{children}</CommonLayout>
      </RemountOnRefresh>
    </Suspense>
  )
}
