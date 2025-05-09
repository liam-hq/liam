'use client'

import { type FC, useState, useCallback, useEffect } from 'react'
import { ERDRenderer, VersionProvider } from '@liam-hq/erd-core'
import styles from './BuildPage.module.css'
import { ChatInterface } from './components/ChatInterface'
import { ThreadView } from './components/ThreadView'
import { ChatNode } from './components/ChatNode'
import { ChatInputNode } from './components/ChatInputNode'
import { VersionControl } from './components/VersionControl'
import { useERDChat } from './hooks/useERDChat'
import { useNodeConnections } from './hooks/useNodeConnections'
import { useERDChatIntegration } from './hooks/useERDChatIntegration'
import { useVersionManagement } from './hooks/useVersionManagement'

export interface BuildPageProps {
  projectId?: string
  branchOrCommit?: string
}

export const BuildPage: FC<BuildPageProps> = ({ projectId, branchOrCommit }) => {
  // ERD Chat integration hook
  const {
    entities,
    entityMessages,
    selectedEntityId,
    selectEntity,
    addEntityMessage,
    convertEntityMessagesToMessages,
  } = useERDChatIntegration({ projectId, branchOrCommit })

  // Convert entity messages to the format expected by the chat interface
  const [currentEntityMessages, setCurrentEntityMessages] = useState<any[]>([])

  // Update current entity messages when selected entity changes
  useEffect(() => {
    if (selectedEntityId) {
      setCurrentEntityMessages(convertEntityMessagesToMessages(selectedEntityId))
    } else {
      setCurrentEntityMessages([])
    }
  }, [selectedEntityId, entityMessages, convertEntityMessagesToMessages])

  // Chat interface hook
  const {
    messages: chatMessages,
    inputValue,
    setInputValue,
    handleSendMessage: originalHandleSendMessage,
    threads,
    activeThreadId,
    threadInputValue,
    setThreadInputValue,
    startThread,
    sendThreadReply,
    closeThread,
    viewThread,
  } = useERDChat()

  // Override handleSendMessage to also add the message to the selected entity
  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() === '' || !selectedEntityId) return

    // Add the message to the entity
    addEntityMessage(selectedEntityId, inputValue, 'human')

    // Call the original handleSendMessage
    originalHandleSendMessage()
  }, [inputValue, selectedEntityId, addEntityMessage, originalHandleSendMessage])

  // Convert entities to nodes for the ERD
  const [nodes, setNodes] = useState<any[]>([])

  // Update nodes when entities change
  useEffect(() => {
    const entityNodes = entities.map((entity, index) => ({
      id: entity.id,
      type: 'table',
      position: { x: 100 + index * 300, y: 100 },
      data: { label: entity.label },
    }))

    setNodes(entityNodes)
  }, [entities])
  const [edges, setEdges] = useState<any[]>([])

  // Use the node connections hook
  const {
    connectEntityToChat,
    disconnectEntityFromChat,
    calculateChatNodePosition,
    createChatInputNode,
    createChatNode,
  } = useNodeConnections({
    nodes,
    setNodes,
    edges,
    setEdges,
  })

  // Functions for interacting with ERD nodes
  const startEntityChat = useCallback(
    (entityId: string, position?: { x: number; y: number }) => {
      console.log('Starting chat for entity:', entityId, 'at position:', position)
      
      // Select the entity to load its messages
      selectEntity(entityId)
      
      // Create a chat input node
      createChatInputNode(entityId, position)
    },
    [createChatInputNode, selectEntity]
  )

  const hideChatNode = useCallback(
    (nodeId: string, threadId: string) => {
      console.log('Hiding chat node:', nodeId, 'with thread:', threadId)
      disconnectEntityFromChat(nodeId)
      setNodes((prev) => prev.filter((node) => node.id !== nodeId))
    },
    [disconnectEntityFromChat, setNodes]
  )

  // Version management
  const {
    versions,
    currentVersionId,
    createVersion,
    switchVersion,
    getCurrentVersion,
  } = useVersionManagement({
    projectId,
    branchOrCommit,
    nodes,
    edges,
    entityMessages,
  })

  // Handle create version
  const handleCreateVersion = useCallback((name: string, description: string) => {
    createVersion(name, description)
  }, [createVersion])

  // Handle switch version
  const handleSwitchVersion = useCallback((versionId: string) => {
    switchVersion(versionId)
  }, [switchVersion])

  // Mock error objects for demonstration
  const [errorObjects] = useState<any[]>([])

  // Mock version data for the VersionProvider
  const mockVersion = {
    version: '1.0.0',
    gitHash: 'abcdef123456',
    envName: 'development',
    date: new Date().toISOString(),
    displayedOn: 'web' as const,
  }

  return (
    <VersionProvider version={mockVersion}>
      <div className={styles.container}>
      <div className={styles.chatSection}>
        {activeThreadId ? (
          <ThreadView
            thread={threads.find((t) => t.id === activeThreadId)!}
            parentMessage={
              currentEntityMessages.find((m) => m.id === threads.find((t) => t.id === activeThreadId)?.parentMessageId)!
            }
            inputValue={threadInputValue}
            setInputValue={setThreadInputValue}
            sendReply={() => sendThreadReply(activeThreadId)}
            closeThread={closeThread}
          />
        ) : (
          <ChatInterface
            messages={selectedEntityId ? currentEntityMessages : []}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSendMessage={handleSendMessage}
            startThread={startThread}
            viewThread={viewThread}
          />
        )}
      </div>
      <div className={styles.erdSection}>
        {/* Note: In a real implementation, we would need to install the @xyflow/react module */}
        {/* and properly integrate our custom node types with the ERDRenderer component. */}
        <ERDRenderer
          errorObjects={errorObjects}
          withAppBar={false}
        />
      </div>
      <div className={styles.versionSection}>
        <VersionControl
          versions={versions}
          currentVersionId={currentVersionId}
          onCreateVersion={handleCreateVersion}
          onSwitchVersion={handleSwitchVersion}
        />
      </div>
    </div>
    </VersionProvider>
  )
}
