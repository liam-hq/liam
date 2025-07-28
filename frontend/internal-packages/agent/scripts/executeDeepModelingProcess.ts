#!/usr/bin/env tsx
// @ts-nocheck - Complex type interactions with external APIs
/* eslint-disable */

import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { deepModeling } from '../src/deepModeling'
import { DebugCallbackHandler } from '../src/utils/debugCallbackHandler'
import {
  createBuildingSchema,
  createDesignSession,
  createInMemoryWorkflowState,
  createLogger,
  createWorkflowState,
  getLogLevel,
  logSchemaResults,
  setupDatabaseAndUser,
  setupInMemoryRepository,
  showHelp,
  validateEnvironment,
} from './shared/scriptUtils.ts'

const currentLogLevel = getLogLevel()
const logger = createLogger(currentLogLevel)

/**
 * Main execution function
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Main execution function with complex logic
const executeDeepModelingProcess = async (): Promise<Result<void, Error>> => {
  const sessionName = `Deep Modeling Session - ${new Date().toISOString()}`

  // Check if using InMemory mode
  const useInMemory =
    process.env['AGENT_MODE'] === 'memory' || process.argv.includes('--memory')

  // biome-ignore lint/suspicious/noExplicitAny: External API types are complex
  let setupResult: Result<any, Error>

  if (useInMemory) {
    logger.info('Using InMemory repository mode')
    setupResult = setupInMemoryRepository(logger).andThen(
      createInMemoryWorkflowState,
    )
  } else {
    logger.info('Using PostgreSQL repository mode')
    setupResult = await validateEnvironment()
      .andThen(setupDatabaseAndUser(logger))
      .andThen(createDesignSession(sessionName))
      .andThen(createBuildingSchema)
      .andThen(createWorkflowState)
  }

  if (setupResult.isErr()) return err(setupResult.error)
  const { repositories, workflowState } = setupResult.value

  // Execute deep modeling workflow
  const debugCallback = new DebugCallbackHandler({
    ...logger,
    log: logger.info,
  })

  const config = {
    configurable: {
      repositories,
      logger,
    },
    callbacks: [debugCallback],
  }

  logger.info('Starting Deep Modeling workflow execution...')
  logger.info(`Input: "${workflowState.userInput.substring(0, 100)}..."`)
  logger.info(
    `Initial tables: ${Object.keys(workflowState.schemaData.tables).length}`,
  )

  logger.info('=== WORKFLOW CONFIGURATION ===')
  logger.info('Recursion limit:', workflowState.recursionLimit)
  logger.info('Building schema ID:', workflowState.buildingSchemaId)
  logger.info('Organization ID:', workflowState.organizationId)
  logger.info('User input length:', workflowState.userInput.length)
  logger.info('=== STARTING WORKFLOW ===')

  const result = await deepModeling(workflowState, config)
  debugCallback.getWorkflowSummary()

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
      const messageType = message.constructor.name
        .toLowerCase()
        .replace('message', '')
      const content =
        typeof message.content === 'string'
          ? message.content
          : JSON.stringify(message.content)
      logger.info(
        `  ${index + 1}. [${messageType}] ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
      )
    })
  }

  // Get the latest schema from repository for InMemory mode
  let finalSchemaData = finalWorkflowState.schemaData
  if (useInMemory) {
    logger.debug(
      'Attempting to retrieve latest schema from InMemory repository...',
    )
    logger.debug('Building schema ID:', {
      buildingSchemaId: finalWorkflowState.buildingSchemaId,
    })

    const latestSchemaResult = await repositories.schema.getSchema(
      finalWorkflowState.buildingSchemaId,
    )

    if (latestSchemaResult.isOk()) {
      const schemaData = latestSchemaResult.value
      logger.debug('Schema retrieval result:', {
        success: true,
        schemaTableCount: schemaData.schema?.tables
          ? Object.keys(schemaData.schema.tables).length
          : 'N/A',
      })

      finalSchemaData = schemaData.schema
      logger.debug('✅ Retrieved latest schema from InMemory repository')
      logger.debug('Final schema table count:', {
        count: Object.keys(finalSchemaData.tables || {}).length,
      })
    } else {
      logger.warn('❌ Failed to retrieve schema from InMemory repository')
      logger.warn('Retrieval error:', {
        error: latestSchemaResult.error.message,
      })
    }
  }

  // Debug: Log the final schema data structure
  if (currentLogLevel === 'DEBUG') {
    logger.debug('Final Schema Data:', {
      schemaData: finalSchemaData,
    })
  }

  logSchemaResults(
    logger,
    finalSchemaData,
    currentLogLevel,
    finalWorkflowState.error,
  )

  // Log building schemas data for InMemory mode
  if (useInMemory && 'getAllBuildingSchemas' in repositories.schema) {
    // biome-ignore lint/suspicious/noExplicitAny: InMemory repository method not in interface
    const buildingSchemas = (repositories.schema as any).getAllBuildingSchemas()
    logger.info('=== BUILDING SCHEMAS DATA ===')
    buildingSchemas.forEach((buildingSchema) => {
      logger.info(`🏗️ Building Schema ID: ${buildingSchema.id}`)
      logger.info(`   Design Session ID: ${buildingSchema.designSessionId}`)
      logger.info(`   Organization ID: ${buildingSchema.organizationId}`)
      logger.info(`   Latest Version: ${buildingSchema.latestVersionNumber}`)
      logger.info(`   Updated At: ${buildingSchema.updatedAt}`)
      logger.info(
        `   Schema Tables: ${Object.keys(buildingSchema.schema.tables || {}).length}`,
      )
      if (currentLogLevel === 'DEBUG') {
        logger.debug('   Full Schema:', { schema: buildingSchema.schema })
      }
    })
    logger.info('=== END BUILDING SCHEMAS DATA ===\n')
  }

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
        'pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts --memory',
        'AGENT_MODE=memory pnpm --filter @liam-hq/agent tsx scripts/executeDeepModelingProcess.ts',
      ],
    )
    process.exit(0)
  }

  logger.info(
    `Starting Deep Modeling process execution (log level: ${currentLogLevel})`,
  )

  executeDeepModelingProcess()
    .then((result) => {
      if (result.isErr()) {
        logger.error(`FAILED: ${result.error.message}`)
        process.exit(1)
      } else {
      }
    })
    .catch((error) => {
      logger.error(
        `UNCAUGHT EXCEPTION: ${error instanceof Error ? error.message : String(error)}`,
      )
      process.exit(1)
    })
}
