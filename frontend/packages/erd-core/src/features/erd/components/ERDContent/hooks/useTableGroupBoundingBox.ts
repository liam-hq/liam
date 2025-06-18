'use client'

import type { TableGroup } from '@liam-hq/db-structure'
import type { Node } from '@xyflow/react'
import { type MouseEvent, useCallback, useRef, useState } from 'react'
import { useCustomReactflow } from '@/features/reactflow/hooks'
import { useUserEditing } from '@/stores'

type Box = {
  x: number
  y: number
  width: number
  height: number
}

type Params = {
  nodes: Node[]
  onAddTableGroup?: ((props: TableGroup) => void) | undefined
}

export const useTableGroupBoundingBox = ({
  nodes,
  onAddTableGroup,
}: Params) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentBox, setCurrentBox] = useState<Box | null>(null)

  const { screenToFlowPosition } = useCustomReactflow()
  const { isTableGroupEditMode } = useUserEditing()

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!isTableGroupEditMode) return
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const startX = event.clientX - rect.left
      const startY = event.clientY - rect.top

      setCurrentBox({ x: startX, y: startY, width: 0, height: 0 })
    },
    [isTableGroupEditMode],
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isTableGroupEditMode) return
      if (!containerRef.current) return
      if (!currentBox) return

      const rect = containerRef.current.getBoundingClientRect()
      const endX = event.clientX - rect.left
      const endY = event.clientY - rect.top

      setCurrentBox({
        ...currentBox,
        width: endX - currentBox.x,
        height: endY - currentBox.y,
      })
    },
    [isTableGroupEditMode, currentBox],
  )

  const handleMouseUp = useCallback(() => {
    if (!isTableGroupEditMode) return
    if (!currentBox) return
    if (!onAddTableGroup) return

    // Use min/max to handle negative width/height
    const topLeftPosition = screenToFlowPosition({
      x: Math.min(currentBox.x, currentBox.x + currentBox.width),
      y: Math.min(currentBox.y, currentBox.y + currentBox.height),
    })
    const bottomRightPosition = screenToFlowPosition({
      x: Math.max(currentBox.x, currentBox.x + currentBox.width),
      y: Math.max(currentBox.y, currentBox.y + currentBox.height),
    })

    // Filter nodes that are within the currentBox area
    const nodesInBox = nodes.filter((node) => {
      const nodeX = node.position.x
      const nodeY = node.position.y

      return (
        nodeX >= topLeftPosition.x &&
        nodeX <= bottomRightPosition.x &&
        nodeY >= topLeftPosition.y &&
        nodeY <= bottomRightPosition.y
      )
    })

    if (nodesInBox.length > 0) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:\.]/g, '')
        .substring(0, 14)
      const name = `Group_${timestamp}`

      onAddTableGroup({
        name,
        tables: nodesInBox.map((node) => node.id),
        comment: null,
      })
    }
  }, [
    currentBox,
    isTableGroupEditMode,
    nodes,
    screenToFlowPosition,
    onAddTableGroup,
  ])

  return {
    containerRef,
    currentBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
