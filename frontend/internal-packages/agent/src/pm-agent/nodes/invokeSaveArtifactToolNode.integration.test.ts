import { HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStream,
} from '../../../test-utils/workflowTestHelpers'
import {
  type PmAgentState,
  pmAgentStateAnnotation,
} from '../pmAgentAnnotations'
import { invokeSaveArtifactToolNode } from './invokeSaveArtifactToolNode'

describe('invokeSaveArtifactToolNode Integration', () => {
  it('should execute invokeSaveArtifactToolNode with real APIs', async () => {
    // Arrange
    const graph = new StateGraph(pmAgentStateAnnotation)
      .addNode('invokeSaveArtifactToolNode', invokeSaveArtifactToolNode)
      .addEdge(START, 'invokeSaveArtifactToolNode')
      .addEdge('invokeSaveArtifactToolNode', END)
      .compile()
    const { config, context } = await getTestConfig()

    const userInput =
      'Create a task management system where users can create projects, assign tasks, and track progress'

    const state: PmAgentState = {
      messages: [new HumanMessage(userInput)],
      analyzedRequirements: {
        businessRequirement:
          'Build a comprehensive task management system that allows teams to organize work efficiently',
        functionalRequirements: {
          'User Management': [
            'Users can register and authenticate',
            'Users can create and manage profiles',
          ],
          'Project Management': [
            'Users can create new projects',
            'Users can assign team members to projects',
            'Users can set project deadlines and priorities',
          ],
          'Task Management': [
            'Users can create tasks within projects',
            'Users can assign tasks to team members',
            'Users can set task priorities and due dates',
            'Users can track task completion status',
          ],
        },
        nonFunctionalRequirements: {
          Performance: [
            'System should handle up to 1000 concurrent users',
            'Page load times should be under 2 seconds',
          ],
          Security: [
            'All user data must be encrypted',
            'Authentication must use secure tokens',
          ],
        },
      },
      designSessionId: context.designSessionId,
      schemaData: aSchema({
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
      }),
      analyzedRequirementsRetryCount: 0,
    }

    // Act
    const stream = await graph.stream(state, config)

    // Assert (Output)
    await outputStream(stream)
  })
})
