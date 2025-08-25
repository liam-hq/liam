import type { Message } from '@langchain/langgraph-sdk'
import type { FC } from 'react'
import { AiMessage } from './AiMessage'
import { isAiMessage } from './utils/messageTypeGuards'

type Props = {
  messages: Message[]
}

export const Messages: FC<Props> = ({ messages }) => {
  return messages.map((message) => {
    if (isAiMessage(message)) {
      return <AiMessage key={message.id} message={message} />
    }

    return null
  })
}
