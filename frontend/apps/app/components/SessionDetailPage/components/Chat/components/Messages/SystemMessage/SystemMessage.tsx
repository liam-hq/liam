import type { BaseMessage } from '@langchain/core/messages'
import clsx from 'clsx'
import type { FC } from 'react'
import { MarkdownContent } from '../../../../../../MarkdownContent'
import { CopyButton } from '../../../../CopyButton'
import markdownStyles from '../Markdown.module.css'
import styles from './SystemMessage.module.css'

type Props = {
  message: BaseMessage
}

export const SystemMessage: FC<Props> = ({ message }) => {
  const messageContent =
    typeof message.content === 'string' ? message.content : ''

  // Get message type from additional_kwargs for styling
  const messageType = message.additional_kwargs?.messageType
  const isErrorMessage = messageType === 'error'
  const isSuccessMessage = messageType === 'success'
  const isInfoMessage = messageType === 'info'

  return (
    <div
      className={clsx(styles.wrapper, {
        [styles.errorMessage]: isErrorMessage,
        [styles.successMessage]: isSuccessMessage,
        [styles.infoMessage]: isInfoMessage,
      })}
    >
      <div className={styles.headerContainer}>
        <div className={styles.systemIcon}>⚙️</div>
        <span className={styles.systemLabel}>System</span>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.messageWrapper}>
          <div className={markdownStyles.markdownWrapper}>
            <MarkdownContent content={messageContent} />
          </div>
          <div className={styles.copyButtonWrapper}>
            <CopyButton
              textToCopy={messageContent}
              tooltipLabel="Copy message"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
