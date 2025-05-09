export interface Message {
  id: string
  content: string
  sender: "human" | "ai" | "system"
  timestamp: Date
  versionId?: string
  threadId?: string
  parentId?: string
  hasThread?: boolean
  threadRepliesCount?: number
  entityId?: string // 関連するエンティティのID
}

export interface Thread {
  id: string
  parentMessageId: string
  messages: Message[]
  entityId?: string // 関連するエンティティのID
  position?: { x: number; y: number } // ReactFlow上での位置
}

export interface Field {
  name: string
  type: string
  isPrimary: boolean
  isForeign: boolean
}

export interface Entity {
  id: string
  label: string
  fields: Field[]
}

export interface Relationship {
  id: string
  source: string
  target: string
  label: string
}

export interface DiagramState {
  entities: Entity[]
  relationships: Relationship[]
}

export interface Version {
  id: string
  label: string
  nodes: any[]
  edges: any[]
  timestamp: Date
}
