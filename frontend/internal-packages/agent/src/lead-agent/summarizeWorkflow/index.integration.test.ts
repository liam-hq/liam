import { AIMessage, HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStream,
} from '../../../test-utils/workflowTestHelpers'
import type { WorkflowState } from '../../types'
import { workflowAnnotation } from '../../workflowAnnotation'
import { summarizeWorkflow } from './index'

describe('summarizeWorkflow Integration', () => {
  it('should execute summarizeWorkflow with real APIs', async () => {
    // Arrange
    const graph = new StateGraph(workflowAnnotation)
      .addNode('summarizeWorkflow', summarizeWorkflow)
      .addEdge(START, 'summarizeWorkflow')
      .addEdge('summarizeWorkflow', END)
      .compile()
    const { config, context } = await getTestConfig()

    // Explicitly define the state needed for summarization
    const state: WorkflowState = {
      userInput:
        'Create a user management system with users, roles, and permissions tables',
      messages: [
        new HumanMessage(
          'Create a user management system with users, roles, and permissions tables',
        ),
        new HumanMessage('I need to track user permissions and roles'),
        new AIMessage({
          content:
            'I understand you need a permission and role system. Let me design tables for users, roles, and permissions with proper relationships.',
          name: 'db-agent',
        }),
        new HumanMessage('Yes, and make sure users can have multiple roles'),
        new AIMessage({
          content:
            "I've designed a many-to-many relationship between users and roles using a user_roles junction table. This allows users to have multiple roles.",
          name: 'db-agent',
        }),
      ],
      schemaData: { tables: {}, enums: {}, extensions: {} }, // Not used by summarizeWorkflow
      testcases: [],
      buildingSchemaId: context.buildingSchemaId,
      latestVersionNumber: context.latestVersionNumber,
      designSessionId: context.designSessionId,
      userId: context.userId,
      organizationId: context.organizationId,
      next: END,
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output)
    await outputStream(stream)
  })
})
