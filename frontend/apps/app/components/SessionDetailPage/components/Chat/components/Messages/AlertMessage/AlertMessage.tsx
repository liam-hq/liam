import type { AIMessage } from '@langchain/core/messages'
import clsx from 'clsx'
import type { FC } from 'react'
import { MarkdownContent } from '../../../../../../MarkdownContent'
import { CopyButton } from '../../../../CopyButton'
import markdownStyles from '../Markdown.module.css'
import styles from './AlertMessage.module.css'

type Props = {
  message: AIMessage
}

export const AlertMessage: FC<Props> = ({ message }) => {
  const messageContentString = message.text

  return (
    <div
      className={clsx(styles.alertWrapper, styles.errorMessage)}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.alertHeaderContainer}>
        <div className={styles.alertIcon} aria-hidden="true">
          ❌
        </div>
        <span className={clsx(styles.alertLabel, styles.errorMessageLabel)}>
          Error
        </span>
      </div>
      <div className={styles.alertContentContainer}>
        <div className={styles.alertMessageWrapper}>
          <div className={markdownStyles.markdownWrapper}>
            <MarkdownContent content={messageContentString} />
          </div>
          <div className={styles.copyButtonWrapper}>
            <CopyButton
              textToCopy={messageContentString}
              tooltipLabel="Copy message"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
