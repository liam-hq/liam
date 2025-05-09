"use client"

import type React from "react"

import { memo } from "react"
import { Handle, Position } from "reactflow"
import { MessageSquarePlus, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Field {
  name: string
  type: string
  isPrimary: boolean
  isForeign: boolean
}

interface EntityNodeData {
  label: string
  fields: Field[]
  onStartEntityChat: (entityId: string, position: { x: number; y: number }) => void
  hasChat?: boolean
  onShowChatNode?: (entityId: string) => void
}

interface EntityNodeProps {
  id: string
  data: EntityNodeData
  isConnectable: boolean
}

export default memo(function EntityNode({ id, data, isConnectable }: EntityNodeProps) {
  // クリックイベントを明示的に処理
  const handleStartChat = (e: React.MouseEvent) => {
    // イベントの伝播を停止
    e.stopPropagation()
    e.preventDefault()

    console.log("Chat button clicked for entity:", id)

    // チャットが既に存在する場合は表示する
    if (data.hasChat && typeof data.onShowChatNode === "function") {
      data.onShowChatNode(id)
      return
    }

    // 新しいチャットを開始する
    // ノードの右側に少し離れた位置にチャットノードを配置
    const position = { x: 300, y: 0 }

    // onStartEntityChatが関数かどうかをチェック
    if (typeof data.onStartEntityChat === "function") {
      data.onStartEntityChat(id, position)
    } else {
      console.error("onStartEntityChat is not a function", data)
    }
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-md shadow-md w-64">
      {/* Entity header with chat button */}
      <div className="bg-gray-100 p-2 border-b border-gray-300 font-bold flex justify-between items-center">
        <span>{data.label}</span>
        {/* z-indexを高くしてボタンが最前面に来るようにする */}
        <div className="relative z-10">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 cursor-pointer hover:bg-gray-200 ${data.hasChat ? "text-blue-600" : ""}`}
            onClick={handleStartChat}
            type="button"
          >
            {data.hasChat ? <MessageSquare className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Entity fields */}
      <div className="p-2">
        {data.fields.map((field, index) => (
          <div key={index} className="flex items-center py-1 border-b border-gray-100 last:border-0">
            <div className="flex-1 flex items-center">
              <span className="mr-1">
                {field.isPrimary && <span className="text-xs font-bold text-amber-600">PK</span>}
                {field.isForeign && <span className="text-xs font-bold text-blue-600 ml-1">FK</span>}
              </span>
              <span className="font-medium">{field.name}</span>
            </div>
            <div className="text-xs text-gray-500">{field.type}</div>
          </div>
        ))}
      </div>

      {/* Connection handles */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
    </div>
  )
})
