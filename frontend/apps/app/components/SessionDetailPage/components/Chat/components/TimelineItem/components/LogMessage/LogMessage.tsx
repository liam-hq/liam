import type { FC } from 'react'
import { MarkdownContent } from '@/components/MarkdownContent'
import styles from './LogMessage.module.css'

type Props = {
  content: string
}

export const LogMessage: FC<Props> = ({ content }) => {
  return (
    <div className={styles.content}>
      <MarkdownContent content={content} />
    </div>
  )
}
