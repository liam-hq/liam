'use client'

import { useStream } from '@langchain/langgraph-sdk/react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { StreamChat } from './StreamChat'

type Props = {
  designSessionId: string
}

const StreamComponent: FC<{ apiUrl: string; designSessionId: string }> = ({ 
  apiUrl, 
  designSessionId 
}) => {
  const {
    messages,
    isLoading,
    error,
    submit,
    stop,
    interrupt,
    joinStream,
  } = useStream({
    apiUrl,
    assistantId: 'liam-agent',
    threadId: designSessionId,
    messagesKey: 'messages',
  })

  // Debug logging
  useEffect(() => {
    console.log('Stream messages:', messages)
    console.log('Stream messages length:', messages.length)
    if (messages.length > 0) {
      console.log('First message:', messages[0])
      console.log('Last message:', messages[messages.length - 1])
    }
    console.log('Stream isLoading:', isLoading)
    console.log('Stream error:', error)
  }, [messages, isLoading, error])

  const handleRetry = useCallback(() => {
    if (interrupt) {
      joinStream()
    }
  }, [interrupt, joinStream])

  const handleStop = useCallback(() => {
    if (isLoading) {
      stop()
    }
  }, [isLoading, stop])

  const handleClearMessages = useCallback(() => {
    // For now, we'll just refresh the page to clear messages
    window.location.reload()
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      await submit({
        input: {
          messages: [
            {
              type: 'human',
              content,
            },
          ],
        },
      })
    },
    [submit],
  )

  return (
    <StreamChat
      messages={messages}
      input=""
      onInputChange={() => {}}
      onSubmit={(e) => e.preventDefault()}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      error={error}
      onRetry={handleRetry}
      onStop={handleStop}
      onClear={handleClearMessages}
      threadId={designSessionId}
      designSessionId={designSessionId}
    />
  )
}

export const StreamPocClient: FC<Props> = ({ designSessionId }) => {
  const [apiUrl, setApiUrl] = useState<string>('')

  useEffect(() => {
    // Set the API URL on the client side to avoid hydration issues
    const protocol = window.location.protocol
    const host = window.location.host
    // Set the base API URL for LangGraph SDK
    setApiUrl(`${protocol}//${host}/api/stream`)
  }, [])

  // Only render the stream component when we have the API URL
  if (!apiUrl) {
    return <div>Loading...</div>
  }

  return <StreamComponent apiUrl={apiUrl} designSessionId={designSessionId} />
}