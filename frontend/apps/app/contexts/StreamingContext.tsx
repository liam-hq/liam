'use client'

import type { BaseMessage } from '@langchain/core/messages'
import type { AnalyzedRequirements } from '@liam-hq/agent/client'
import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from 'react'

type StreamingSession = {
  designSessionId: string
  messages: BaseMessage[]
  analyzedRequirements: AnalyzedRequirements | null
  isStreaming: boolean
  error: string | null
  abortController: AbortController | null
}

type StreamingContextType = {
  sessions: Map<string, StreamingSession>
  getSession: (designSessionId: string) => StreamingSession | undefined
  updateSession: (
    designSessionId: string,
    updates: Partial<StreamingSession>,
  ) => void
  createSession: (
    designSessionId: string,
    initialMessages: BaseMessage[],
    initialAnalyzedRequirements?: AnalyzedRequirements | null,
  ) => void
  deleteSession: (designSessionId: string) => void
}

const StreamingContext = createContext<StreamingContextType | null>(null)

export const useStreamingContext = () => {
  const context = useContext(StreamingContext)
  if (!context) {
    console.error('useStreamingContext must be used within StreamingProvider')
    return {
      sessions: new Map(),
      getSession: () => undefined,
      updateSession: () => {},
      createSession: () => {},
      deleteSession: () => {},
    }
  }
  return context
}

type StreamingProviderProps = {
  children: ReactNode
}

export const StreamingProvider = ({ children }: StreamingProviderProps) => {
  const sessionsRef = useRef<Map<string, StreamingSession>>(new Map())
  const [, forceUpdate] = useState({})

  const getSession = (designSessionId: string) => {
    return sessionsRef.current.get(designSessionId)
  }

  const updateSession = (
    designSessionId: string,
    updates: Partial<StreamingSession>,
  ) => {
    const session = sessionsRef.current.get(designSessionId)
    if (session) {
      sessionsRef.current.set(designSessionId, {
        ...session,
        ...updates,
      })
      forceUpdate({})
    }
  }

  const createSession = (
    designSessionId: string,
    initialMessages: BaseMessage[],
    initialAnalyzedRequirements: AnalyzedRequirements | null = null,
  ) => {
    if (!sessionsRef.current.has(designSessionId)) {
      sessionsRef.current.set(designSessionId, {
        designSessionId,
        messages: initialMessages,
        analyzedRequirements: initialAnalyzedRequirements,
        isStreaming: false,
        error: null,
        abortController: null,
      })
      forceUpdate({})
    }
  }

  const deleteSession = (designSessionId: string) => {
    sessionsRef.current.delete(designSessionId)
    forceUpdate({})
  }

  return (
    <StreamingContext.Provider
      value={{
        sessions: sessionsRef.current,
        getSession,
        updateSession,
        createSession,
        deleteSession,
      }}
    >
      {children}
    </StreamingContext.Provider>
  )
}
