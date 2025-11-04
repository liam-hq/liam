'use client'

import { useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'

export function RemountOnRefresh({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const refresh = searchParams.get('refresh') || ''
  return <div key={refresh}>{children}</div>
}
