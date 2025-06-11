import type { AnswerGenerationPayload } from '../../../../../jobs/src/functions/processAnswerGeneration'
import type { WorkflowState } from '../types'

/**
 * Service for triggering background jobs via Trigger.dev
 */
class TriggerService {
  /**
   * Trigger answer generation background job
   */
  async triggerAnswerGeneration(
    state: WorkflowState,
    designSessionId: string,
  ): Promise<{
    jobId: string
    triggerJobId?: string
    publicAccessToken?: string
  }> {
    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare payload for Trigger.dev
    const payload: AnswerGenerationPayload = {
      userInput: state.userInput,
      history: state.history,
      schemaData: state.schemaData,
      projectId: state.projectId,
      buildingSchemaId: state.buildingSchemaId,
      latestVersionNumber: state.latestVersionNumber,
      organizationId: state.organizationId,
      userId: state.userId,
      schemaText: state.schemaText,
      formattedChatHistory: state.formattedChatHistory,
      agentName: state.agentName,
      jobId,
      designSessionId,
    }

    // Trigger the actual Trigger.dev job and get the real job ID and public access token
    const triggerResult = await this.triggerRealJob(payload)

    return triggerResult ? { jobId, ...triggerResult } : { jobId }
  }

  /**
   * Trigger real Trigger.dev job
   */
  private async triggerRealJob(
    payload: AnswerGenerationPayload,
  ): Promise<{ triggerJobId: string; publicAccessToken: string } | undefined> {
    try {
      // Check if we're in a Trigger.dev environment
      if (!process.env['TRIGGER_SECRET_KEY']) {
        this.simulateBackgroundJob(payload)
        return undefined
      }

      // Import Trigger.dev task directly
      const { generateAnswerTask } = await import(
        '../../../../../jobs/src/trigger/jobs'
      )

      // Trigger the task directly
      const triggerResult = await generateAnswerTask.trigger(payload)

      // Return the Trigger.dev job ID and public access token
      return {
        triggerJobId: triggerResult.id,
        publicAccessToken: triggerResult.publicAccessToken,
      }
    } catch (_error) {
      this.simulateBackgroundJob(payload)
      return undefined
    }
  }

  /**
   * Simulate background job execution for development
   * In production, this would be replaced with actual Trigger.dev API call
   */
  private simulateBackgroundJob(payload: AnswerGenerationPayload): void {
    // Execute immediately in background
    setImmediate(async () => {
      try {
        await this.executeBackgroundJob(payload)
      } catch (_error) {
        // Background job execution failed
      }
    })
  }

  /**
   * Execute the background job processing
   */
  private async executeBackgroundJob(
    payload: AnswerGenerationPayload,
  ): Promise<void> {
    try {
      // Simulate processing delay (shorter for better UX)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Import the actual processing function
      const { processAnswerGeneration } = await import(
        '../../../../../jobs/src/functions/processAnswerGeneration'
      )

      // Execute the processing
      await processAnswerGeneration(payload)
    } catch (error) {
      // Handle processing error
      console.error('Background job execution failed:', error)
    }
  }
}

/**
 * Singleton instance
 */
export const triggerService = new TriggerService()
