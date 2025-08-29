import type { HumanMessage as HumanMessageType } from '@langchain/core/messages'
import type { FC } from 'react'
import { CopyButton } from '@/components/SessionDetailPage/components/CopyButton'
import { getContentString } from '../utils/getContentString'
import styles from './HumanMessage.module.css'

type Props = {
  message: HumanMessageType
}

export const HumanMessage: FC<Props> = ({ message }) => {
  const messageContent = getContentString(message.content)

  return (
    <div className={styles.wrapper}>
      <div className={styles.messageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.messageContent}>{messageContent}</div>
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