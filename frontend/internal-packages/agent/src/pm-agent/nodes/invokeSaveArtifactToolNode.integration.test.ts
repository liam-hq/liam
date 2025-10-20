import { AIMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import { aColumn, aSchema, aTable } from '@liam-hq/schema'
import { describe, it } from 'vitest'
import {
  getTestConfig,
  outputStreamEvents,
} from '../../../test-utils/workflowTestHelpers'
import {
  type PmAgentState,
  pmAgentStateAnnotation,
} from '../pmAgentAnnotations'
import { invokeSaveArtifactToolNode } from './invokeSaveArtifactToolNode'

describe('invokeSaveArtifactToolNode Integration', () => {
  it('should execute save artifact tool with real APIs', async () => {
    const { config, context, checkpointer } = await getTestConfig()
    const graph = new StateGraph(pmAgentStateAnnotation)
      .addNode('invokeSaveArtifactTool', invokeSaveArtifactToolNode)
      .addEdge(START, 'invokeSaveArtifactTool')
      .addEdge('invokeSaveArtifactTool', END)
      .compile({ checkpointer })

    const toolCallMessage = new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'test-tool-call-id',
          name: 'processAnalyzedRequirementsTool',
          args: {
            goal: 'Create a task management system for teams to collaborate effectively',
            testcases: {
              'User Management': [
                {
                  title: 'Users can register and login to the system',
                  type: 'INSERT',
                  sql: '',
                  testResults: [],
                },
                {
                  title: 'Users can create and manage their profiles',
                  type: 'UPDATE',
                  sql: '',
                  testResults: [],
                },
              ],
              'Project Management': [
                {
                  title: 'Users can create projects',
                  type: 'INSERT',
                  sql: '',
                  testResults: [],
                },
                {
                  title: 'Users can assign team members to projects',
                  type: 'INSERT',
                  sql: '',
                  testResults: [],
                },
              ],
              'Task Management': [
                {
                  title: 'Users can create tasks within projects',
                  type: 'INSERT',
                  sql: '',
                  testResults: [],
                },
                {
                  title: 'Users can assign tasks to team members',
                  type: 'UPDATE',
                  sql: '',
                  testResults: [],
                },
                {
                  title: 'Users can track task progress and status',
                  type: 'SELECT',
                  sql: '',
                  testResults: [],
                },
              ],
            },
          },
        },
      ],
    })

    const state: PmAgentState = {
      messages: [toolCallMessage],
      analyzedRequirements: {
        goal: '',
        testcases: {},
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
      artifactSaveSuccessful: false,
    }

    const streamEvents = graph.streamEvents(state, {
      ...config,
      streamMode: 'messages',
      version: 'v2',
    })

    await outputStreamEvents(streamEvents)
  })
})
