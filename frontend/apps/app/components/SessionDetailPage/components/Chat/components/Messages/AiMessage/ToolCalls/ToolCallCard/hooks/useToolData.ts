import type { ToolMessage as ToolMessageType } from '@langchain/core/messages'
import type { ToolCalls } from '@liam-hq/agent/client'
import { useMemo } from 'react'
import { getToolDisplayInfo } from '../utils/getToolDisplayInfo'

type ToolCallItem = ToolCalls[number]

export const useToolData = (
  toolCall: ToolCallItem,
  toolMessage: ToolMessageType | undefined,
) => {
  const parsedArguments = useMemo(() => toolCall.args, [toolCall.args])

  const toolInfo = useMemo(
    () => getToolDisplayInfo(toolCall.name),
    [toolCall.name],
  )

  const result = useMemo(
    () => toolMessage?.text ?? 'Tool call result not found.',
    [toolMessage],
  )

  const resultStatus = useMemo(() => {
    const lowerResult = result.toLowerCase()
    if (lowerResult.includes('error')) return 'error'
    if (
      lowerResult.includes('successfully') ||
      lowerResult.includes('completed')
    )
      return 'success'
    return 'neutral'
  }, [result])

  return { parsedArguments, toolInfo, result, resultStatus }
}
