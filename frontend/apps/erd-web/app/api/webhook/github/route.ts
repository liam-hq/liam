import {
  createPullRequestComment,
  getPullRequestFiles,
  verifyWebhookSignature,
} from '@/libs/github/api'
import {
  configValidationResult,
  supportedEvents,
  validateConfig,
} from '@/libs/github/config'
import type { GitHubWebhookPayload } from '@/types/github'
import { type NextRequest, NextResponse } from 'next/server'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Use the cached validation result instead of calling validateConfig()
    const { valid, missing } = configValidationResult
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

    // TODO: Move createPullRequestComment to a separate async job
    const comment = `your pull request is detected by Liam Migration. ${files.length} files are changed`

    await createPullRequestComment(
      installationId,
      owner,
      repo,
      pullNumber,
      comment,
    )

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
