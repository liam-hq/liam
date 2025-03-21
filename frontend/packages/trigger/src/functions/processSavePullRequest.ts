import {
  getFileContent,
  getPullRequestDetails,
  getPullRequestFiles,
} from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import { minimatch } from 'minimatch'

export type SavePullRequestPayload = {
  prNumber: number
  pullRequestTitle: string
  owner: string
  name: string
  repositoryId: number
}

export type SavePullRequestResult = {
  success: boolean
  prId: number
  schemaFiles: Array<{
    filename: string
    content: string
  }>
  schemaChanges: Array<{
    filename: string
    status:
      | 'added'
      | 'modified'
      | 'deleted'
      | 'removed'
      | 'renamed'
      | 'copied'
      | 'changed'
      | 'unchanged'
    changes: number
    patch: string
  }>
}

export async function processSavePullRequest(
  payload: SavePullRequestPayload,
): Promise<SavePullRequestResult> {
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

  const fileChanges = await getPullRequestFiles(
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

  const prDetails = await getPullRequestDetails(
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
        const content = await getFileContent(
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
      status: file.status,
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
