import { WORKFLOW_NODE_PROGRESS } from '../constants'

export const getWorkflowNodeProgress = (
  nodeName: keyof typeof WORKFLOW_NODE_PROGRESS,
): number => {
  return WORKFLOW_NODE_PROGRESS[nodeName]
}
