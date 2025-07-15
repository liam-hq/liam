import { configure } from '@trigger.dev/sdk'

export type { DeepModelingPayload } from './trigger/deepModelingWorkflowTask'
export { deepModelingWorkflowTask } from './trigger/deepModelingWorkflowTask'
export { analyzeRepositoryTask } from './trigger/jobs'

if (
  process.env['NEXT_PUBLIC_ENV_NAME'] === 'preview' &&
  process.env['VERCEL_GIT_COMMIT_REF']
) {
  configure({
    previewBranch: process.env['VERCEL_GIT_COMMIT_REF'],
  })
}
