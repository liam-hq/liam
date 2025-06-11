export interface BackgroundJobStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  generatedAnswer?: string
  error?: string
  createdAt: string
  completedAt?: string
}
