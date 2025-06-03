import type { LayoutProps } from '@/app/types'
import { CommonLayout } from '@/components/CommonLayout'

export default async function Layout({ children }: LayoutProps) {
  return <CommonLayout>{children}</CommonLayout>
}
