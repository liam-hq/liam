#!/usr/bin/env tsx

import { HumanMessage } from '@langchain/core/messages'
import { END, START, StateGraph } from '@langchain/langgraph'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import { err, ok, okAsync } from 'neverthrow'
import { designSchemaNode } from '../src/chat/workflow/nodes/designSchemaNode'
import { createAnnotations } from '../src/chat/workflow/shared/langGraphUtils'
import type { WorkflowState } from '../src/chat/workflow/types'
import { invokeSchemaDesignToolNode } from '../src/db-agent/nodes/invokeSchemaDesignToolNode'
import { routeAfterDesignSchema } from '../src/db-agent/routing/routeAfterDesignSchema'
import type { createSupabaseRepositories } from '../src/repositories/factory'
import {
  createBuildingSchema,
  createDesignSession,
  createLogger,
  getBusinessManagementSystemUserInput,
  getLogLevel,
  logSchemaResults,
  setupDatabaseAndUser,
  showHelp,
  validateEnvironment,
} from './shared/scriptUtils.ts'
import { processStreamChunk } from './shared/streamingUtils.ts'

const currentLogLevel = getLogLevel()
const logger = createLogger(currentLogLevel)

/**
 * Create simplified LangGraph with only designSchema and invokeSchemaDesignTool nodes
 */
const createSimplifiedGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  // Add only the nodes we need
  graph
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: { maxAttempts: 3 },
    })
    .addNode('invokeSchemaDesignTool', invokeSchemaDesignToolNode, {
      retryPolicy: { maxAttempts: 3 },
    })

    // Simple workflow: START -> designSchema -> conditional -> invokeSchemaDesignTool -> END
    .addEdge(START, 'designSchema')
    .addEdge('invokeSchemaDesignTool', 'designSchema')
    .addConditionalEdges('designSchema', routeAfterDesignSchema, {
      invokeSchemaDesignTool: 'invokeSchemaDesignTool',
      executeDDL: END, // In simplified version, skip DDL and go to complete
    })

  return graph.compile()
}

/**
 * Create minimal data for the workflow
 */
type CreateWorkflowStateInput = {
  supabaseClient: SupabaseClientType
  repositories: ReturnType<typeof createSupabaseRepositories>
  organization: { id: string; name: string }
  buildingSchema: { id: string; latest_version_number: number }
  designSession: { id: string; name: string }
  user: { id: string; email: string }
}

const createWorkflowState = (setupData: CreateWorkflowStateInput) => {
  const { organization, buildingSchema, designSession, user } = setupData

  // Empty schema for testing - let AI design from scratch
  const sampleSchema: Schema = {
    tables: {},
  }

  const userInput = getBusinessManagementSystemUserInput()

  const workflowState: WorkflowState = {
    userInput,
    messages: [new HumanMessage(userInput)],
    schemaData: sampleSchema,
    buildingSchemaId: buildingSchema.id,
    latestVersionNumber: buildingSchema.latest_version_number,
    designSessionId: designSession.id,
    userId: user.id,
    organizationId: organization.id,
    retryCount: {},
  }

  return okAsync({
    ...setupData,
    workflowState,
  })
}

/**
 * Main execution function
 */
const executeDesignProcess = async (): Promise<Result<void, Error>> => {
  // Validate environment, setup database, create session and schema with andThen chaining
  const sessionName = `Design Session - ${new Date().toISOString()}`
  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(createDesignSession(sessionName))
    .andThen(createBuildingSchema)
    .andThen(createWorkflowState)

  if (setupResult.isErr()) return err(setupResult.error)
  const { repositories, workflowState } = setupResult.value

  // Execute workflow
  const config = { configurable: { repositories, logger } }
  const graph = createSimplifiedGraph()

  logger.info('Starting AI workflow execution...')

  // Use streaming with proper async iterator handling
  const streamResult = await (async () => {
    const stream = await graph.stream(workflowState, {
      configurable: config.configurable,
      recursionLimit: 10,
      streamMode: 'values',
    })

    let finalResult = null

    for await (const chunk of stream) {
      processStreamChunk(logger, chunk)
      finalResult = chunk
    }

    return finalResult
  })()

  if (!streamResult) {
    return err(new Error('No result received from workflow'))
  }

  logger.info('Workflow completed')

  logSchemaResults(
    logger,
    streamResult.schemaData,
    currentLogLevel,
    streamResult.error,
  )

  if (streamResult.error) {
    return err(streamResult.error)
  }

  return ok(undefined)
}

// Execute if this file is run directly
if (require.main === module) {
  // Show usage information
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    showHelp(
      'executeDesignProcess.ts',
      `Executes the design process workflow for database schema generation.
  This script creates a design session, builds a schema, and runs the
  design workflow using LangGraph.`,
      [
        'pnpm --filter @liam-hq/agent execute-design-process',
        'pnpm --filter @liam-hq/agent execute-design-process:debug',
        'pnpm --filter @liam-hq/agent execute-design-process:warn',
      ],
    )
    process.exit(0)
  }

  logger.info(
    `Starting design process execution (log level: ${currentLogLevel})`,
  )

  executeDesignProcess().then((result) => {
    if (result.isErr()) {
      logger.error(`FAILED: ${result.error.message}`)
      process.exit(1)
    }
  })
}
