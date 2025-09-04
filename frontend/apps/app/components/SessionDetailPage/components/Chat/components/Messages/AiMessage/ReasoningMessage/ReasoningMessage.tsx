import type { FC } from 'react'
import { MarkdownContent } from '../../../../../../../MarkdownContent'
import styles from './ReasoningMessage.module.css'

type Props = {
  content: string
}

export const ReasoningMessage: FC<Props> = ({ content }) => {
  return (
    <div className={styles.content}>
      <MarkdownContent content={content} />
    </div>
  )
}
