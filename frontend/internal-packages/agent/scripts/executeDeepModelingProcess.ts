#!/usr/bin/env tsx

import { HumanMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import type { Result } from 'neverthrow'
import { err, ok, okAsync } from 'neverthrow'
import { createGraph } from '../src/createGraph'
import { hasHelpFlag, parseDesignProcessArgs } from './shared/argumentParser'
import {
  createLogger,
  getBusinessManagementSystemUserInput,
  getLogLevel,
  logSchemaResults,
  type SetupDatabaseAndUserResult,
  setupDatabaseAndUser,
  showHelp,
  validateEnvironment,
} from './shared/scriptUtils'
import { findOrCreateDesignSession } from './shared/sessionUtils'
import { processStreamChunk } from './shared/streamingUtils'

const currentLogLevel = getLogLevel()
const logger = createLogger(currentLogLevel)

/**
 * Create workflow state for deep modeling
 */
type CreateWorkflowStateInput = SetupDatabaseAndUserResult & {
  buildingSchema: { id: string; latest_version_number: number }
  designSession: { id: string; name: string }
}

const createWorkflowStateForDeepModeling = (
  setupData: CreateWorkflowStateInput,
  customUserInput?: string,
) => {
  const { organization, buildingSchema, designSession, user, repositories } =
    setupData

  const sampleSchema: Schema = {
    tables: {},
    enums: {},
  }

  const userInput = customUserInput || getBusinessManagementSystemUserInput()

  return okAsync({
    ...setupData,
    workflowState: {
      userInput,
      messages: [new HumanMessage(userInput)],
      schemaData: sampleSchema,
      buildingSchemaId: buildingSchema.id,
      latestVersionNumber: buildingSchema.latest_version_number,
      designSessionId: designSession.id,
      userId: user.id,
      organizationId: organization.id,
    },
    options: {
      configurable: {
        repositories,
        thread_id: designSession.id,
      },
      recursionLimit: 50,
      streamMode: 'values' as const,
    },
  })
}
/**
 * Main execution function
 */
const executeDeepModelingProcess = async (
  customPrompt?: string,
  resumeSessionId?: string,
): Promise<Result<void, Error>> => {
  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(findOrCreateDesignSession(resumeSessionId))
    .andThen((data) => createWorkflowStateForDeepModeling(data, customPrompt))

  if (setupResult.isErr()) return err(setupResult.error)
  const { workflowState, options } = setupResult.value

  const graph = createGraph(
    options.configurable.repositories.schema.checkpointer,
  )

  // Use streaming with proper async iterator handling
  const streamResult = await (async () => {
    const stream = await graph.stream(workflowState, options)

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

  logger.info('Deep Modeling workflow completed successfully')

  const sessionId = workflowState.designSessionId
  logger.info(`Session ID: ${sessionId}`)
  logger.info(`To resume this session later, use: --session-id ${sessionId}`)

  if (currentLogLevel === 'DEBUG') {
    logger.debug('Final Schema Data:', {
      schemaData: streamResult.schemaData,
    })
  }

  logSchemaResults(logger, streamResult.schemaData, currentLogLevel, undefined)

  return ok(undefined)
}

// Execute if this file is run directly
if (require.main === module) {
  const { prompt, sessionId } = parseDesignProcessArgs()

  if (hasHelpFlag()) {
    showHelp(
      'executeDeepModelingProcess.ts',
      `Executes the comprehensive Deep Modeling workflow for database schema generation.
  This script creates a design session, builds a schema, and runs the full
  deep modeling workflow including web search, requirements analysis, schema design,
  DDL execution, use case generation, DML preparation, validation, review, and
  artifact finalization.

  Additional Options:
    --prompt, -p <text>     Custom prompt for the AI
    --session-id, -s <id>   Resume from existing design session (session ID)`,
      [
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts',
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts --prompt "Create a user management system"',
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts --session-id abc-123 --prompt "Add more tables"',
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts --log-level=DEBUG',
      ],
    )
    process.exit(0)
  }

  logger.info(
    `Starting Deep Modeling process execution (log level: ${currentLogLevel})`,
  )

  executeDeepModelingProcess(prompt, sessionId).then((result) => {
    if (result.isErr()) {
      logger.error(`FAILED: ${result.error.message}`)
      process.exit(1)
    }

    logger.info('Deep Modeling session completed successfully')
  })
}
