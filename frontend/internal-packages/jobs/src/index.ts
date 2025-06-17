import { configure } from '@trigger.dev/sdk'

export { analyzeRepositoryTask } from './trigger/jobs'
export { processChatTask } from './trigger/chatJobs'

if (
  process.env['NEXT_PUBLIC_ENV_NAME'] === 'preview' &&
  process.env['VERCEL_GIT_COMMIT_REF']
) {
  configure({
    previewBranch: process.env['VERCEL_GIT_COMMIT_REF'],
  })
}
