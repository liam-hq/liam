import { prisma } from '@liam-hq/db'
import { minimatch } from 'minimatch'
import type { SavePullRequestPayload, SavePullRequestResult } from '../types'

type GithubAPI = {
  getFileContent: (
    repoFullName: string,
    filePath: string,
    ref: string,
    installationId: number,
  ) => Promise<string | null>
  getPullRequestDetails: (
    installationId: number,
    owner: string, 
    repo: string,
    pullNumber: number,
  ) => Promise<{
    head: {
      ref: string
    }
  }>
  getPullRequestFiles: (
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
  ) => Promise<Array<{
    filename: string
    status: string
    changes: number
    patch?: string
  }>>
}

export const processSavePullRequest = (githubAPI: GithubAPI) => async (
  payload: SavePullRequestPayload,
): Promise<SavePullRequestResult> => {
  const repository = await prisma.repository.findUnique({
    where: {
      owner_name: {
        owner: payload.owner,
        name: payload.name,
      },
    },
  })

  if (!repository) {
    throw new Error('Repository not found')
  }

  const fileChanges = await githubAPI.getPullRequestFiles(
    // bigint to number
    Number(repository.installationId.toString()),
    repository.owner,
    repository.name,
    payload.prNumber,
  )

  const projectMappings = await prisma.projectRepositoryMapping.findMany({
    where: {
      repositoryId: repository.id,
    },
    include: {
      project: {
        include: {
          watchSchemaFilePatterns: true,
        },
      },
    },
  })

  const allPatterns = projectMappings.flatMap(
    (mapping) => mapping.project.watchSchemaFilePatterns,
  )

  const matchedFiles = fileChanges.filter((file) =>
    allPatterns.some((pattern) => minimatch(file.filename, pattern.pattern)),
  )

  const prDetails = await githubAPI.getPullRequestDetails(
    Number(repository.installationId),
    repository.owner,
    repository.name,
    payload.prNumber,
  )

  const schemaFiles: Array<{
    filename: string
    content: string
  }> = await Promise.all(
    matchedFiles.map(async (file) => {
      try {
        const content = await githubAPI.getFileContent(
          `${repository.owner}/${repository.name}`,
          file.filename,
          prDetails.head.ref,
          Number(repository.installationId),
        )
        return {
          filename: file.filename,
          content: content ?? '',
        }
      } catch (error) {
        console.error(`Error fetching content for ${file.filename}:`, error)
        return {
          filename: file.filename,
          content: '',
        }
      }
    }),
  )

  const schemaChanges = fileChanges.map((file) => {
    return {
      filename: file.filename,
      status: file.status as any, // Type cast to match our expected types
      changes: file.changes,
      patch: file?.patch || '',
    }
  })

  // Save or update PR record
  const prRecord = await prisma.pullRequest.upsert({
    where: {
      repositoryId_pullNumber: {
        repositoryId: repository.id,
        pullNumber: BigInt(payload.prNumber),
      },
    },
    update: {},
    create: {
      repositoryId: repository.id,
      pullNumber: BigInt(payload.prNumber),
    },
  })
  await prisma.migration.upsert({
    where: {
      pullRequestId: prRecord.id,
    },
    update: {
      title: payload.pullRequestTitle,
    },
    create: {
      pullRequestId: prRecord.id,
      title: payload.pullRequestTitle,
    },
  })

  return {
    success: true,
    prId: prRecord.id,
    schemaFiles,
    schemaChanges,
  }
} 