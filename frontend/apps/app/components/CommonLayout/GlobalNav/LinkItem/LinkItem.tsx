import Link from 'next/link'
import type { FC, ReactNode } from 'react'
import itemStyles from '../Item.module.css'

type Props = {
  href: string
  icon: ReactNode
  label: string
}

export const LinkItem: FC<Props> = ({ href, icon, label }) => {
  return (
    <Link href={href} className={itemStyles.item}>
      <div className={itemStyles.iconContainer}>{icon}</div>
      <div className={itemStyles.labelArea}>
        <span className={itemStyles.label}>{label}</span>
      </div>
    </Link>
  )
}
