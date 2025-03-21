import {
  createPullRequestComment,
  updatePullRequestComment,
} from '@/libs/github/api.server'
import { prisma } from '@liam-hq/db'
import { type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest'
import { postComment } from '../postComment'

// Mock the GitHub API functions
vi.mock('@/libs/github/api.server', () => ({
  createPullRequestComment: vi.fn(),
  updatePullRequestComment: vi.fn(),
}))

describe('postComment', () => {
  type TestProject = Awaited<ReturnType<typeof prisma.project.create>>
  type TestRepo = Awaited<ReturnType<typeof prisma.repository.create>>
  type TestPullRequest = Awaited<ReturnType<typeof prisma.pullRequest.create>>
  type TestMigration = Awaited<ReturnType<typeof prisma.migration.create>>
  type CommentResponse = {
    id: number
    node_id: string
    url: string
    body?: string
    body_text?: string
    body_html?: string
    reactions?: unknown
  }

  let testProject: TestProject
  let testRepo: TestRepo
  let testPullRequest: TestPullRequest
  let testMigration: TestMigration

  beforeEach(async () => {
    // Clean up the test database
    await prisma.overallReview.deleteMany()
    await prisma.migration.deleteMany()
    await prisma.pullRequest.deleteMany()
    await prisma.repository.deleteMany()
    await prisma.project.deleteMany()

    // Reset mocks
    vi.clearAllMocks()

    // Set up test data
    testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
      },
    })

    const timestamp = Date.now()
    testRepo = await prisma.repository.create({
      data: {
        name: `test-repo-${timestamp}`,
        owner: `test-owner-${timestamp}`,
        installationId: BigInt(1),
      },
    })

    testPullRequest = await prisma.pullRequest.create({
      data: {
        pullNumber: BigInt(1),
        repositoryId: testRepo.id,
      },
    })

    testMigration = await prisma.migration.create({
      data: {
        title: 'Test Migration',
        pullRequestId: testPullRequest.id,
      },
    })
  })

  it('should create a new comment when no comment exists', async () => {
    const mockCommentId = 123
    ;(
      createPullRequestComment as unknown as MockInstance<
        (
          installationId: number,
          owner: string,
          repo: string,
          pullNumber: number,
          body: string,
        ) => Promise<CommentResponse>
      >
    ).mockResolvedValue({
      id: mockCommentId,
      node_id: 'test-node-id',
      url: 'https://github.com/test/test/pull/1#discussion_r123',
    })

    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: testProject.id ?? null,
      pullRequestId: testPullRequest.id,
      repositoryId: testRepo.id,
    }

    const result = await postComment(testPayload)

    expect(result.success).toBe(true)
    expect(createPullRequestComment).toHaveBeenCalledWith(
      Number(testRepo.installationId),
      testRepo.owner,
      testRepo.name,
      Number(testPullRequest.pullNumber),
      expect.stringContaining('Test review comment'),
    )
    expect(createPullRequestComment).toHaveBeenCalledTimes(1)

    // Verify the comment URL is included
    expect(createPullRequestComment).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.any(Number),
      expect.stringContaining(
        `${process.env.NEXT_PUBLIC_BASE_URL}/app/projects/${testProject.id}/migrations/${testMigration.id}`,
      ),
    )
  })

  it('should update existing comment when comment exists', async () => {
    // First create a PR with a comment
    const existingCommentId = BigInt(456)
    await prisma.pullRequest.update({
      where: { id: testPullRequest.id },
      data: { commentId: existingCommentId },
    })

    const testPayload = {
      reviewComment: 'Updated review comment',
      projectId: testProject.id ?? null,
      pullRequestId: testPullRequest.id,
      repositoryId: testRepo.id,
    }

    const result = await postComment(testPayload)

    expect(result.success).toBe(true)
    expect(updatePullRequestComment).toHaveBeenCalledWith(
      Number(testRepo.installationId),
      testRepo.owner,
      testRepo.name,
      Number(existingCommentId),
      expect.stringContaining('Updated review comment'),
    )
    expect(updatePullRequestComment).toHaveBeenCalledTimes(1)
  })

  it('should throw error when repository not found', async () => {
    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: testProject.id ?? null,
      pullRequestId: testPullRequest.id,
      repositoryId: 999, // Non-existent repository ID
    }

    await expect(postComment(testPayload)).rejects.toThrow(
      'Repository with ID 999 not found',
    )
  })

  it('should throw error when pull request not found', async () => {
    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: testProject.id ?? null,
      pullRequestId: 999, // Non-existent pull request ID
      repositoryId: testRepo.id,
    }

    await expect(postComment(testPayload)).rejects.toThrow(
      'Pull request with ID 999 not found',
    )
  })

  it('should throw error when migration not found', async () => {
    // Create a PR without a migration
    const prWithoutMigration = await prisma.pullRequest.create({
      data: {
        pullNumber: BigInt(2),
        repositoryId: testRepo.id,
      },
    })

    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: testProject.id ?? null,
      pullRequestId: prWithoutMigration.id,
      repositoryId: testRepo.id,
    }

    await expect(postComment(testPayload)).rejects.toThrow(
      `Migration for Pull request with ID ${prWithoutMigration.id} not found`,
    )
  })
})
