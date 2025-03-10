import {
  createPullRequestComment,
  getPullRequestFiles,
  updatePullRequestComment,
  verifyWebhookSignature,
} from '@/libs/github/api'
import { supportedEvents, validateConfig } from '@/libs/github/config'
import type { GitHubWebhookPayload } from '@/types/github'
import { PrismaClient } from '@prisma/client'
import { type NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { valid, missing } = validateConfig()
    if (!valid) {
      console.error(
        `Missing required environment variables: ${missing.join(', ')}`,
      )
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const payload = await request.text()

    const signature = request.headers.get('x-hub-signature-256') || ''
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(payload) as GitHubWebhookPayload

    const event = request.headers.get('x-github-event') || ''
    const action = data.action
    const eventType = `${event}.${action}`

    if (event !== 'pull_request' || !supportedEvents.includes(eventType)) {
      return NextResponse.json(
        { message: `Event ${eventType} is not supported` },
        { status: 200 },
      )
    }

    const pullRequest = data.pull_request
    if (!pullRequest) {
      return NextResponse.json(
        { error: 'Pull request data is missing' },
        { status: 400 },
      )
    }

    const installationId = data.installation.id
    const owner = data.repository.owner.login
    const repo = data.repository.name
    const pullNumber = pullRequest.number

    const files = await getPullRequestFiles(
      installationId,
      owner,
      repo,
      pullNumber,
    )

    const prRecord = await prisma.pullRequest.findUnique({
      where: {
        repositoryOwner_repositoryName_pullNumber: {
          repositoryOwner: owner,
          repositoryName: repo,
          pullNumber: pullNumber,
        },
      },
    })

    const comment = `Your pull request is detected by Liam Migration. ${files.length} files are changed.`

    if (prRecord?.commentId) {
      await updatePullRequestComment(
        installationId,
        owner,
        repo,
        prRecord.commentId,
        comment,
      )
    } else {
      const commentResponse = await createPullRequestComment(
        installationId,
        owner,
        repo,
        pullNumber,
        comment,
      )

      await prisma.pullRequest.upsert({
        where: {
          repositoryOwner_repositoryName_pullNumber: {
            repositoryOwner: owner,
            repositoryName: repo,
            pullNumber: pullNumber,
          },
        },
        update: {
          commentId: commentResponse.id,
          installationId: installationId,
        },
        create: {
          repositoryOwner: owner,
          repositoryName: repo,
          pullNumber: pullNumber,
          commentId: commentResponse.id,
          installationId: installationId,
        },
      })
    }

    return NextResponse.json(
      { message: 'Analysis completed and comment posted' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
