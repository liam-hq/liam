#!/usr/bin/env tsx

import * as fs from 'node:fs'
import * as path from 'node:path'
import { END } from '@langchain/langgraph'
import type { Result } from 'neverthrow'
import { err, ok, okAsync } from 'neverthrow'
import { DEFAULT_RECURSION_LIMIT } from '../src/constants'
import { createQaAgentGraph } from '../src/qa-agent/createQaAgentGraph'
import type { WorkflowState } from '../src/types'
import { hasHelpFlag, parseQaAgentArgs } from './shared/argumentParser'
import {
  createLogger,
  getLogLevel,
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
 * Create workflow state
 */
type CreateWorkflowStateInput = SetupDatabaseAndUserResult & {
  buildingSchema: { id: string; latest_version_number: number }
  designSession: { id: string; name: string }
}

const createWorkflowState = (
  setupData: CreateWorkflowStateInput,
  customUserInput?: string,
) => {
  const { organization, buildingSchema, designSession, user } = setupData

  // Load initial state from fixtures
  const fixturePath = path.join(
    __dirname,
    'fixtures',
    'qa-agent-initial-state.json',
  )
  const fixtureData = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'))
  const {
    userInput: defaultUserInput,
    analyzedRequirements,
    schemaData,
  } = fixtureData

  // Use custom user input if provided, otherwise use from fixture
  const userInput = customUserInput || defaultUserInput

  const workflowState: WorkflowState = {
    userInput,
    // Why: QA agent doesn't need the original user input in messages.
    // It operates solely based on analyzedRequirements which provides
    // the structured context needed for test generation.
    // TODO: Create QA-specific annotation to remove userInput field entirely
    messages: [],
    schemaData,
    testcases: [],
    buildingSchemaId: buildingSchema.id,
    latestVersionNumber: buildingSchema.latest_version_number,
    designSessionId: designSession.id,
    userId: user.id,
    organizationId: organization.id,
    analyzedRequirements,
    next: END,
  }

  return okAsync({
    ...setupData,
    workflowState,
  })
}

/**
 * Main execution function
 */
const executeQaAgent = async (
  customPrompt?: string,
): Promise<Result<void, Error>> => {
  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(findOrCreateDesignSession())
    .andThen((data) => createWorkflowState(data, customPrompt))

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
  const graph = createQaAgentGraph(repositories.schema.checkpointer)

  // Use streaming with proper async iterator handling
  const streamResult = await (async () => {
    const stream = await graph.stream(workflowState, {
      configurable: config.configurable,
      recursionLimit: DEFAULT_RECURSION_LIMIT,
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

  logger.info('QA workflow completed')

  // Log the session_id for reference
  const sessionId = workflowState.designSessionId
  logger.info(`Session ID: ${sessionId}`)

  return ok(undefined)
}

// Execute if this file is run directly
if (require.main === module) {
  // Parse command line arguments
  const { prompt } = parseQaAgentArgs()

  // Show usage information
  if (hasHelpFlag()) {
    showHelp(
      'executeQaAgent.ts',
      `Executes the QA agent workflow for database schema testing and validation.
  This script creates a QA session and runs the QA workflow including
  use case generation, DML preparation, and schema validation.
  Uses pre-generated schema and requirements from fixtures.

  Additional Options:
    --prompt, -p <text>     Custom prompt for the AI`,
      [
        'pnpm --filter @liam-hq/agent execute-qa-agent',
        'pnpm --filter @liam-hq/agent execute-qa-agent --prompt "Test specific edge cases"',
        'pnpm --filter @liam-hq/agent execute-qa-agent:debug',
      ],
    )
    process.exit(0)
  }

  logger.info(`Starting QA agent execution (log level: ${currentLogLevel})`)

  executeQaAgent(prompt).then((result) => {
    if (result.isErr()) {
      logger.error(`FAILED: ${result.error.message}`)
      process.exit(1)
    }

    logger.info('QA session completed successfully')
  })
}
