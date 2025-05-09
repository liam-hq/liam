import crypto from 'node:crypto'
import { createClient } from '@/libs/db/server'
import { supportedEvents } from '@liam-hq/github'
import type { GitHubWebhookPayload } from '@liam-hq/github'
import { savePullRequestTask } from '@liam-hq/jobs'
import { type NextRequest, NextResponse } from 'next/server'
import { checkSchemaChanges } from './utils/checkSchemaChanges'

const verifyWebhookSignature = (
  payload: string,
  signature: string,
): boolean => {
  const hmac = crypto.createHmac(
    'sha256',
    process.env.GITHUB_WEBHOOK_SECRET || '',
  )
  const digest = `sha256=${hmac.update(payload).digest('hex')}`

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch (_error) {
    // If buffers have different lengths, comparison fails
    return false
  }
}

// Verify webhook signature in production
const verifySignature = (
  payload: string,
  request: NextRequest,
): { isValid: boolean } => {
  if (process.env.VERCEL !== '1') {
    // Skip verification in local development
    return { isValid: true }
  }

  const signature = request.headers.get('x-hub-signature-256') ?? ''
  return { isValid: verifyWebhookSignature(payload, signature) }
}

// Get repository and project information
const getProjectInfo = async (
  installationId: number,
): Promise<{ projectId: string } | null> => {
  const supabase = await createClient({ useServiceRole: true })

  const { data: repository, error: repositoryError } = await supabase
    .from('github_repositories')
    .select('*')
    .eq('github_installation_identifier', installationId)
    .limit(1)
    .single()

  if (repositoryError || !repository) {
    return null
  }

  const { data: projectRepositoryMapping, error: mappingError } = await supabase
    .from('project_repository_mappings')
    .select('*')
    .eq('repository_id', repository.id)
    .limit(1)
    .single()

  if (mappingError || !projectRepositoryMapping) {
    return null
  }

  return { projectId: projectRepositoryMapping.project_id }
}

// Handle pull request events
const handlePullRequest = async (
  data: GitHubWebhookPayload,
  action: string,
): Promise<NextResponse> => {
  // Validate pull request data
  const pullRequest = data.pull_request
  if (!pullRequest) {
    return NextResponse.json(
      { error: 'Pull request data is missing' },
      { status: 400 },
    )
  }

  // Ensure pull request number is a number
  const prNumber =
    typeof pullRequest.number === 'string'
      ? Number.parseInt(pullRequest.number, 10)
      : pullRequest.number

  // Get project information
  const projectInfo = await getProjectInfo(data.installation.id)
  if (!projectInfo) {
    return NextResponse.json(
      { error: 'Repository or mapping not found' },
      { status: 404 },
    )
  }

  const { projectId } = projectInfo

  // Handle supported actions
  if (['opened', 'synchronize', 'reopened'].includes(action)) {
    // Perform pre-check
    try {
      const checkResult = await checkSchemaChanges({
        installationId: data.installation.id,
        pullRequestNumber: prNumber,
        pullRequestTitle: pullRequest.title,
        projectId,
        owner: data.repository.owner.login,
        name: data.repository.name,
      })

      // Determine whether to continue processing based on the check results
      if (!checkResult.shouldContinue) {
        return NextResponse.json(
          { message: 'No schema changes to review' },
          { status: 200 },
        )
      }
    } catch (error) {
      console.error('Error checking schema changes:', error)
      return NextResponse.json(
        {
          error: `Failed to check schema changes: ${(error as Error).message}`,
        },
        { status: 500 },
      )
    }

    // Trigger pull request task
    try {
      await savePullRequestTask.trigger({
        prNumber,
        projectId,
      })

      return NextResponse.json(
        { message: 'Pull request processing initiated' },
        { status: 200 },
      )
    } catch (error) {
      console.error('Error triggering pull request task:', error)
      return NextResponse.json(
        {
          error: `Failed to trigger pull request task: ${(error as Error).message}`,
        },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(
    { error: `Unsupported pull request action: ${action}` },
    { status: 400 },
  )
}

// Parse webhook payload
const parsePayload = async (
  request: NextRequest,
): Promise<{ payload: string; data: GitHubWebhookPayload } | null> => {
  try {
    const payload = await request.text()
    const data = JSON.parse(payload) as GitHubWebhookPayload
    return { payload, data }
  } catch (error) {
    console.error('Error parsing webhook payload:', error)
    return null
  }
}

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  // Parse the payload
  const parsedData = await parsePayload(request)
  if (!parsedData) {
    return NextResponse.json(
      { error: 'Failed to parse webhook payload' },
      { status: 400 },
    )
  }

  const { payload, data } = parsedData

  // Verify signature
  const { isValid } = verifySignature(payload, request)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Get event information
  const event = request.headers.get('x-github-event') ?? ''
  const action = data.action ?? '' // Ensure action is never undefined
  const eventType = `${event}.${action}`

  if (!supportedEvents.includes(eventType)) {
    return NextResponse.json(
      { message: `Event ${eventType} is not supported` },
      { status: 200 },
    )
  }

  // Route to appropriate event handler
  if (event === 'pull_request') {
    try {
      return await handlePullRequest(data, action)
    } catch (error) {
      console.error('Error handling pull request event:', error)
      return NextResponse.json(
        {
          error: `Failed to process pull request: ${(error as Error).message}`,
        },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(
    { message: `Event ${eventType} is supported but no handler found` },
    { status: 200 },
  )
}
