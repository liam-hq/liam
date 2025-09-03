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
          'Build a comprehensive task management system for teams',
        functionalRequirements: {
          'User Management': [
            'Users can register and authenticate',
            'Users can create and manage profiles',
          ],
          'Project Management': [
            'Users can create projects',
            'Users can assign team members to projects',
          ],
          'Task Management': [
            'Users can create tasks within projects',
            'Users can assign tasks to team members',
            'Users can track task progress and status',
          ],
        },
        nonFunctionalRequirements: {
          Performance: [
            'System should handle 1000+ concurrent users',
            'Response time should be under 2 seconds',
          ],
          Security: [
            'All data should be encrypted in transit and at rest',
            'Role-based access control should be implemented',
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

    const stream = await graph.stream(state, config)

    await outputStream(stream)
  })
})
