"use client"

import { useRef, useEffect } from "react"
import type { Message, Thread } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, X, Database } from "lucide-react"

interface ThreadViewProps {
  thread: Thread
  parentMessage: Message
  inputValue: string
  setInputValue: (value: string) => void
  sendReply: () => void
  closeThread: () => void
}

export default function ThreadView({
  thread,
  parentMessage,
  inputValue,
  setInputValue,
  sendReply,
  closeThread,
}: ThreadViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages])

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="p-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="font-medium">Thread</h3>
          {thread.entityId && (
            <span className="ml-2 flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              <Database className="h-3 w-3 mr-1" />
              Table Chat
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={closeThread}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent message */}
      <div className="p-3 border-b border-gray-200">
        <div
          className={`p-3 rounded-md w-full ${
            parentMessage.sender === "human"
              ? "bg-blue-100 border-l-4 border-blue-500"
              : "bg-purple-100 border-l-4 border-purple-500"
          }`}
        >
          <div className="text-sm mb-1 flex items-center">
            {parentMessage.sender === "human" ? "You" : "AI"} - {formatTime(parentMessage.timestamp)}
            {parentMessage.entityId && (
              <span className="ml-2 flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                <Database className="h-3 w-3 mr-1" />
                Table Chat
              </span>
            )}
          </div>
          <div>{parentMessage.content}</div>
        </div>
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map((message) => (
          <div key={message.id} className="w-full">
            <div
              className={`p-3 rounded-md w-full ${
                message.sender === "human"
                  ? "bg-blue-100 border-l-4 border-blue-500"
                  : "bg-purple-100 border-l-4 border-purple-500"
              }`}
            >
              <div className="text-sm mb-1">
                {message.sender === "human" ? "You" : "AI"} - {formatTime(message.timestamp)}
              </div>
              <div>{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-300">
        <form
          className="flex items-center space-x-2"
          onSubmit={(e) => {
            e.preventDefault()
            sendReply()
          }}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
