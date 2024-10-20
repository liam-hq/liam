import { ChevronRight } from '@/components'
import Link from 'next/link'
import type { FC } from 'react'
import styles from './MoreLink.module.css'

type Props = {
  href: string
}

export const MoreLink: FC<Props> = ({ href }) => {
  return (
    <Link href={href} className={styles.moreLink}>
      See more articles
      <span className={styles.chevronRight}>
        <ChevronRight />
      </span>
    </Link>
  )
}
