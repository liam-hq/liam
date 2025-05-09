"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import ChatInterface from "@/components/chat-interface"
import ERDiagramEditor from "@/components/er-diagram-editor"
import ThreadView from "@/components/thread-view"
import type { Message, Version, Thread } from "@/lib/types"
import { initialNodes, initialEdges } from "@/lib/initial-data"

export default function Home() {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")

  // Thread state
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [threadInputValue, setThreadInputValue] = useState("")

  // Hidden chat nodes state
  const [hiddenChatNodes, setHiddenChatNodes] = useState<{
    [entityId: string]: { threadId: string; position: { x: number; y: number } }
  }>({})

  // ER diagram state
  const [nodes, setNodes] = useState(() => {
    // 初期化時に各エンティティノードにonStartEntityChatを追加
    return initialNodes.map((node) => {
      if (node.type === "entity") {
        return {
          ...node,
          data: {
            ...node.data,
            // ダミー関数を設定（後でcreateNodeInputNodeで置き換え）
            onStartEntityChat: () => {},
            hasChat: false,
          },
        }
      }
      return node
    })
  })
  const [edges, setEdges] = useState(initialEdges)

  // Version control state
  const [versions, setVersions] = useState<Version[]>([
    { id: "1.0", label: "Version 1.0", nodes: initialNodes, edges: initialEdges, timestamp: new Date() },
  ])
  const [currentVersion, setCurrentVersion] = useState<string>("1.0")

  // ノードの参照を保持するためのref
  const nodesRef = useRef(nodes)
  // スレッドの参照を保持するためのref
  const threadsRef = useRef(threads)

  // nodesとthreadsが更新されたらrefも更新
  nodesRef.current = nodes
  threadsRef.current = threads

  // Handle sending a message in main chat
  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "human",
      timestamp: new Date(),
      hasThread: false,
      threadRepliesCount: 0,
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I've analyzed your ER diagram. Would you like me to suggest any improvements?",
        sender: "ai",
        timestamp: new Date(),
        hasThread: false,
        threadRepliesCount: 0,
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  // Start a new thread from a message
  const startThread = (messageId: string) => {
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
  }

  // Send a reply in a thread
  const sendThreadReply = (threadId: string) => {
    if (threadInputValue.trim() === "" || !threadId) return

    const thread = threads.find((t) => t.id === threadId)
    if (!thread) return

    const newReply: Message = {
      id: Date.now().toString(),
      content: threadInputValue,
      sender: "human",
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

    // Update chat node if exists
    updateChatNodeWithThreadMessages(threadId)

    setThreadInputValue("")

    // Simulate AI response in thread
    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        content: "That's a good point about the ER diagram. Would you like me to explain more?",
        sender: "ai",
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

      // Update chat node if exists
      updateChatNodeWithThreadMessages(threadId)
    }, 1000)
  }

  // Update chat node with thread messages
  const updateChatNodeWithThreadMessages = (threadId: string) => {
    const currentThreads = threadsRef.current
    const thread = currentThreads.find((t) => t.id === threadId)
    if (!thread) return

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type === "chat" && node.data.threadId === threadId) {
          return {
            ...node,
            data: {
              ...node.data,
              replyCount: thread.messages.length,
              threadMessages: thread.messages,
            },
          }
        }
        return node
      }),
    )
  }

  // Close the active thread view
  const closeThread = () => {
    setActiveThreadId(null)
  }

  // View an existing thread
  const viewThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId)
  }, [])

  // Hide a chat node (not remove)
  const hideChatNode = useCallback((nodeId: string, threadId: string) => {
    // Find the node to hide
    const nodeToHide = nodesRef.current.find((node) => node.id === nodeId)
    if (!nodeToHide) return

    // Find the thread
    const thread = threadsRef.current.find((t) => t.id === threadId)
    if (!thread || !thread.entityId) return

    // Store the node's position and threadId
    setHiddenChatNodes((prev) => ({
      ...prev,
      [thread.entityId]: { threadId, position: nodeToHide.position },
    }))

    // Update entity node to show it has a chat
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type === "entity" && node.id === thread.entityId) {
          return {
            ...node,
            data: {
              ...node.data,
              hasChat: true,
              onShowChatNode: showChatNode,
            },
          }
        }
        return node
      }),
    )

    // Remove the chat node from the diagram
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId))
  }, [])

  // Show a previously hidden chat node
  const showChatNode = useCallback(
    (entityId: string) => {
      // Check if there's a hidden chat node for this entity
      const hiddenInfo = hiddenChatNodes[entityId]
      if (!hiddenInfo) return

      // Find the entity node
      const entityNode = nodesRef.current.find((node) => node.id === entityId)
      if (!entityNode) return

      // Find the thread
      const thread = threadsRef.current.find((t) => t.id === hiddenInfo.threadId)
      if (!thread) return

      // Find the parent message
      const parentMessage = messages.find((m) => m.id === thread.parentMessageId)
      if (!parentMessage) return

      // Create a new chat node
      const chatNodeId = `chat-${Date.now()}`
      const chatNode = {
        id: chatNodeId,
        type: "chat",
        position: hiddenInfo.position,
        data: {
          entityId: entityId,
          entityLabel: entityNode.data.label,
          messageContent: parentMessage.content,
          timestamp: parentMessage.timestamp,
          messageId: parentMessage.id,
          threadId: hiddenInfo.threadId,
          replyCount: thread.messages.length,
          threadMessages: thread.messages,
          onViewThread: viewThread,
          onHideChatNode: hideChatNode,
        },
      }

      // Add the chat node to the diagram
      setNodes((prevNodes) => [...prevNodes, chatNode])

      // Remove from hidden chat nodes
      setHiddenChatNodes((prev) => {
        const newHidden = { ...prev }
        delete newHidden[entityId]
        return newHidden
      })
    },
    [hiddenChatNodes, messages, viewThread, hideChatNode],
  )

  // Create a chat input node - nodesの依存関係を削除
  const createChatInputNode = useCallback(
    (entityId: string, position: { x: number; y: number }) => {
      console.log("Creating chat input node for entity:", entityId, "at position:", position)

      // nodesRefを使用して最新のノード状態にアクセス
      const currentNodes = nodesRef.current

      // Find the entity node
      const entityNode = currentNodes.find((node) => node.id === entityId)
      if (!entityNode) {
        console.error("Entity node not found:", entityId)
        return
      }

      // Calculate absolute position for the input node
      const inputNodePosition = {
        x: entityNode.position.x + position.x,
        y: entityNode.position.y + position.y,
      }

      // Create a chat input node
      const inputNodeId = `chat-input-${Date.now()}`
      const inputNode = {
        id: inputNodeId,
        type: "chatInput",
        position: inputNodePosition,
        data: {
          entityId: entityId,
          entityLabel: entityNode.data.label,
          onSubmitMessage: submitEntityChatMessage,
          onCancelInput: removeChatInputNode,
        },
      }

      console.log("Adding input node:", inputNode)

      // Add input node to diagram
      setNodes((nds) => [...nds, inputNode])
    },
    [
      /* 依存関係を削除 */
    ],
  )

  // Remove a chat input node
  const removeChatInputNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
  }, [])

  // Submit a message from chat input node - nodesの依存関係を削除
  const submitEntityChatMessage = useCallback(
    (entityId: string, content: string, inputNodeId: string) => {
      // nodesRefを使用して最新のノード状態にアクセス
      const currentNodes = nodesRef.current

      // Find the entity node
      const entityNode = currentNodes.find((node) => node.id === entityId)
      if (!entityNode) return

      // Get position from the input node
      const inputNode = currentNodes.find((node) => node.id === inputNodeId)
      if (!inputNode) return

      const chatNodePosition = { ...inputNode.position }

      // Create a new message for this entity
      const newMessageId = Date.now().toString()
      const newMessage: Message = {
        id: newMessageId,
        content: content,
        sender: "human",
        timestamp: new Date(),
        hasThread: true,
        threadRepliesCount: 0,
        entityId: entityId,
      }

      // Create a thread for this message
      const threadId = `thread-${Date.now()}`
      const newThread: Thread = {
        id: threadId,
        parentMessageId: newMessageId,
        messages: [],
        entityId: entityId,
        position: chatNodePosition,
      }

      // Update message with thread info
      const messageWithThread = { ...newMessage, threadId }

      // Add message to chat
      setMessages((prev) => [...prev, messageWithThread])

      // Add thread
      setThreads((prev) => [...prev, newThread])

      // Remove the input node
      removeChatInputNode(inputNodeId)

      // Update entity node to show it has a chat
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.type === "entity" && node.id === entityId) {
            return {
              ...node,
              data: {
                ...node.data,
                hasChat: true,
                onShowChatNode: showChatNode,
              },
            }
          }
          return node
        }),
      )

      // Create a chat node in the diagram
      const chatNodeId = `chat-${Date.now()}`
      const chatNode = {
        id: chatNodeId,
        type: "chat",
        position: chatNodePosition,
        data: {
          entityId: entityId,
          entityLabel: entityNode.data.label,
          messageContent: content,
          timestamp: newMessage.timestamp,
          messageId: newMessageId,
          threadId: threadId,
          replyCount: 0,
          threadMessages: [], // 空の配列で初期化
          onViewThread: viewThread,
          onHideChatNode: hideChatNode,
        },
      }

      // Add chat node to diagram
      setNodes((nds) => [...nds, chatNode])

      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `I see your comment about the ${entityNode.data.label} table. Would you like to discuss this further?`,
          sender: "ai",
          timestamp: new Date(),
          threadId: threadId,
          parentId: newMessageId,
          entityId: entityId,
        }

        // Add AI response to thread
        setThreads((prev) => {
          const updatedThreads = prev.map((t) =>
            t.id === threadId ? { ...t, messages: [...t.messages, aiResponse] } : t,
          )

          // スレッドの参照を更新
          threadsRef.current = updatedThreads

          return updatedThreads
        })

        // Update reply count
        setMessages((prev) => prev.map((m) => (m.id === newMessageId ? { ...m, threadRepliesCount: 1 } : m)))

        // Update chat node
        setNodes((nds) =>
          nds.map((n) =>
            n.id === chatNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    replyCount: 1,
                    threadMessages: [aiResponse],
                  },
                }
              : n,
          ),
        )
      }, 1000)
    },
    [removeChatInputNode, viewThread, hideChatNode, showChatNode],
  )

  // Remove a chat node from the diagram
  const saveNewVersion = () => {
    const lastVersion = versions.find((v) => v.id === currentVersion)
    const baseVersionParts = currentVersion.split(".")

    let newVersionId
    if (lastVersion && versions.length > 1 && currentVersion !== versions[versions.length - 1].id) {
      // Creating a branch version
      newVersionId = `${currentVersion}.1`
    } else {
      // Creating a sequential version
      const majorVersion = baseVersionParts[0]
      const minorVersion = Number.parseInt(baseVersionParts[1] || "0") + 1
      newVersionId = `${majorVersion}.${minorVersion}`
    }

    const newVersion: Version = {
      id: newVersionId,
      label: `Version ${newVersionId}`,
      nodes: nodes,
      edges: edges,
      timestamp: new Date(),
    }

    setVersions((prev) => [...prev, newVersion])
    setCurrentVersion(newVersionId)

    // Add version notification to chat
    const versionNotification: Message = {
      id: Date.now().toString(),
      content: `Version ${newVersionId} created`,
      sender: "system",
      timestamp: new Date(),
      versionId: newVersionId,
      hasThread: false,
      threadRepliesCount: 0,
    }
    setMessages((prev) => [...prev, versionNotification])
  }

  // Switch to a specific version
  const switchToVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId)
    if (version) {
      // バージョン切り替え時に、すべてのエンティティノードにonStartEntityChatを追加
      const updatedNodes = version.nodes.map((node) => {
        if (node.type === "entity") {
          // Check if this entity has a hidden chat node
          const hasHiddenChat = hiddenChatNodes[node.id] !== undefined

          return {
            ...node,
            data: {
              ...node.data,
              onStartEntityChat: createChatInputNode,
              hasChat: hasHiddenChat,
              onShowChatNode: hasHiddenChat ? showChatNode : undefined,
            },
          }
        }
        // チャットノードの場合、スレッドメッセージを更新
        if (node.type === "chat" && node.data.threadId) {
          const thread = threadsRef.current.find((t) => t.id === node.data.threadId)
          if (thread) {
            return {
              ...node,
              data: {
                ...node.data,
                threadMessages: thread.messages,
                replyCount: thread.messages.length,
                onViewThread: viewThread,
                onHideChatNode: hideChatNode,
              },
            }
          }
        }
        return node
      })

      setNodes(updatedNodes)
      setEdges(version.edges)
      setCurrentVersion(versionId)
    }
  }

  // Add a new entity to the diagram
  const addNewEntity = () => {
    const newNode = {
      id: `entity-${Date.now()}`,
      type: "entity",
      position: { x: 250, y: 150 },
      data: {
        label: "New Entity",
        fields: [{ name: "id", type: "int", isPrimary: true, isForeign: false }],
        onStartEntityChat: createChatInputNode, // 入力ノード作成関数を渡す
        hasChat: false,
      },
    }

    setNodes((nds) => [...nds, newNode])
    saveNewVersion()
  }

  // 初期化時に一度だけ実行する処理
  useEffect(() => {
    console.log("Initializing entity nodes with chat function")

    // すべてのエンティティノードにcreateNodeInputNodeを設定
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type === "entity") {
          return {
            ...node,
            data: {
              ...node.data,
              onStartEntityChat: createChatInputNode,
              hasChat: false,
              onShowChatNode: showChatNode,
            },
          }
        }
        return node
      }),
    )
  }, [createChatInputNode, showChatNode]) // createChatInputNodeが変更されたときのみ実行

  return (
    <main className="flex h-screen">
      {/* Chat Interface (1/3 of screen) */}
      <div className="w-1/3 border-r border-gray-300 flex flex-col relative">
        <ChatInterface
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          switchToVersion={switchToVersion}
          startThread={startThread}
          viewThread={viewThread}
        />

        {/* Thread overlay */}
        {activeThreadId && (
          <div className="absolute inset-0 bg-white z-10">
            <ThreadView
              thread={threads.find((t) => t.id === activeThreadId)!}
              parentMessage={
                messages.find((m) => m.id === threads.find((t) => t.id === activeThreadId)?.parentMessageId)!
              }
              inputValue={threadInputValue}
              setInputValue={setThreadInputValue}
              sendReply={() => sendThreadReply(activeThreadId)}
              closeThread={closeThread}
            />
          </div>
        )}
      </div>

      {/* ER Diagram Editor (2/3 of screen) */}
      <div className="w-2/3">
        <ERDiagramEditor
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          versions={versions}
          currentVersion={currentVersion}
          switchToVersion={switchToVersion}
          saveNewVersion={saveNewVersion}
          addNewEntity={addNewEntity}
          startEntityChat={createChatInputNode}
          viewThread={viewThread}
          removeChatNode={hideChatNode}
        />
      </div>
    </main>
  )
}
