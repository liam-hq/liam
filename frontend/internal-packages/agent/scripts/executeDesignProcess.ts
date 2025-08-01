#!/usr/bin/env tsx

import { HumanMessage } from '@langchain/core/messages'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/db-structure'
import type { Result } from 'neverthrow'
import { err, ok, okAsync } from 'neverthrow'
import type { WorkflowState } from '../src/chat/workflow/types'
import { createDbAgentGraph } from '../src/db-agent/createDbAgentGraph'
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
} from './shared/scriptUtils'
import { processStreamChunk } from './shared/streamingUtils'

const currentLogLevel = getLogLevel()
const logger = createLogger(currentLogLevel)

/**
 * Create DB Agent graph for database schema design
 */
const createSimplifiedGraph = () => {
  return createDbAgentGraph()
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
  const config = {
    configurable: {
      repositories,
      logger,
      buildingSchemaId: workflowState.buildingSchemaId,
      latestVersionNumber: workflowState.latestVersionNumber,
    },
  }
  const graph = createSimplifiedGraph()

  logger.info('Starting AI workflow execution...')

  // Use streaming with proper async iterator handling
  const streamResult = await (async () => {
    const stream = await graph.stream(workflowState, {
      configurable: config.configurable,
      recursionLimit: 100,
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
    undefined, // Error handling is now done immediately in workflow
  )

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
