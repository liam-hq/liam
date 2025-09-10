import type { AIMessage, ToolMessage } from '@langchain/core/messages'
import { extractReasoningFromMessage } from '@liam-hq/agent/client'
import type { FC } from 'react'
import { match } from 'ts-pattern'
import * as v from 'valibot'
import { MarkdownContent } from '../../../../../../MarkdownContent'
import {
  extractResponseFromMessage,
  extractToolCallsFromMessage,
} from '../../../../../utils'
import { CopyButton } from '../../../../CopyButton'
import markdownStyles from '../Markdown.module.css'
import { DBAgent, LeadAgent, PMAgent, QAAgent } from './AgentAvatar'
import styles from './AiMessage.module.css'
import { ReasoningMessage } from './ReasoningMessage'
import { ToolCalls } from './ToolCalls'

const agentRoleSchema = v.picklist(['db', 'pm', 'qa', 'lead'])

const getAgentInfo = (name: string | undefined) => {
  const parsed = v.safeParse(agentRoleSchema, name)
  if (!parsed.success) {
    return { avatar: <DBAgent />, name: 'DB Agent' }
  }

  return match(parsed.output)
    .with('db', () => ({
      avatar: <DBAgent />,
      name: 'DB Agent',
    }))
    .with('pm', () => ({ avatar: <PMAgent />, name: 'PM Agent' }))
    .with('qa', () => ({ avatar: <QAAgent />, name: 'QA Agent' }))
    .with('lead', () => ({ avatar: <LeadAgent />, name: 'Lead Agent' }))
    .exhaustive()
}

type Props = {
  message: AIMessage
  toolMessages: ToolMessage[]
}

export const AiMessage: FC<Props> = ({ message, toolMessages }) => {
  const { avatar, name } = getAgentInfo(message.name)
  const messageContentString = extractResponseFromMessage(message)
  const reasoningText = extractReasoningFromMessage(message)
  const toolCalls = extractToolCallsFromMessage(message)

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatarContainer}>
        {avatar}
        <span className={styles.agentName}>{name}</span>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.messagesWrapper}>
          {reasoningText && <ReasoningMessage content={reasoningText} />}
          {messageContentString !== '' && (
            <div className={styles.responseMessageWrapper}>
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
          )}
          <ToolCalls toolCalls={toolCalls} toolMessages={toolMessages} />
        </div>
      </div>
    </div>
  )
}
