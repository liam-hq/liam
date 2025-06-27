import type { ChatProcessorParams, NodeLogger } from '@liam-hq/agent'
import { createSupabaseRepositories, processChatMessage } from '@liam-hq/agent'
import { logger, task } from '@trigger.dev/sdk'
import { createClient } from '../libs/supabase'

// Define type excluding repositories and schemaData
type ChatJobPayload = Omit<ChatProcessorParams, 'repositories' | 'schemaData'>

function createWorkflowLogger(): NodeLogger {
  return {
    debug: (message: string, metadata?: Record<string, unknown>) => {
      logger.debug(message, metadata)
    },
    log: (message: string, metadata?: Record<string, unknown>) => {
      logger.log(message, metadata)
    },
    info: (message: string, metadata?: Record<string, unknown>) => {
      logger.info(message, metadata)
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
      logger.warn(message, metadata)
    },
    error: (message: string, metadata?: Record<string, unknown>) => {
      logger.error(message, metadata)
    },
  }
}

const createInitialProgressItem = async (
  repositories: ReturnType<typeof createSupabaseRepositories>,
  designSessionId: string,
  content: string,
): Promise<string | null> => {
  try {
    const result = await repositories.schema.createTimelineItem({
      content,
      type: 'progress',
      designSessionId,
      progress: 0,
    })
    if (result.success) {
      return result.timelineItem.id
    }
    return null
  } catch (error) {
    logger.warn('Failed to create progress timeline item:', { error })
    return null
  }
}

const updateProgressItem = async (
  repositories: ReturnType<typeof createSupabaseRepositories>,
  progressTimelineItemId: string | null,
  content: string,
  progress: number,
): Promise<void> => {
  if (!progressTimelineItemId) {
    logger.warn('No progress timeline item ID available for update')
    return
  }

  try {
    await repositories.schema.updateTimelineItem(progressTimelineItemId, {
      content,
      progress,
    })
  } catch (error) {
    logger.warn('Failed to update progress timeline item:', { error })
  }
}

export const processChatTask = task({
  id: 'process-chat-message',
  run: async (payload: ChatJobPayload) => {
    logger.log('Starting chat processing job:', {
      buildingSchemaId: payload.buildingSchemaId,
      messageLength: payload.message.length,
    })

    // Create fresh repositories in job to avoid serialization issues
    // When repositories are passed from API Route to Job, class instances lose their methods
    // during JSON serialization/deserialization, causing "createMessage is not a function" errors
    const supabaseClient = createClient()
    const repositories = createSupabaseRepositories(supabaseClient)

    // Create initial progress timeline item
    const progressTimelineItemId = await createInitialProgressItem(
      repositories,
      payload.designSessionId,
      'Starting job...',
    )

    const schemaResult = await repositories.schema.getSchema(
      payload.designSessionId,
    )
    if (schemaResult.error || !schemaResult.data) {
      throw new Error(`Failed to fetch schema data: ${schemaResult.error}`)
    }

    // Create progress callback for workflow nodes
    const onNodeProgress = async (nodeName: string, progress: number) => {
      await updateProgressItem(
        repositories,
        progressTimelineItemId,
        `Processing: ${nodeName}`,
        progress,
      )
    }

    const chatParams: ChatProcessorParams = {
      ...payload,
      repositories,
      schemaData: schemaResult.data.schema,
    }

    const workflowLogger = createWorkflowLogger()

    const result = await processChatMessage(
      chatParams,
      workflowLogger,
      onNodeProgress,
    )

    logger.log('Chat processing completed:', {
      success: result.success,
    })

    return result
  },
})
