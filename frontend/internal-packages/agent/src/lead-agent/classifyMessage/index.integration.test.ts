import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable, type Schema } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStream,
} from '../../../test-utils/workflowTestHelpers'
import { workflowAnnotation } from '../../chat/workflow/shared/workflowAnnotation'
import type { WorkflowState } from '../../chat/workflow/types'
import { classifyMessage } from './index'

const createTestStateAndConfig = async (
  userInput: string,
  messages?: BaseMessage[],
  schemaData?: Schema,
) => {
  const { config, context } = await getTestConfig()

  const state: WorkflowState = {
    userInput,
    messages: messages || [new HumanMessage(userInput)],
    schemaData: schemaData || { tables: {}, enums: {}, extensions: {} },
    testcases: [],
    buildingSchemaId: context.buildingSchemaId,
    latestVersionNumber: context.latestVersionNumber,
    designSessionId: context.designSessionId,
    userId: context.userId,
    organizationId: context.organizationId,
    next: END,
  }

  return { state, config }
}

describe('classifyMessage Integration', () => {
  it('should route database design requests to pmAgent', async () => {
    const graph = new StateGraph(workflowAnnotation)
      .addNode('classifyMessage', classifyMessage)
      .addEdge(START, 'classifyMessage')
      .addEdge('classifyMessage', END)
      .compile()

    const userInput =
      'Create a user management system with users, roles, and permissions tables'
    const { state, config } = await createTestStateAndConfig(userInput)

    const stream = await graph.stream(state, config)
    await outputStream(stream)
  })

  it('should handle unsupported tasks without routing', async () => {
    const graph = new StateGraph(workflowAnnotation)
      .addNode('classifyMessage', classifyMessage)
      .addEdge(START, 'classifyMessage')
      .addEdge('classifyMessage', END)
      .compile()

    const userInput = 'Generate Python code for a REST API'
    const { state, config } = await createTestStateAndConfig(userInput)

    const stream = await graph.stream(state, config)
    await outputStream(stream)
  })

  it('should route to summarizeWorkflow when QA is completed', async () => {
    const graph = new StateGraph(workflowAnnotation)
      .addNode('classifyMessage', classifyMessage)
      .addEdge(START, 'classifyMessage')
      .addEdge('classifyMessage', END)
      .compile()

    const userInput = 'Create a user management system'
    const messages = [
      new HumanMessage('Create a user management system'),
      new AIMessage({
        content:
          'I have designed the schema with users, roles, and permissions tables.',
        name: 'db-agent',
      }),
      new AIMessage({
        content: 'The schema has been validated and meets all requirements.',
        name: 'qa-agent',
      }),
    ]
    const schemaData = aSchema({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'uuid',
              notNull: true,
            }),
            email: aColumn({
              name: 'email',
              type: 'varchar',
              notNull: true,
            }),
          },
        }),
      },
    })

    const { state, config } = await createTestStateAndConfig(
      userInput,
      messages,
      schemaData,
    )

    const stream = await graph.stream(state, config)
    await outputStream(stream)
  })
})
