import type { HumanMessage as HumanMessageType } from '@langchain/core/messages'
import { Avatar } from '@liam-hq/ui'
import type { FC } from 'react'
import * as v from 'valibot'
import { MarkdownContent } from '../../../../../../MarkdownContent'
import { CopyButton } from '../../../../CopyButton'
import markdownStyles from '../Markdown.module.css'
import { extractResponseFromMessage } from '../utils/extractResponseFromMessage'
import styles from './HumanMessage.module.css'

const additionalKwargsSchema = v.object({
  userName: v.optional(v.string()),
})

type Props = {
  message: HumanMessageType
}

export const HumanMessage: FC<Props> = ({ message }) => {
  const parsedAdditonalKwargs = v.safeParse(
    additionalKwargsSchema,
    message.additional_kwargs,
  )
  if (
    !parsedAdditonalKwargs.success ||
    parsedAdditonalKwargs.output.userName === undefined
  ) {
    return null
  }

  const userName = parsedAdditonalKwargs.output.userName
  const userInitial =
    userName
      ?.split(/\s+/)
      .filter(Boolean)
      .map((name) => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  const content = extractResponseFromMessage(message)

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        {/* TODO: Make user param value configurable based on the sender */}
        <Avatar initial={userInitial} size="sm" user="you" />
        <span className={styles.userName}>{userName || 'User Name'}</span>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.messageWrapper}>
          <div className={styles.messageContent}>
            <div className={markdownStyles.markdownWrapper}>
              <MarkdownContent content={content} />
            </div>
          </div>
          <div className={styles.copyButtonWrapper}>
            <CopyButton
              textToCopy={content}
              tooltipLabel="Copy message"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
