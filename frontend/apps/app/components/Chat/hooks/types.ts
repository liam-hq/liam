export interface TriggerJobResult {
  jobId: string
  success: boolean
  generatedAnswer?: string
  error?: string
  processedAt: string
}
