import { configure } from '@trigger.dev/sdk'

export { processChatTask } from './trigger/chatJobs'
export { analyzeRepositoryTask } from './trigger/jobs'

if (
  process.env['NEXT_PUBLIC_ENV_NAME'] === 'preview' &&
  process.env['VERCEL_GIT_COMMIT_REF']
) {
  configure({
    previewBranch: process.env['VERCEL_GIT_COMMIT_REF'],
  })
}
