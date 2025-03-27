import crypto from 'node:crypto'
import type { FileChange } from '@/types/github'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'

const createOctokit = async (installationId: number) => {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      installationId,
    },
  })

  return octokit
}

export const getPullRequestDetails = async (
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
) => {
  const octokit = await createOctokit(installationId)

  const { data: pullRequest } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  })

  return pullRequest
}

export const getPullRequestFiles = async (
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<FileChange[]> => {
  const octokit = await createOctokit(installationId)

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  })

  return files.map(
    (file: {
      filename: string
      status:
        | 'added'
        | 'removed'
        | 'modified'
        | 'renamed'
        | 'copied'
        | 'changed'
        | 'unchanged'
      additions: number
      deletions: number
      changes: number
      patch?: string | undefined
    }) => {
      const extension = file.filename.split('.').pop() || 'unknown'

      return {
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        fileType: extension,
        patch: file.patch || '',
      }
    },
  )
}

export const createPullRequestComment = async (
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
) => {
  const octokit = await createOctokit(installationId)

  const response = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  })

  return response.data
}

export const updatePullRequestComment = async (
  installationId: number,
  owner: string,
  repo: string,
  commentId: number,
  body: string,
) => {
  const octokit = await createOctokit(installationId)

  const response = await octokit.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body,
  })

  return response.data
}

export const verifyWebhookSignature = (
  payload: string,
  signature: string,
): boolean => {
  const hmac = crypto.createHmac(
    'sha256',
    process.env.GITHUB_WEBHOOK_SECRET || '',
  )
  const digest = `sha256=${hmac.update(payload).digest('hex')}`

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export const getRepository = async (
  projectId: string,
  installationId: number,
) => {
  const [owner, repo] = projectId.split('/')
  if (!owner || !repo) throw new Error('Invalid project ID format')

  const octokit = await createOctokit(installationId)
  const { data } = await octokit.repos.get({
    owner,
    repo,
  })

  return data
}

export const getFileContent = async (
  repositoryFullName: string,
  filePath: string,
  ref: string,
  installationId: number,
): Promise<string | null> => {
  const [owner, repo] = repositoryFullName.split('/')

  if (!owner || !repo) {
    console.error('Invalid repository format:', repositoryFullName)
    return null
  }

  const octokit = await createOctokit(installationId)

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref,
    })

    if ('type' in data && data.type === 'file' && 'content' in data) {
      return Buffer.from(data.content, 'base64').toString('utf-8')
    }

    console.warn('Not a file:', filePath)
    return null
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}:`, error)
    return null
  }
}

export const getFileContentWithSha = async (
  repositoryFullName: string,
  filePath: string,
  ref: string,
  installationId: number,
): Promise<{ content: string | null; sha: string | null }> => {
  const [owner, repo] = repositoryFullName.split('/')

  if (!owner || !repo) {
    console.error('Invalid repository format:', repositoryFullName)
    return { content: null, sha: null }
  }

  const octokit = await createOctokit(installationId)

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref,
    })

    if ('type' in data && data.type === 'file' && 'content' in data) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
      }
    }

    console.warn('Not a file:', filePath)
    return { content: null, sha: null }
  } catch (error) {
    console.error(`Error fetching file content for ${filePath}:`, error)
    return { content: null, sha: null }
  }
}

export const updateFileContent = async (
  repositoryFullName: string,
  filePath: string,
  content: string,
  sha: string,
  message: string,
  installationId: number,
  branch = 'tmp-knowledge-suggestion',
): Promise<boolean> => {
  const [owner, repo] = repositoryFullName.split('/')

  if (!owner || !repo) {
    console.error('Invalid repository format:', repositoryFullName)
    return false
  }

  const octokit = await createOctokit(installationId)

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    })

    return true
  } catch (error) {
    console.error(`Error updating file content for ${filePath}:`, error)
    return false
  }
}
