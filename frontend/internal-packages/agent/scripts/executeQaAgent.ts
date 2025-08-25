#!/usr/bin/env tsx

import { HumanMessage } from '@langchain/core/messages'
import type { Schema } from '@liam-hq/schema'
import type { Result } from 'neverthrow'
import { err, ok, okAsync } from 'neverthrow'
import { DEFAULT_RECURSION_LIMIT } from '../src/chat/workflow/shared/langGraphUtils'
import type { WorkflowState } from '../src/chat/workflow/types'
import { createQaAgentGraph } from '../src/qa-agent/createQaAgentGraph'
import { hasHelpFlag, parseDesignProcessArgs } from './shared/argumentParser'
import {
  createLogger,
  getBusinessManagementSystemUserInput,
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
  _isResume = false,
) => {
  const { organization, buildingSchema, designSession, user } = setupData

  // Sample schema with some tables for QA testing
  const sampleSchema: Schema = {
    tables: {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'uuid',
            notNull: true,
            default: 'gen_random_uuid()',
            check: null,
            comment: null,
          },
          email: {
            name: 'email',
            type: 'varchar(255)',
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          name: {
            name: 'name',
            type: 'varchar(255)',
            notNull: false,
            default: null,
            check: null,
            comment: null,
          },
          created_at: {
            name: 'created_at',
            type: 'timestamp',
            notNull: true,
            default: 'now()',
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          users_pkey: {
            type: 'PRIMARY KEY' as const,
            name: 'users_pkey',
            columnNames: ['id'],
          },
          users_email_key: {
            type: 'UNIQUE' as const,
            name: 'users_email_key',
            columnNames: ['email'],
          },
        },
      },
      posts: {
        name: 'posts',
        columns: {
          id: {
            name: 'id',
            type: 'uuid',
            notNull: true,
            default: 'gen_random_uuid()',
            check: null,
            comment: null,
          },
          user_id: {
            name: 'user_id',
            type: 'uuid',
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          title: {
            name: 'title',
            type: 'varchar(255)',
            notNull: true,
            default: null,
            check: null,
            comment: null,
          },
          content: {
            name: 'content',
            type: 'text',
            notNull: false,
            default: null,
            check: null,
            comment: null,
          },
          created_at: {
            name: 'created_at',
            type: 'timestamp',
            notNull: true,
            default: 'now()',
            check: null,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {
          posts_pkey: {
            type: 'PRIMARY KEY' as const,
            name: 'posts_pkey',
            columnNames: ['id'],
          },
          posts_user_id_fkey: {
            type: 'FOREIGN KEY' as const,
            name: 'posts_user_id_fkey',
            columnNames: ['user_id'],
            targetTableName: 'users',
            targetColumnNames: ['id'],
            updateConstraint: 'NO_ACTION' as const,
            deleteConstraint: 'CASCADE' as const,
          },
        },
      },
    },
    enums: {},
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
    // Add analyzed requirements for QA agent
    analyzedRequirements: {
      businessRequirement: 'Test the user and posts management system',
      functionalRequirements: {
        'User Management': [
          'Users can register with email and name',
          'Users can create posts',
          'Posts are linked to users',
        ],
        'Content Management': [
          'Posts have title and content',
          'Posts track creation time',
          'Posts are deleted when user is deleted',
        ],
      },
      nonFunctionalRequirements: {
        'Data Integrity': [
          'Email must be unique',
          'User ID is required for posts',
          'Cascade delete for referential integrity',
        ],
      },
    },
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
  resumeSessionId?: string,
): Promise<Result<void, Error>> => {
  const setupResult = await validateEnvironment()
    .andThen(setupDatabaseAndUser(logger))
    .andThen(findOrCreateDesignSession(resumeSessionId))
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

  // Log the session_id for future reference when resuming sessions
  const sessionId = workflowState.designSessionId
  logger.info(`Session ID: ${sessionId}`)
  logger.info(`To resume this session later, use: --session-id ${sessionId}`)

  return ok(undefined)
}

// Execute if this file is run directly
if (require.main === module) {
  // Parse command line arguments
  const { prompt, sessionId } = parseDesignProcessArgs()

  // Show usage information
  if (hasHelpFlag()) {
    showHelp(
      'executeQaAgent.ts',
      `Executes the QA agent workflow for database schema testing and validation.
  This script creates a QA session and runs the QA workflow including
  use case generation, DML preparation, and schema validation.

  Additional Options:
    --prompt, -p <text>     Custom prompt for the AI
    --session-id, -s <id>   Resume from existing session (session ID)`,
      [
        'pnpm --filter @liam-hq/agent execute-qa-agent',
        'pnpm --filter @liam-hq/agent execute-qa-agent --prompt "Test user management system"',
        'pnpm --filter @liam-hq/agent execute-qa-agent --session-id abc-123 --prompt "Add more test cases"',
        'pnpm --filter @liam-hq/agent execute-qa-agent:debug',
      ],
    )
    process.exit(0)
  }

  logger.info(`Starting QA agent execution (log level: ${currentLogLevel})`)

  executeQaAgent(prompt, sessionId).then((result) => {
    if (result.isErr()) {
      logger.error(`FAILED: ${result.error.message}`)
      process.exit(1)
    }

    logger.info('QA session completed successfully')
  })
}
