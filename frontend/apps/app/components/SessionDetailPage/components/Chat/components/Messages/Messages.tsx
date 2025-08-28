import {
  type BaseMessage,
  isAIMessage,
  isHumanMessage,
} from '@langchain/core/messages'
import type { FC } from 'react'
import { AiMessage } from './AiMessage'
import { HumanMessage } from './HumanMessage'

type Props = {
  messages: BaseMessage[]
}

export const Messages: FC<Props> = ({ messages }) => {
  return messages.map((message) => {
    if (isAIMessage(message)) {
      return <AiMessage key={message.id} message={message} />
    }

    if (isHumanMessage(message)) {
      return <HumanMessage key={message.id} message={message} />
    }

    return null
  })
}
