import { Annotation } from '@langchain/langgraph'
import { workflowAnnotation } from '../chat/workflow/shared/createAnnotations'

export const leadAgentStateAnnotation = Annotation.Root({
  ...workflowAnnotation.spec,
})

export type LeadAgentState = typeof leadAgentStateAnnotation.State
