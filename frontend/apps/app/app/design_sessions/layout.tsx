import type { ReactNode } from 'react'
import { CommonLayout } from '../../components/CommonLayout'

export default async function Layout({
  children,
  searchParams,
}: Readonly<{
  children: ReactNode
  searchParams: Promise<{ refresh?: string }>
}>) {
  const params = await searchParams
  const refreshKey = params.refresh

  return <CommonLayout key={refreshKey}>{children}</CommonLayout>
}
