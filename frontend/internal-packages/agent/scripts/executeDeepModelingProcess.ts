#!/usr/bin/env tsx

import type { BaseMessage } from '@langchain/core/messages'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { isToolMessageError } from '../src/chat/workflow/utils/toolMessageUtils'
import { deepModeling } from '../src/deepModeling'
import {
  createBuildingSchema,
  createDesignSession,
  createLogger,
  createWorkflowState,
  getLogLevel,
  logSchemaResults,
  setupDatabaseAndUser,
  showHelp,
  validateEnvironment,
} from './shared/scriptUtils'
import type { Logger } from './shared/types'

const currentLogLevel = getLogLevel()
const logger = createLogger(currentLogLevel)

const logWorkflowMessage = (
  logger: Logger,
  message: BaseMessage,
  index: number,
) => {
  const messageType = message.constructor.name
    .toLowerCase()
    .replace('message', '')
  const content = message.text

  // Check if this is a ToolMessage with an error
  if (isToolMessageError(message)) {
    logger.error(
      `  ${index + 1}. [${messageType}] ${content.substring(0, 200)}${
        content.length > 200 ? '...' : ''
      }`,
    )
    return
  }

  logger.info(
    `  ${index + 1}. [${messageType}] ${content.substring(0, 200)}${
      content.length > 200 ? '...' : ''
    }`,
  )
}

/**
 * Main execution function
 */
const executeDeepModelingProcess = async (): Promise<Result<void, Error>> => {
  // Validate environment, setup database, create session and schema with andThen chaining
  const sessionName = `Deep Modeling Session - ${new Date().toISOString()}`
  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(createDesignSession(sessionName))
    .andThen(createBuildingSchema)
    .andThen(createWorkflowState)

  if (setupResult.isErr()) return err(setupResult.error)
  const { repositories, workflowState } = setupResult.value

  // Execute deep modeling workflow
  const config = {
    configurable: {
      repositories,
      logger: {
        ...logger,
        log: logger.info,
      },
    },
  }

  logger.info('Starting Deep Modeling workflow execution...')
  logger.info(`Input: "${workflowState.userInput.substring(0, 100)}..."`)
  logger.info(
    `Initial tables: ${Object.keys(workflowState.schemaData.tables).length}`,
  )

  const result = await deepModeling(workflowState, config)

  if (result.isErr()) {
    logger.error(`Deep Modeling workflow failed: ${result.error.message}`)
    return err(result.error)
  }

  const finalWorkflowState = result.value
  logger.info('Deep Modeling workflow completed successfully')

  // Log actual messages content
  if (finalWorkflowState.messages && finalWorkflowState.messages.length > 0) {
    logger.info('Workflow Messages:')
    finalWorkflowState.messages.forEach((message, index) => {
      logWorkflowMessage(logger, message, index)
    })
  }

  // Debug: Log the final schema data structure
  if (currentLogLevel === 'DEBUG') {
    logger.debug('Final Schema Data:', {
      schemaData: finalWorkflowState.schemaData,
    })
  }

  logSchemaResults(
    logger,
    finalWorkflowState.schemaData,
    currentLogLevel,
    finalWorkflowState.error,
  )

  if (finalWorkflowState.error) {
    return err(finalWorkflowState.error)
  }

  return ok(undefined)
}

// Execute if this file is run directly
if (require.main === module) {
  // Show usage information
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    showHelp(
      'executeDeepModelingProcess.ts',
      `Executes the comprehensive Deep Modeling workflow for database schema generation.
  This script creates a design session, builds a schema, and runs the full
  deep modeling workflow including web search, requirements analysis, schema design,
  DDL execution, use case generation, DML preparation, validation, review, and
  artifact finalization.`,
      [
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts',
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts --log-level=DEBUG',
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts --log-level=WARN',
      ],
    )
    process.exit(0)
  }

  logger.info(
    `Starting Deep Modeling process execution (log level: ${currentLogLevel})`,
  )

  executeDeepModelingProcess().then((result) => {
    if (result.isErr()) {
      logger.error(`FAILED: ${result.error.message}`)
      process.exit(1)
    }
  })
}
