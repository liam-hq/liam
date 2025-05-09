"use client"

import { memo } from "react"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ThreadMessage {
  id: string
  content: string
  sender: "human" | "ai" | "system"
  timestamp: Date
}

interface ChatNodeData {
  entityId: string
  entityLabel: string
  messageContent: string
  timestamp: Date
  messageId: string
  threadId: string
  replyCount: number
  threadMessages: ThreadMessage[]
  onViewThread: (threadId: string) => void
  onHideChatNode: (nodeId: string, threadId: string) => void
}

interface ChatNodeProps {
  id: string
  data: ChatNodeData
}

export default memo(function ChatNode({ id, data }: ChatNodeProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-md w-64 p-0 overflow-hidden">
      {/* Chat node header */}
      <div className="bg-blue-50 p-2 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center text-sm font-medium text-blue-700">
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          <span>Chat: {data.entityLabel}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => data.onHideChatNode(id, data.threadId)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Original message */}
      <div className="p-2 bg-blue-50 border-b border-gray-200 text-xs text-gray-500 flex justify-between items-center">
        <span>{formatTime(data.timestamp)}</span>
        <span className="text-xs text-blue-600">{data.replyCount} replies</span>
      </div>
      <div className="p-3 text-sm max-h-40 overflow-y-auto border-b border-gray-200">
        <div className="mb-2 pb-2 border-b border-gray-100">
          <p className="text-gray-700">{data.messageContent}</p>
        </div>

        {/* Thread messages (always visible) */}
        {data.threadMessages && data.threadMessages.length > 0 && (
          <div className="mt-2 space-y-2">
            {data.threadMessages.map((message) => (
              <div key={message.id} className="pl-2 border-l-2 border-gray-200">
                <div className="text-xs text-gray-500 mb-1 flex justify-between">
                  <span>{message.sender === "human" ? "You" : "AI"}</span>
                  <span>{formatTime(message.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-700">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thread link */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs justify-start"
          onClick={() => data.onViewThread(data.threadId)}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          View full thread
        </Button>
      </div>
    </div>
  )
})
