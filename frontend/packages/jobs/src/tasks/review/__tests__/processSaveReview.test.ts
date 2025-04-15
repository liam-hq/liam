import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '../../../libs/supabase'
import type { ReviewResponse } from '../generateReview'
import { processSaveReview } from '../saveReview'

vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')

describe.skip('processSaveReview', () => {
  const supabase = createClient()

  const testRepository = {
    id: 9999,
    name: 'test-repo',
    owner: 'test-owner',
    installationId: 12345,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const testPullRequest = {
    id: 9999,
    pullNumber: 9999,
    repositoryId: 9999,
    commentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const testProject = {
    id: 9999,
    name: 'test-project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    await supabase.from('Repository').insert(testRepository)
    await supabase.from('PullRequest').insert(testPullRequest)
    await supabase.from('Project').insert(testProject)
  })

  afterEach(async () => {
    const { data: reviews } = await supabase
      .from('OverallReview')
      .select('id')
      .eq('pullRequestId', testPullRequest.id)

    if (reviews && reviews.length > 0) {
      const reviewIds = reviews.map((r) => r.id)
      await supabase
        .from('ReviewFeedback')
        .delete()
        .in('overallReviewId', reviewIds)
      await supabase.from('OverallReview').delete().in('id', reviewIds)
    }

    await supabase.from('PullRequest').delete().eq('id', testPullRequest.id)
    await supabase.from('Project').delete().eq('id', testProject.id)
    await supabase.from('Repository').delete().eq('id', testRepository.id)
  })

  it('should save review successfully', async () => {
    const testPayload: ReviewResponse = {
      pullRequestId: testPullRequest.id,
      projectId: testProject.id,
      repositoryId: testRepository.id,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
      pullRequestNumber: testPullRequest.pullNumber,
      owner: testRepository.owner,
      name: testRepository.name,
      review: {
        bodyMarkdown: 'Test review comment',
        feedbacks: [
          {
            kind: 'Migration Safety',
            severity: 'CRITICAL',
            description: 'Test issue',
            suggestion: 'Fix the issue',
            suggestionSnippets: [],
          },
        ],
      },
    }

    const result = await processSaveReview(testPayload)
    expect(result.success).toBe(true)

    const { data: review, error } = await supabase
      .from('OverallReview')
      .select('*')
      .eq('pullRequestId', testPullRequest.id)
      .single()

    if (error) throw error
    expect(review).toBeTruthy()
    expect(review.projectId).toBe(testProject.id)

    const { data: issues, error: issuesError } = await supabase
      .from('ReviewFeedback')
      .select('*')
      .eq('overallReviewId', review.id)
    if (issuesError) throw issuesError
    expect(issues).toBeTruthy()
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('should throw error when pull request not found', async () => {
    const testPayload: ReviewResponse = {
      pullRequestId: 999999,
      projectId: 9999,
      repositoryId: 9999,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
      pullRequestNumber: 999,
      owner: 'test-owner',
      name: 'test-repo',
      review: {
        bodyMarkdown: 'Test review',
        feedbacks: [],
      },
    }

    await expect(processSaveReview(testPayload)).rejects.toThrow(
      /PullRequest not found/,
    )
  })

  it('should throw error when creating overall review fails', async () => {
    const testPayload: ReviewResponse = {
      pullRequestId: 9999,
      projectId: 999999,
      repositoryId: 9999,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
      pullRequestNumber: 999,
      owner: 'test-owner',
      name: 'test-repo',
      review: {
        bodyMarkdown: 'Test review',
        feedbacks: [],
      },
    }

    await expect(processSaveReview(testPayload)).rejects.toThrow(
      /Failed to create overall review/,
    )
  })
})
