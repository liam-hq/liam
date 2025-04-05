'use client'

import { source } from '@/lib/source'
import { findNeighbour } from 'fumadocs-core/server'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { FC } from 'react'
import { linkStyle, itemLabelStyle } from "./FooterNavi.style"

export const FooterNavi: FC = () => {
  const pathname = usePathname()
  const neighbours = findNeighbour(source.pageTree, pathname)

  return (
    <div className="grid grid-cols-2 gap-4 pb-6">
      {neighbours.previous && (
        <Link href={neighbours.previous.url} className={linkStyle()}>
          <div className={itemLabelStyle()}>
            <ChevronLeft className="-ms-1 size-4 shrink-0 rtl:rotate-180" />
            <p>Previous</p>
          </div>
          <p>{neighbours.previous.name}</p>
        </Link>
      )}
      {neighbours.next && (
        <Link
          href={neighbours.next.url}
          className={linkStyle({ direction: 'next' })}
        >
          <div className={itemLabelStyle({ direction: 'next' })}>
            <ChevronRight className="-me-1 size-4 shrink-0 rtl:rotate-180" />
            <p>Next</p>
          </div>
          <p>{neighbours.next.name}</p>
        </Link>
      )}
    </div>
  )
}
