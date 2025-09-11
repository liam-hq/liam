import {
  type BaseMessage,
  isAIMessage,
  isChatMessage,
  isHumanMessage,
  isToolMessage,
} from '@langchain/core/messages'
import type { FC } from 'react'
import { AiMessage } from './AiMessage'
import { ChatMessage as ChatMessageComponent } from './ChatMessage/ChatMessage'
import { HumanMessage } from './HumanMessage'

type Props = {
  messages: BaseMessage[]
}

export const Messages: FC<Props> = ({ messages }) => {
  const toolMessages = messages.filter(isToolMessage)

  return messages.map((message) => {
    if (isAIMessage(message)) {
      return (
        <AiMessage
          key={message.id}
          message={message}
          toolMessages={toolMessages}
        />
      )
    }

    if (isChatMessage(message)) {
      return <ChatMessageComponent key={message.id} message={message} />
    }

    if (isHumanMessage(message)) {
      return <HumanMessage key={message.id} message={message} />
    }
    return null
  })
}
