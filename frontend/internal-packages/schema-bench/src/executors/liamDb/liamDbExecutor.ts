import { deepModeling } from '@liam-hq/agent'
import { InMemoryRepository } from '@liam-hq/agent/src/repositories/InMemoryRepository.ts'
import { DebugCallbackHandler } from '@liam-hq/agent/src/utils/debugCallbackHandler.ts'
import type { Schema } from '@liam-hq/db-structure'
import { aSchema } from '@liam-hq/db-structure'
import { err, ok, type Result } from 'neverthrow'
import type {
  LiamDbExecutorInput,
  LiamDbExecutorOutput,
} from './types.ts'

export async function execute(
  input: LiamDbExecutorInput,
): Promise<Result<LiamDbExecutorOutput, Error>> {
  console.info(`Processing input: ${input.input.substring(0, 100)}...`)

  // Setup InMemory repository
  const repositories = {
    schema: new InMemoryRepository({
      schemas: {
        'demo-design-session': aSchema({
          tables: {},
        }),
      },
      designSessions: {
        'demo-design-session': {},
      },
      workflowRuns: {},
    }),
  }

  // Create workflow state
  const workflowState = {
    userInput: input.input,
    messages: [],
    schemaData: aSchema({ tables: {} }),
    history: [] satisfies [string, string][],
    organizationId: 'demo-org-id',
    buildingSchemaId: 'demo-design-session',
    latestVersionNumber: 1,
    designSessionId: 'demo-design-session',
    userId: 'demo-user-id',
    retryCount: {},
  }

  // Setup debug callback
  const debugCallback = new DebugCallbackHandler({
    debug: console.debug,
    // biome-ignore lint/suspicious/noConsole: Required for deep modeling workflow logging
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  })

  const config = {
    configurable: {
      repositories,
      logger: {
        debug: console.debug,
        // biome-ignore lint/suspicious/noConsole: Required for deep modeling workflow logging
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
    },
    callbacks: [debugCallback],
  }

  // Execute deep modeling workflow
  const result = await deepModeling(workflowState, config)

  if (result.isErr()) {
    return err(new Error(`Deep modeling failed: ${result.error.message}`))
  }

  const finalWorkflowState = result.value

  // Get the latest schema from repository
  let finalSchemaData = finalWorkflowState.schemaData
  const latestSchemaResult = await repositories.schema.getSchema(
    finalWorkflowState.buildingSchemaId,
  )

  if (latestSchemaResult.isOk()) {
    finalSchemaData = latestSchemaResult.value.schema
  }

  // Convert Schema to LiamDbExecutorOutput format
  const output: LiamDbExecutorOutput = convertSchemaToOutput(finalSchemaData)

  return ok(output)
}

function convertSchemaToOutput(schema: Schema): LiamDbExecutorOutput {
    // biome-ignore lint/suspicious/noExplicitAny: Legacy compatibility with existing output format
    const tables: Record<string, any> = {}

    for (const [tableName, table] of Object.entries(schema.tables)) {
      tables[tableName] = {
        name: tableName,
        columns: table.columns,
        comment: table.comment,
        indexes: table.indexes || {},
        constraints: table.constraints || {},
      }
    }

    return {
      tables,
      message: 'LiamDB executor with deepModeling integration',
      timestamp: new Date().toISOString(),
    }
}
