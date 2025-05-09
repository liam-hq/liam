"use client"

import { useCallback } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow"
import "reactflow/dist/style.css"
import type { Version } from "@/lib/types"
import EntityNode from "./entity-node"
import ChatNode from "./chat-node"
import ChatInputNode from "./chat-input-node"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save } from "lucide-react"

// Register custom node types
const nodeTypes = {
  entity: EntityNode,
  chat: ChatNode,
  chatInput: ChatInputNode,
}

interface ERDiagramEditorProps {
  nodes: any[]
  edges: any[]
  setNodes: (nodes: any[]) => void
  setEdges: (edges: any[]) => void
  versions: Version[]
  currentVersion: string
  switchToVersion: (versionId: string) => void
  saveNewVersion: () => void
  addNewEntity: () => void
  startEntityChat: (entityId: string, position: { x: number; y: number }) => void
  viewThread: (threadId: string) => void
  removeChatNode: (nodeId: string) => void
}

export default function ERDiagramEditor({
  nodes,
  edges,
  setNodes,
  setEdges,
  versions,
  currentVersion,
  switchToVersion,
  saveNewVersion,
  addNewEntity,
  startEntityChat,
  viewThread,
  removeChatNode,
}: ERDiagramEditorProps) {
  // Handle node changes (position, selection, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes],
  )

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges],
  )

  return (
    <div className="h-full relative">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white p-2 rounded-md shadow-md">
        <Select value={currentVersion} onValueChange={switchToVersion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {version.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={addNewEntity} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Add Entity
        </Button>

        <Button onClick={saveNewVersion} size="sm" variant="outline">
          <Save className="h-4 w-4 mr-1" /> Save Version
        </Button>

        <div className="text-sm text-gray-500 ml-2">Current: v{currentVersion}</div>
      </div>

      {/* ReactFlow diagram */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
