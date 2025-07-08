import { ArrowUpRight } from '@liam-hq/ui'
import type React from 'react'
import type { FC } from 'react'
import type { FormatType } from '../../../../../components/FormatIcon/FormatIcon'
import { FormatIcon } from '../../../../../components/FormatIcon/FormatIcon'
import styles from './SchemaLink.module.css'

type Props = {
  schemaName: string
  format: FormatType
  href: string
  onClick?: () => void
}

export const SchemaLink: FC<Props> = ({
  schemaName,
  format,
  href,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <a
      href={href}
      className={styles.schemaLink}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${schemaName} schema (opens in new tab)`}
      tabIndex={0}
    >
      <FormatIcon format={format} size={16} />
      <span className={styles.schemaName}>{schemaName}</span>
      <ArrowUpRight className={styles.arrowIcon} />
    </a>
  )
}
