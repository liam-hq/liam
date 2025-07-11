import type { Position } from '@xyflow/react'

type PathParams = {
  sourceX: number
  sourceY: number
  sourcePosition: Position
  targetX: number
  targetY: number
  targetPosition: Position
  offset?: number
}

/**
 * Calculates a bezier path with offset for multiple edges between same nodes
 * Based on React Flow's getBezierPath but with custom control point offset
 */
export const calculateBezierPathWithOffset = ({
  sourceX,
  sourceY,
  sourcePosition: _sourcePosition,
  targetX,
  targetY,
  targetPosition: _targetPosition,
  offset = 0,
}: PathParams): string => {
  const deltaX = targetX - sourceX
  const deltaY = targetY - sourceY

  // Calculate control point offset perpendicular to the edge
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const normalX = -deltaY / distance
  const normalY = deltaX / distance

  // Apply offset to control points
  const controlPointOffset = offset * 0.5
  const midX = (sourceX + targetX) / 2 + normalX * controlPointOffset
  const midY = (sourceY + targetY) / 2 + normalY * controlPointOffset

  // Create bezier curve path
  const path = `M ${sourceX},${sourceY} Q ${midX},${midY} ${targetX},${targetY}`

  return path
}
