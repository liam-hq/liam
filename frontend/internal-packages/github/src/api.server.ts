import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'
import type { FileChange } from './types'

const createOctokit = async (installationId: number) => {
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env['GITHUB_APP_ID'],
      privateKey: process.env['GITHUB_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
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

/**
 * Gets comments from a GitHub issue or pull request
 * @returns Array of issue comments
 */
export const getIssueComments = async (
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number,
) => {
  const octokit = await createOctokit(installationId)

  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  })

  return comments
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

/**
 * Gets file content and SHA from GitHub repository
 * @returns Object containing content and SHA
 */
export const getFileContent = async (
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
    // Handle 404 errors silently as they're expected when files don't exist
    const isNotFoundError =
      (error instanceof Error && 'status' in error && error.status === 404) ||
      (error instanceof Error && error.message.includes('Not Found')) ||
      (typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 404)

    if (isNotFoundError) {
      console.info(
        `File not found: ${filePath} in ${repositoryFullName}@${ref}`,
      )
    } else {
      // Log other errors as they might indicate actual problems
      console.error(`Error fetching file content for ${filePath}:`, error)
    }
    return { content: null, sha: null }
  }
}

export const getRepositoryBranches = async (
  installationId: number,
  owner: string,
  repo: string,
) => {
  const octokit = await createOctokit(installationId)

  const { data: branches } = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  })

  return branches
}

/**
 * Creates a new file in the GitHub repository
 * @returns Object containing success status and SHA of the created file
 */
/**
 * Creates or updates a file in the GitHub repository
 * @param sha If provided, updates an existing file. If not provided, creates a new file.
 * @returns Object containing success status and SHA of the created/updated file
 */
export const createOrUpdateFileContent = async (
  repositoryFullName: string,
  filePath: string,
  content: string,
  message: string,
  installationId: number,
  branch = 'main',
  sha?: string,
): Promise<{ success: boolean; sha: string | null }> => {
  const [owner, repo] = repositoryFullName.split('/')

  if (!owner || !repo) {
    console.error('Invalid repository format:', repositoryFullName)
    return { success: false, sha: null }
  }

  const octokit = await createOctokit(installationId)

  try {
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    })

    return {
      success: true,
      sha: response.data.content?.sha || null,
    }
  } catch (error) {
    console.error(`Error creating/updating file ${filePath}:`, error)
    return { success: false, sha: null }
  }
}

/**
 * Gets the latest commit information for a repository
 * @returns Latest commit details or null
 */
export const getLastCommit = async (
  installationId: number,
  owner: string,
  repo: string,
  branch = 'main',
): Promise<{
  sha: string
  date: string
  message: string
  author: string
} | null> => {
  const octokit = await createOctokit(installationId)

  try {
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: 1, // Only need the latest commit
    })

    if (!commits || commits.length === 0) {
      return null
    }

    const latestCommit = commits[0]
    if (!latestCommit || !latestCommit.commit) {
      return null
    }

    return {
      sha: latestCommit.sha || '',
      date:
        latestCommit.commit.committer?.date ||
        latestCommit.commit.author?.date ||
        '',
      message: latestCommit.commit.message || '',
      author:
        latestCommit.commit.author?.name ||
        latestCommit.commit.committer?.name ||
        '',
    }
  } catch (error) {
    console.error(`Error fetching latest commit for ${owner}/${repo}:`, error)
    return null
  }
}

/**
 * Gets organization information for a repository
 * @returns Organization avatar URL or null
 */
export const getOrganizationInfo = async (
  installationId: number,
  owner: string,
  repo: string,
): Promise<{ avatar_url: string } | null> => {
  const octokit = await createOctokit(installationId)

  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    })

    return {
      avatar_url: data.organization?.avatar_url || '',
    }
  } catch (error) {
    console.error(
      `Error fetching organization info for ${owner}/${repo}:`,
      error,
    )
    return null
  }
}
