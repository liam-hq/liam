import { SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { Command, END } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowConfigurable } from '../../chat/workflow/types'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import type { LeadAgentState } from '../annotation'
import { routeToAgent } from '../tools/routeToAgent'
import { isQACompleted } from '../utils/workflowStatus'
import { prompt } from './prompt'

export async function classifyMessage(
  state: LeadAgentState,
  config: RunnableConfig,
): Promise<Command> {
  // 1. Check if QA is completed first (highest priority)
  if (isQACompleted(state)) {
    return new Command({ goto: 'summarizeWorkflow' })
  }

  // 2. Analyze initial request with LLM
  const model = new ChatOpenAI({
    model: 'gpt-5-nano',
  }).bindTools([routeToAgent], {
    parallel_tool_calls: false,
    tool_choice: 'auto',
  })

  const invoke = ResultAsync.fromThrowable(
    (configurable: WorkflowConfigurable) => {
      return model.invoke([new SystemMessage(prompt), ...state.messages], {
        configurable,
      })
    },
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  const result = await getConfigurable(config).asyncAndThen(invoke)

  if (result.isErr()) {
    throw new WorkflowTerminationError(result.error, 'classifyMessage')
  }

  const response = result.value

  // 3. Check if database design request (tool call to routeToAgent)
  if (response.tool_calls?.[0]?.name === 'routeToAgent') {
    // Route to PM Agent
    return new Command({
      update: {
        messages: [response],
        next: 'pmAgent',
      },
      goto: END,
    })
  }

  // 4. Regular response without routing
  return new Command({
    update: {
      messages: [response],
      next: END,
    },
    goto: END,
  })
}
