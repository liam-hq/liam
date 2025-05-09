import { useState, useCallback } from 'react'

export interface Message {
  id: string
  content: string
  sender: 'human' | 'ai' | 'system'
  timestamp: Date
  versionId?: string
  threadId?: string
  parentId?: string
  hasThread?: boolean
  threadRepliesCount?: number
  entityId?: string
}

export interface Thread {
  id: string
  parentMessageId: string
  messages: Message[]
  entityId?: string
  position?: { x: number; y: number }
}

export const useERDChat = () => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')

  // Thread state
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadInputValue, setThreadInputValue] = useState('')

  // Handle sending a message in main chat
  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() === '') return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'human',
      timestamp: new Date(),
      hasThread: false,
      threadRepliesCount: 0,
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue('')

    // TODO: Implement actual API call instead of simulated response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I've analyzed your ER diagram. Would you like me to suggest any improvements?",
        sender: 'ai',
        timestamp: new Date(),
        hasThread: false,
        threadRepliesCount: 0,
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }, [inputValue])

  // Start a new thread from a message
  const startThread = useCallback((messageId: string) => {
    const parentMessage = messages.find((m) => m.id === messageId)
    if (!parentMessage) return

    // Create a new thread
    const threadId = `thread-${Date.now()}`
    const newThread: Thread = {
      id: threadId,
      parentMessageId: messageId,
      messages: [],
      entityId: parentMessage.entityId,
    }

    // Update the parent message to indicate it has a thread
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, hasThread: true, threadId, threadRepliesCount: 0 } : m)),
    )

    setThreads((prev) => [...prev, newThread])
    setActiveThreadId(threadId)
  }, [messages])

  // Send a reply in a thread
  const sendThreadReply = useCallback((threadId: string) => {
    if (threadInputValue.trim() === '' || !threadId) return

    const thread = threads.find((t) => t.id === threadId)
    if (!thread) return

    const newReply: Message = {
      id: Date.now().toString(),
      content: threadInputValue,
      sender: 'human',
      timestamp: new Date(),
      threadId,
      parentId: thread.parentMessageId,
      entityId: thread.entityId,
    }

    // Add reply to thread
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, newReply] } : t)))

    // Update reply count on parent message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === thread.parentMessageId ? { ...m, threadRepliesCount: (m.threadRepliesCount || 0) + 1 } : m,
      ),
    )

    setThreadInputValue('')

    // TODO: Implement actual API call instead of simulated response
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        content: "That's a good point about the ER diagram. Would you like me to explain more?",
        sender: 'ai',
        timestamp: new Date(),
        threadId,
        parentId: thread.parentMessageId,
        entityId: thread.entityId,
      }

      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, aiReply] } : t)))

      // Update reply count on parent message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thread.parentMessageId ? { ...m, threadRepliesCount: (m.threadRepliesCount || 0) + 1 } : m,
        ),
      )
    }, 1000)
  }, [threadInputValue, threads])

  // Close the active thread view
  const closeThread = useCallback(() => {
    setActiveThreadId(null)
  }, [])

  // View an existing thread
  const viewThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId)
  }, [])

  return {
    // Chat state
    messages,
    inputValue,
    setInputValue,
    handleSendMessage,
    
    // Thread state
    threads,
    activeThreadId,
    threadInputValue,
    setThreadInputValue,
    
    // Thread actions
    startThread,
    sendThreadReply,
    closeThread,
    viewThread,
  }
}
