import { useCallback, useEffect, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'

interface UseNodeConnectionsProps {
  nodes: Node[]
  setNodes: (nodes: Node[]) => void
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
}

export const useNodeConnections = ({
  nodes,
  setNodes,
  edges,
  setEdges,
}: UseNodeConnectionsProps) => {
  // Keep track of chat nodes and their associated entity nodes
  const [chatNodeConnections, setChatNodeConnections] = useState<Record<string, string>>({})

  // Create a connection between an entity node and a chat node
  const connectEntityToChat = useCallback(
    (entityId: string, chatNodeId: string) => {
      // Store the connection
      setChatNodeConnections((prev) => ({
        ...prev,
        [chatNodeId]: entityId,
      }))

      // Create an edge between the entity node and the chat node
      const newEdge: Edge = {
        id: `${entityId}-${chatNodeId}`,
        source: entityId,
        target: chatNodeId,
        type: 'relationship',
        animated: true,
        style: { stroke: 'var(--color-blue-500)', strokeWidth: 2 },
      }

      setEdges((prev) => [...prev, newEdge])
    },
    [setEdges],
  )

  // Remove a connection between an entity node and a chat node
  const disconnectEntityFromChat = useCallback(
    (chatNodeId: string) => {
      // Get the entity ID associated with this chat node
      const entityId = chatNodeConnections[chatNodeId]
      if (!entityId) return

      // Remove the connection from the state
      setChatNodeConnections((prev) => {
        const newConnections = { ...prev }
        delete newConnections[chatNodeId]
        return newConnections
      })

      // Remove the edge
      setEdges((prev) => prev.filter((edge) => edge.id !== `${entityId}-${chatNodeId}`))
    },
    [chatNodeConnections, setEdges],
  )

  // Calculate the position for a new chat node based on the entity node position
  const calculateChatNodePosition = useCallback(
    (entityId: string, offset: { x: number; y: number } = { x: 150, y: 0 }) => {
      // Find the entity node
      const entityNode = nodes.find((node) => node.id === entityId)
      if (!entityNode) return { x: 0, y: 0 }

      // Calculate the position
      const position = {
        x: entityNode.position.x + offset.x,
        y: entityNode.position.y + offset.y,
      }

      // Check if there are already chat nodes at this position
      const chatNodesAtPosition = nodes.filter(
        (node) =>
          node.type === 'chat' &&
          Math.abs(node.position.x - position.x) < 10 &&
          Math.abs(node.position.y - position.y) < 10,
      )

      // If there are chat nodes at this position, offset the position
      if (chatNodesAtPosition.length > 0) {
        position.y += 100 * chatNodesAtPosition.length
      }

      return position
    },
    [nodes],
  )

  // Create a chat input node for an entity
  const createChatInputNode = useCallback(
    (entityId: string, position?: { x: number; y: number }) => {
      // Calculate the position if not provided
      const nodePosition = position || calculateChatNodePosition(entityId)

      // Create a unique ID for the chat input node
      const chatInputNodeId = `chat-input-${Date.now()}`

      // Create the chat input node
      const chatInputNode: Node = {
        id: chatInputNodeId,
        type: 'chatInput',
        position: nodePosition,
        data: {
          entityId,
          entityLabel: nodes.find((node) => node.id === entityId)?.data?.label || 'Entity',
          onSubmitMessage: (entityId: string, content: string, inputNodeId: string) => {
            console.log('Submit message:', entityId, content, inputNodeId)
            // This would be implemented to create a chat node and remove the input node
          },
          onCancelInput: (nodeId: string) => {
            console.log('Cancel input:', nodeId)
            // This would be implemented to remove the input node
            setNodes((prev) => prev.filter((node) => node.id !== nodeId))
          },
        },
      }

      // Add the chat input node to the nodes
      setNodes((prev) => [...prev, chatInputNode])

      // Connect the entity node to the chat input node
      connectEntityToChat(entityId, chatInputNodeId)

      return chatInputNodeId
    },
    [nodes, setNodes, calculateChatNodePosition, connectEntityToChat],
  )

  // Create a chat node for an entity
  const createChatNode = useCallback(
    (entityId: string, messageContent: string, position?: { x: number; y: number }) => {
      // Calculate the position if not provided
      const nodePosition = position || calculateChatNodePosition(entityId)

      // Create a unique ID for the chat node
      const chatNodeId = `chat-${Date.now()}`
      const messageId = `message-${Date.now()}`
      const threadId = `thread-${Date.now()}`

      // Create the chat node
      const chatNode: Node = {
        id: chatNodeId,
        type: 'chat',
        position: nodePosition,
        data: {
          entityId,
          entityLabel: nodes.find((node) => node.id === entityId)?.data?.label || 'Entity',
          messageContent,
          timestamp: new Date(),
          messageId,
          threadId,
          replyCount: 0,
          threadMessages: [],
          onViewThread: (threadId: string) => {
            console.log('View thread:', threadId)
            // This would be implemented to open the thread view
          },
          onHideChatNode: (nodeId: string, threadId: string) => {
            console.log('Hide chat node:', nodeId, threadId)
            // This would be implemented to hide the chat node
            disconnectEntityFromChat(nodeId)
            setNodes((prev) => prev.filter((node) => node.id !== nodeId))
          },
        },
      }

      // Add the chat node to the nodes
      setNodes((prev) => [...prev, chatNode])

      // Connect the entity node to the chat node
      connectEntityToChat(entityId, chatNodeId)

      return { chatNodeId, messageId, threadId }
    },
    [nodes, setNodes, calculateChatNodePosition, connectEntityToChat, disconnectEntityFromChat],
  )

  // Update the edges when nodes are moved
  useEffect(() => {
    // This effect will update the edges when nodes are moved
    // For now, we'll just log the nodes and edges
    console.log('Nodes:', nodes)
    console.log('Edges:', edges)
  }, [nodes, edges])

  return {
    connectEntityToChat,
    disconnectEntityFromChat,
    calculateChatNodePosition,
    createChatInputNode,
    createChatNode,
  }
}
