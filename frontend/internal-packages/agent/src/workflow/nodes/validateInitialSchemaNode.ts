import { randomUUID } from 'node:crypto'
import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ChatMessage } from '@langchain/core/messages'
import { RunnableLambda } from '@langchain/core/runnables'
import { END } from '@langchain/langgraph'
import { executeQuery } from '@liam-hq/pglite-server'
import { isEmptySchema, postgresqlSchemaDeparser } from '@liam-hq/schema'
import { SSE_EVENTS } from '../../client'
import type { WorkflowState } from '../../types'

/**
 * Message templates for DatabaseManager
 */
const MESSAGE_TEMPLATES = {
  EMPTY_SCHEMA_SUCCESS:
    '**Instant Database Ready**\n\nFresh PostgreSQL environment initialized.\nReady to design your schema from scratch.',
  EXISTING_SCHEMA_SUCCESS:
    '**Instant Database Ready**\n\nLive PostgreSQL environment with your schema active.\nSchema design operations enabled.',
  VALIDATION_ERROR: (errorDetails: string, errorType: 'ddl' | 'sql' = 'sql') =>
    `**Instant Database Startup Failed**

Schema validation errors detected:

\`\`\`${errorType}
${errorDetails}
\`\`\`

**Required Actions:**
- Fix schema syntax errors
- Update schema definition  
- Resubmit request after corrections

Thank you for helping us create the perfect database environment for your project.`,
} as const

type MessageType = 'error' | 'success' | 'info'

async function createAndDispatchMessage(
  content: string,
  state: WorkflowState,
  messageType: MessageType,
  next?: string | typeof END,
): Promise<WorkflowState> {
  const message = new ChatMessage({
    id: randomUUID(),
    content,
    role: 'operational',
    additional_kwargs: {
      messageType,
    },
  })

  await dispatchCustomEvent(SSE_EVENTS.MESSAGES, message)

  return {
    ...state,
    messages: [...state.messages, message],
    ...(next && { next }),
  }
}

async function validateInitialSchemaLogic(
  state: WorkflowState,
): Promise<WorkflowState> {
  if (isEmptySchema(state.schemaData)) {
    return await createAndDispatchMessage(
      MESSAGE_TEMPLATES.EMPTY_SCHEMA_SUCCESS,
      state,
      'info',
      'leadAgent',
    )
  }

  const ddlResult = postgresqlSchemaDeparser(state.schemaData)

  if (ddlResult.errors.length > 0) {
    const errorDetails = ddlResult.errors
      .map((error) => error.message)
      .join('; ')

    return await createAndDispatchMessage(
      MESSAGE_TEMPLATES.VALIDATION_ERROR(errorDetails, 'ddl'),
      state,
      'error',
      END,
    )
  }

  const ddlStatements = ddlResult.value
  const requiredExtensions = Object.keys(
    state.schemaData.extensions || {},
  ).sort()

  const validationResults = await executeQuery(
    ddlStatements,
    requiredExtensions,
  )

  const failedResult = validationResults.find((result) => !result.success)
  if (failedResult) {
    const errorDetails = JSON.stringify(failedResult.result)

    return await createAndDispatchMessage(
      MESSAGE_TEMPLATES.VALIDATION_ERROR(errorDetails, 'sql'),
      state,
      'error',
      END,
    )
  }

  return await createAndDispatchMessage(
    MESSAGE_TEMPLATES.EXISTING_SCHEMA_SUCCESS,
    state,
    'info',
  )
}

/**
 * Validates initial schema and provides Instant Database initialization experience.
 * Only runs on first workflow execution.
 * Exported as RunnableLambda to enable dispatchCustomEvent usage.
 */
export const validateInitialSchemaNode = RunnableLambda.from(
  validateInitialSchemaLogic,
)
