#!/usr/bin/env tsx

import { HumanMessage } from '@langchain/core/messages'
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint'
import type { SupabaseClientType } from '@liam-hq/db'
import type { Schema } from '@liam-hq/schema'
import type { Result } from 'neverthrow'
import { err, ok, okAsync } from 'neverthrow'
import type { WorkflowState } from '../src/chat/workflow/types'
import { createDbAgentGraph } from '../src/db-agent/createDbAgentGraph'
import type { createSupabaseRepositories } from '../src/repositories/factory'
import { isSchemaRepositoryWithCheckpointerFactory } from '../src/repositories/types'
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
 * Parse command line arguments
 */
const parseArgs = () => {
  const args = process.argv.slice(2)
  let prompt: string | undefined
  let threadId: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--prompt' || arg === '-p') {
      prompt = args[i + 1]
      i++
    } else if (arg === '--thread-id' || arg === '-t') {
      threadId = args[i + 1]
      i++
    } else if (arg.startsWith('--prompt=')) {
      prompt = arg.split('=')[1]
    } else if (arg.startsWith('--thread-id=')) {
      threadId = arg.split('=')[1]
    }
  }

  return { prompt, threadId }
}

/**
 * Create DB Agent graph for database schema design
 */
const createSimplifiedGraph = (
  repositories: ReturnType<typeof createSupabaseRepositories>,
  organizationId: string,
) => {
  // Get or create checkpointer from repositories
  let checkpointer: BaseCheckpointSaver
  
  // For SupabaseSchemaRepository, initialize the checkpointer
  if (isSchemaRepositoryWithCheckpointerFactory(repositories.schema)) {
    checkpointer = repositories.schema.createCheckpointer(organizationId)
  } else {
    // For other repositories (like InMemoryRepository), use the existing checkpointer
    checkpointer = repositories.schema.checkpointer
  }
  
  return createDbAgentGraph(checkpointer)
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

const createWorkflowState = (setupData: CreateWorkflowStateInput, customUserInput?: string) => {
  const { organization, buildingSchema, designSession, user } = setupData

  // Empty schema for testing - let AI design from scratch
  const sampleSchema: Schema = {
    tables: {},
  }

  // Use custom user input if provided, otherwise use default
  const userInput = customUserInput || getBusinessManagementSystemUserInput()

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
 * Find existing design session by thread_id (design session ID)
 */
const findExistingSession = async (
  repositories: ReturnType<typeof createSupabaseRepositories>,
  threadId: string,
) => {
  try {
    const designSession = await repositories.schema.getDesignSession(threadId)
    if (!designSession) {
      return err(new Error(`Design session not found for thread_id: ${threadId}`))
    }

    // Get schema data for this session
    const schemaResult = await repositories.schema.getSchema(threadId)
    if (schemaResult.isErr()) {
      return err(schemaResult.error)
    }

    return ok({
      designSession: { id: threadId, name: `Resumed Session - ${threadId}` },
      schemaData: schemaResult.value,
    })
  } catch (error) {
    return err(new Error(`Failed to find existing session: ${error}`))
  }
}

/**
 * Main execution function
 */
const executeDesignProcess = async (customPrompt?: string, resumeThreadId?: string): Promise<Result<void, Error>> => {
  let setupResult

  if (resumeThreadId) {
    // Resume existing session
    logger.info(`Resuming design session with thread_id: ${resumeThreadId}`)
    
    const baseSetup = await validateEnvironment()
      .andThen(setupDatabaseAndUser(logger))
    
    if (baseSetup.isErr()) return err(baseSetup.error)
    const { repositories } = baseSetup.value
    
    // Find existing session
    const existingSessionResult = await findExistingSession(repositories, resumeThreadId)
    if (existingSessionResult.isErr()) return err(existingSessionResult.error)
    
    const { designSession, schemaData } = existingSessionResult.value
    
    // Create workflow state with existing data
    const workflowState: WorkflowState = {
      userInput: customPrompt || "Continue the design process",
      messages: [new HumanMessage(customPrompt || "Continue the design process")],
      schemaData: schemaData.schema,
      buildingSchemaId: schemaData.id,
      latestVersionNumber: schemaData.latestVersionNumber,
      designSessionId: resumeThreadId,
      userId: baseSetup.value.user.id,
      organizationId: baseSetup.value.organization.id,
      retryCount: {},
    }
    
    setupResult = ok({
      ...baseSetup.value,
      workflowState,
      designSession,
      buildingSchema: { id: schemaData.id, latest_version_number: schemaData.latestVersionNumber }
    })
  } else {
    // Create new session
    const sessionName = `Design Session - ${new Date().toISOString()}`
    setupResult = await validateEnvironment()
      .andThen(setupDatabaseAndUser(logger))
      .andThen(createDesignSession(sessionName))
      .andThen(createBuildingSchema)
      .andThen((data) => createWorkflowState(data, customPrompt))
  }

  if (setupResult.isErr()) return err(setupResult.error)
  const { repositories, workflowState } = setupResult.value

  // Execute workflow
  const config = {
    configurable: {
      repositories,
      logger,
      buildingSchemaId: workflowState.buildingSchemaId,
      latestVersionNumber: workflowState.latestVersionNumber,
      thread_id: workflowState.designSessionId,
    },
  }
  const graph = createSimplifiedGraph(repositories, workflowState.organizationId)

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
  
  // Log the thread_id for future reference
  logger.info(`Thread ID for this session: ${workflowState.designSessionId}`)

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
  // Parse command line arguments
  const { prompt, threadId } = parseArgs()
  
  // Show usage information
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    showHelp(
      'executeDesignProcess.ts',
      `Executes the design process workflow for database schema generation.
  This script creates a design session, builds a schema, and runs the
  design workflow using LangGraph with checkpoint support.
  
  Additional Options:
    --prompt, -p <text>     Custom prompt for the AI
    --thread-id, -t <id>    Resume from existing design session (thread ID)`,
      [
        'pnpm --filter @liam-hq/agent execute-design-process',
        'pnpm --filter @liam-hq/agent execute-design-process --prompt "Create a user management system"',
        'pnpm --filter @liam-hq/agent execute-design-process --thread-id abc-123 --prompt "Add more tables"',
        'pnpm --filter @liam-hq/agent execute-design-process:debug',
      ],
    )
    process.exit(0)
  }

  if (threadId) {
    logger.info(`Resuming design process with thread_id: ${threadId}`)
  } else {
    logger.info('Starting new design process execution')
  }
  
  if (prompt) {
    logger.info(`Using custom prompt: ${prompt}`)
  }
  
  logger.info(`Log level: ${currentLogLevel}`)

  executeDesignProcess(prompt, threadId).then((result) => {
    if (result.isErr()) {
      logger.error(`FAILED: ${result.error.message}`)
      process.exit(1)
    }
    
    if (threadId) {
      logger.info(`Session resumed and continued with thread_id: ${threadId}`)
    } else {
      logger.info('New design session completed successfully')
    }
  })
}
