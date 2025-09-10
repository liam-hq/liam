import {
  type BaseMessage,
  isAIMessage,
  isHumanMessage,
  isSystemMessage,
  isToolMessage,
} from '@langchain/core/messages'
import type { FC } from 'react'
import { AiMessage } from './AiMessage'
import { HumanMessage } from './HumanMessage'
import { SystemMessage } from './SystemMessage'

type Props = {
  messages: BaseMessage[]
}

export const Messages: FC<Props> = ({ messages }) => {
  const toolMessages = messages.filter(isToolMessage)

  return messages.map((message, index) => {
    // Use index as fallback key if message.id is not available
    const messageKey = message.id || `message-${index}`

    if (isAIMessage(message)) {
      return (
        <AiMessage
          key={messageKey}
          message={message}
          toolMessages={toolMessages}
        />
      )
    }

    if (isHumanMessage(message)) {
      return <HumanMessage key={messageKey} message={message} />
    }

    if (isSystemMessage(message)) {
      return <SystemMessage key={messageKey} message={message} />
    }

    return null
  })
}
