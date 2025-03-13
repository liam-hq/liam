import { getPullRequestFiles } from '@/libs/github/api'
import { prisma } from '@liam-hq/db'

export type SavePullRequestPayload = {
  prNumber: number
  owner: string
  name: string
  repositoryId: number
}

export type SavePullRequestResult = {
  success: boolean
  prId: number
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

  return {
    success: true,
    prId: prRecord.id,
    schemaChanges,
  }
}
