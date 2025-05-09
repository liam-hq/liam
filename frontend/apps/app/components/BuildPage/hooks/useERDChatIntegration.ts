import { useState, useCallback, useEffect } from 'react'
import type { Message, Thread } from './useERDChat'

interface ERDEntity {
  id: string
  label: string
  // Add other properties as needed
}

interface ChatMessage {
  id: string
  content: string
  entityId: string
  threadId?: string
  timestamp: Date
  sender: 'human' | 'ai' | 'system'
}

interface UseERDChatIntegrationProps {
  projectId?: string
  branchOrCommit?: string
}

export const useERDChatIntegration = ({
  projectId,
  branchOrCommit,
}: UseERDChatIntegrationProps) => {
  // State for entities (tables in the ERD)
  const [entities, setEntities] = useState<ERDEntity[]>([])
  
  // State for chat messages associated with entities
  const [entityMessages, setEntityMessages] = useState<Record<string, ChatMessage[]>>({})
  
  // State for the currently selected entity
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  // Fetch entities from the API
  const fetchEntities = useCallback(async () => {
    if (!projectId || !branchOrCommit) return
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockEntities: ERDEntity[] = [
        { id: 'entity-1', label: 'User' },
        { id: 'entity-2', label: 'Post' },
        { id: 'entity-3', label: 'Comment' },
      ]
      
      setEntities(mockEntities)
    } catch (error) {
      console.error('Error fetching entities:', error)
    }
  }, [projectId, branchOrCommit])

  // Fetch messages for an entity
  const fetchEntityMessages = useCallback(async (entityId: string) => {
    if (!projectId || !branchOrCommit) return
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use mock data
      const mockMessages: ChatMessage[] = [
        {
          id: `message-${entityId}-1`,
          content: `This is a message about ${entities.find(e => e.id === entityId)?.label || 'entity'}`,
          entityId,
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          sender: 'human',
        },
        {
          id: `message-${entityId}-2`,
          content: `This is a response about ${entities.find(e => e.id === entityId)?.label || 'entity'}`,
          entityId,
          timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
          sender: 'ai',
        },
      ]
      
      setEntityMessages(prev => ({
        ...prev,
        [entityId]: mockMessages,
      }))
    } catch (error) {
      console.error('Error fetching entity messages:', error)
    }
  }, [projectId, branchOrCommit, entities])

  // Add a message to an entity
  const addEntityMessage = useCallback((entityId: string, content: string, sender: 'human' | 'ai' | 'system') => {
    const newMessage: ChatMessage = {
      id: `message-${Date.now()}`,
      content,
      entityId,
      timestamp: new Date(),
      sender,
    }
    
    setEntityMessages(prev => ({
      ...prev,
      [entityId]: [...(prev[entityId] || []), newMessage],
    }))
    
    // In a real implementation, this would also make an API call to save the message
    
    return newMessage
  }, [])

  // Convert entity messages to the format expected by the chat interface
  const convertEntityMessagesToMessages = useCallback((entityId: string): Message[] => {
    const messages = entityMessages[entityId] || []
    
    return messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      sender: message.sender,
      threadId: message.threadId,
      hasThread: !!message.threadId,
      threadRepliesCount: 0, // This would be fetched from the API in a real implementation
    }))
  }, [entityMessages])

  // Select an entity and load its messages
  const selectEntity = useCallback(async (entityId: string) => {
    setSelectedEntityId(entityId)
    
    // Fetch messages if they haven't been fetched yet
    if (!entityMessages[entityId]) {
      await fetchEntityMessages(entityId)
    }
  }, [entityMessages, fetchEntityMessages])

  // Initialize by fetching entities
  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  return {
    entities,
    entityMessages,
    selectedEntityId,
    selectEntity,
    addEntityMessage,
    convertEntityMessagesToMessages,
  }
}
