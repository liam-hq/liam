'use client'

import clsx from 'clsx'
import Link from 'next/link'

import type { FC, ReactNode } from 'react'
import itemStyles from '../Item.module.css'

type Props = {
  href: string
  icon: ReactNode
  label: string
  isExpanded?: boolean
}

export const LinkItem: FC<Props> = ({
  href,
  icon,
  label,
  isExpanded = false,
}) => {
  return (
    <Link
      href={href}
      className={clsx(itemStyles.item, isExpanded && itemStyles.expandItem)}
    >
      <div className={itemStyles.iconContainer}>{icon}</div>
      <div
        className={clsx(
          itemStyles.labelArea,
          isExpanded && itemStyles.expandLabelArea,
        )}
      >
        <span className={itemStyles.label}>{label}</span>
      </div>
    </Link>
  )
}
