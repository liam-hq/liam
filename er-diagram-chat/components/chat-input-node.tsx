"use client"

import type React from "react"

import { memo, useState } from "react"
import { X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatInputNodeData {
  entityId: string
  entityLabel: string
  onSubmitMessage: (entityId: string, content: string, nodeId: string) => void
  onCancelInput: (nodeId: string) => void
}

interface ChatInputNodeProps {
  id: string
  data: ChatInputNodeData
}

export default memo(function ChatInputNode({ id, data }: ChatInputNodeProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "") return

    data.onSubmitMessage(data.entityId, inputValue, id)
    setInputValue("")
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-md w-64 p-0 overflow-hidden">
      {/* Chat input header */}
      <div className="bg-blue-50 p-2 border-b border-gray-200 flex justify-between items-center">
        <div className="text-sm font-medium text-blue-700">New comment: {data.entityLabel}</div>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => data.onCancelInput(id)}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="mb-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Comment on ${data.entityLabel}...`}
            className="w-full"
            autoFocus
          />
        </div>
        <Button type="submit" size="sm" className="w-full" disabled={inputValue.trim() === ""}>
          <Send className="h-3 w-3 mr-1" /> Send
        </Button>
      </form>
    </div>
  )
})
