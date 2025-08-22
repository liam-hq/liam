import type { BaseMessage } from '@langchain/core/messages'
import { SystemMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { runDeepModelingTool } from '../tools/runDeepModelingTool'

const LEAD_AGENT_SYSTEM_PROMPT = `You are a Lead Agent supervisor that routes user requests to appropriate workflows.

Your primary responsibility is to analyze user input and determine if it requires database design capabilities.

You should invoke the runDeepModeling tool when the user request involves:
- Creating or designing database tables/schemas
- Converting business requirements to database design
- Generating ER diagrams or data models
- Improving or refactoring existing database schemas
- Defining relationships between entities
- Database normalization or optimization
- Data modeling tasks
- Table structure design
- Schema migration planning

When invoking the tool, provide a clear prompt explaining what database design is needed.

If the request does NOT involve database design (e.g., general questions, non-database tasks),
respond with a helpful message explaining that you handle database design tasks.`

/**
 * Call Model Node - React Agent pattern node that invokes the model
 * This node is responsible only for calling the model with tools bound.
 * Tool execution is handled separately by the tools node.
 */
export const callModelNode = async (
  state: { messages: BaseMessage[] },
  config: RunnableConfig,
): Promise<{ messages: BaseMessage[] }> => {
  const { messages } = state

  // GPT-4o is lighter weight for routing decisions
  const model = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0,
  }).bindTools([runDeepModelingTool], {
    tool_choice: 'auto',
  })

  const response = await model.invoke(
    [new SystemMessage(LEAD_AGENT_SYSTEM_PROMPT), ...messages],
    config,
  )

  return {
    messages: [response],
  }
}
