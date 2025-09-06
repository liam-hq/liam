import { AIMessage } from '@langchain/core/messages'
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
  it('should execute save artifact tool with real APIs', async () => {
    const graph = new StateGraph(pmAgentStateAnnotation)
      .addNode('invokeSaveArtifactTool', invokeSaveArtifactToolNode)
      .addEdge(START, 'invokeSaveArtifactTool')
      .addEdge('invokeSaveArtifactTool', END)
      .compile()
    const { config, context } = await getTestConfig()

    const toolCallMessage = new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'test-tool-call-id',
          name: 'saveRequirementsToArtifactTool',
          args: {
            businessRequirement:
              'Create a task management system for teams to collaborate effectively',
            functionalRequirements: {
              'User Management': [
                'Users can register and login to the system',
                'Users can create and manage their profiles',
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
                'System should handle up to 1000 concurrent users',
                'Page load times should be under 2 seconds',
              ],
              Security: [
                'User data should be encrypted',
                'Authentication should use secure tokens',
              ],
            },
          },
        },
      ],
    })

    const state: PmAgentState = {
      messages: [toolCallMessage],
      analyzedRequirements: {
        businessRequirement: '',
        functionalRequirements: {},
        nonFunctionalRequirements: {},
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
