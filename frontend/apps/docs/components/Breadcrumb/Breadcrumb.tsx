'use client'

import { source } from '@/lib/source'
import { useBreadcrumb } from 'fumadocs-core/breadcrumb'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type FC, Fragment } from 'react'
import { textStyle } from "./Breadcrumb.style"

const textClassName = textStyle()

export const Breadcrumb: FC = () => {
  const pathname = usePathname()
  const items = useBreadcrumb(pathname, source.pageTree)

  if (items.length === 0) return null

  return (
    <div className="-mb-3 flex flex-row items-center gap-1 text-sm font-medium text-fd-muted-foreground">
      {items.map((item, i) => (
        <Fragment key={item.url}>
          {i !== 0 && (
            <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
          )}
          {item.url ? (
            <Link href={item.url} className={textClassName}>
              {item.name}
            </Link>
          ) : (
            <span className={textClassName}>{item.name}</span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
