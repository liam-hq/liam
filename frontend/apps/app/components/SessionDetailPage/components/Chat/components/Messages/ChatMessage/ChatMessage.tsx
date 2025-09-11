import type { ChatMessage as ChatMessageType } from '@langchain/core/messages'
import clsx from 'clsx'
import type { FC } from 'react'
import { MarkdownContent } from '../../../../../../MarkdownContent'
import { extractResponseFromMessage } from '../../../../../utils'
import { CopyButton } from '../../../../CopyButton'
import markdownStyles from '../Markdown.module.css'
import styles from './ChatMessage.module.css'

type Props = {
  message: ChatMessageType
}

export const ChatMessage: FC<Props> = ({ message }) => {
  const messageContentString = extractResponseFromMessage(message)
  const messageType = message.additional_kwargs?.messageType
  const isErrorMessage = messageType === 'error'
  const isSuccessMessage = messageType === 'success'
  const isInfoMessage = messageType === 'info'

  return (
    <div
      className={clsx(styles.notificationWrapper, {
        [styles.errorMessage]: isErrorMessage,
        [styles.successMessage]: isSuccessMessage,
        [styles.infoMessage]: isInfoMessage,
      })}
    >
      <div className={styles.notificationHeaderContainer}>
        <div className={styles.notificationIcon}>ℹ️</div>
        <span className={styles.notificationLabel}>Notification</span>
      </div>
      <div className={styles.notificationContentContainer}>
        <div className={styles.notificationMessageWrapper}>
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
