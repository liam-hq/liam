import { prisma } from '@liam-hq/db'
import { beforeEach, describe, expect, it } from 'vitest'
import { processSaveReview } from '../processSaveReview'

describe('processSaveReview', () => {
  type TestProject = Awaited<ReturnType<typeof prisma.project.create>>
  type TestRepo = Awaited<ReturnType<typeof prisma.repository.create>>
  type TestPullRequest = Awaited<ReturnType<typeof prisma.pullRequest.create>>

  let testProject: TestProject
  let testRepo: TestRepo
  let testPullRequest: TestPullRequest

  beforeEach(async () => {
    // Clean up the test database
    await prisma.overallReview.deleteMany()
    await prisma.pullRequest.deleteMany()
    await prisma.repository.deleteMany()
    await prisma.project.deleteMany()

    // Set up test data
    testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
      },
    })

    testRepo = await prisma.repository.create({
      data: {
        name: 'test-repo',
        owner: 'test-owner',
        installationId: BigInt(1),
      },
    })

    testPullRequest = await prisma.pullRequest.create({
      data: {
        pullNumber: BigInt(1),
        repositoryId: testRepo.id,
      },
    })
  })

  it('should successfully save a review', async () => {
    const testPayload = {
      pullRequestNumber: testPullRequest.pullNumber,
      repositoryId: testRepo.id,
      projectId: testProject.id,
      reviewComment: 'Test review comment',
    }

    // Execute test
    const result = await processSaveReview(testPayload)

    // Verify
    expect(result.success).toBe(true)

    // Verify the database
    const savedReview = await prisma.overallReview.findFirst({
      where: {
        projectId: testPayload.projectId,
        pullRequestId: testPullRequest.id,
      },
    })

    expect(savedReview).toBeTruthy()
    expect(savedReview?.reviewComment).toBe('Test review comment')
  })

  it('should throw error when pull request not found', async () => {
    const testPayload = {
      pullRequestNumber: BigInt(999),
      repositoryId: 999,
      projectId: 1,
      reviewComment: 'Test review comment',
    }

    await expect(processSaveReview(testPayload)).rejects.toThrow(
      'PullRequest not found',
    )
  })
})
