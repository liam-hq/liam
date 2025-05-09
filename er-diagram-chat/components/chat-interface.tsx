"use client"

import { useRef, useEffect } from "react"
import type { Message } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare, Database } from "lucide-react"

interface ChatInterfaceProps {
  messages: Message[]
  inputValue: string
  setInputValue: (value: string) => void
  handleSendMessage: () => void
  switchToVersion: (versionId: string) => void
  startThread: (messageId: string) => void
  viewThread: (threadId: string) => void
}

export default function ChatInterface({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  switchToVersion,
  startThread,
  viewThread,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="w-full">
            {message.sender === "system" ? (
              // Version notification
              <Button
                variant="outline"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 justify-start"
                onClick={() => switchToVersion(message.versionId!)}
              >
                {message.content} - {formatTime(message.timestamp)}
              </Button>
            ) : (
              // Human or AI message
              <div
                className={`p-3 rounded-md w-full ${
                  message.sender === "human"
                    ? "bg-blue-100 border-l-4 border-blue-500"
                    : "bg-purple-100 border-l-4 border-purple-500"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm flex items-center">
                    {message.sender === "human" ? "You" : "AI"} - {formatTime(message.timestamp)}
                    {message.entityId && (
                      <span className="ml-2 flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        <Database className="h-3 w-3 mr-1" />
                        Table Chat
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {message.hasThread ? (
                      // View thread button
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs flex items-center"
                        onClick={() => viewThread(message.threadId!)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {message.threadRepliesCount} {message.threadRepliesCount === 1 ? "reply" : "replies"}
                      </Button>
                    ) : (
                      // Start thread button
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => startThread(message.id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Reply in thread
                      </Button>
                    )}
                  </div>
                </div>
                <div>{message.content}</div>
              </div>
            )}
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
            handleSendMessage()
          }}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
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
