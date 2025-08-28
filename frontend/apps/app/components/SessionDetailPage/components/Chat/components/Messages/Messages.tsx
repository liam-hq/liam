import { type BaseMessage, isAIMessage } from '@langchain/core/messages'
import type { FC } from 'react'
import { AiMessage } from './AiMessage'

type Props = {
  messages: BaseMessage[]
}

export const Messages: FC<Props> = ({ messages }) => {
  return messages.map((message) => {
    if (isAIMessage(message)) {
      return <AiMessage key={message.id} message={message} />
    }

    return null
  })
}
