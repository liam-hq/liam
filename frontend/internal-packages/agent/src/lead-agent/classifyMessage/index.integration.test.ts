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
  outputStreamEvents,
} from '../../../test-utils/workflowTestHelpers'
import type { WorkflowState } from '../../types'
import { workflowAnnotation } from '../../workflowAnnotation'
import { classifyMessage } from './index'

const createTestStateAndConfig = async (
  userInput: string,
  messages?: BaseMessage[],
  schemaData?: Schema,
) => {
  const { config, context, checkpointer } = await getTestConfig()

  const state: WorkflowState = {
    messages: messages || [new HumanMessage(userInput)],
    schemaData: schemaData || { tables: {}, enums: {}, extensions: {} },
    analyzedRequirements: {
      goal: '',
      testcases: {},
    },
    schemaIssues: [],
    buildingSchemaId: context.buildingSchemaId,
    designSessionId: context.designSessionId,
    userId: context.userId,
    organizationId: context.organizationId,
    next: END,
  }

  return { state, config, checkpointer }
}

describe('classifyMessage Integration', () => {
  it('should route database design requests to pmAgent', async () => {
    const userInput =
      'Create a user management system with users, roles, and permissions tables'
    const { state, config, checkpointer } =
      await createTestStateAndConfig(userInput)
    const graph = new StateGraph(workflowAnnotation)
      .addNode('classifyMessage', classifyMessage)
      .addEdge(START, 'classifyMessage')
      .addEdge('classifyMessage', END)
      .compile({ checkpointer })

    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })
    await outputStreamEvents(streamEvents)
  })

  it('should handle unsupported tasks without routing', async () => {
    const userInput = 'Generate Python code for a REST API'
    const { state, config, checkpointer } =
      await createTestStateAndConfig(userInput)
    const graph = new StateGraph(workflowAnnotation)
      .addNode('classifyMessage', classifyMessage)
      .addEdge(START, 'classifyMessage')
      .addEdge('classifyMessage', END)
      .compile({ checkpointer })

    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })
    await outputStreamEvents(streamEvents)
  })

  it('should route to summarizeWorkflow when QA is completed', async () => {
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

    const { state, config, checkpointer } = await createTestStateAndConfig(
      userInput,
      messages,
      schemaData,
    )
    const graph = new StateGraph(workflowAnnotation)
      .addNode('classifyMessage', classifyMessage)
      .addEdge(START, 'classifyMessage')
      .addEdge('classifyMessage', END)
      .compile({ checkpointer })

    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })
    await outputStreamEvents(streamEvents)
  })
})
