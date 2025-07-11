import clsx from 'clsx'
import type { FC } from 'react'
import styles from './SeverityBadge.module.css'

type SeverityLevel = 'High' | 'Medium' | 'Low'

type Props = {
  level: SeverityLevel
}

const severityClassMap: Record<SeverityLevel, string> = {
  High: styles.high,
  Medium: styles.medium,
  Low: styles.low,
}

export const SeverityBadge: FC<Props> = ({ level }) => {
  return (
    <div className={clsx(styles.badge, severityClassMap[level])}>
      <span>{level}</span>
    </div>
  )
}
