import {
  createPullRequestComment,
  updatePullRequestComment,
} from '@liam-hq/github'
import {
  type MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createClient } from '../../../libs/supabase'
import { postComment } from '../postComment'

vi.mock('@liam-hq/github', () => ({
  createPullRequestComment: vi.fn(),
  updatePullRequestComment: vi.fn(),
}))

vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')

describe.skip('postComment', () => {
  const supabase = createClient()

  const testRepository = {
    id: '9999',
    name: 'test-repo',
    owner: 'test-owner',
    installation_id: 12345,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const testPullRequest = {
    id: '9999',
    pull_number: 1,
    repository_id: '9999',
    comment_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const testMigration = {
    id: '9999',
    title: 'Test Migration',
    pull_request_id: '9999',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    await supabase.from('repositories').insert(testRepository)
    await supabase.from('pull_requests').insert(testPullRequest)
    await supabase.from('migrations').insert(testMigration)
  })

  afterEach(async () => {
    await supabase.from('migrations').delete().eq('id', testMigration.id)
    await supabase.from('pull_requests').delete().eq('id', testPullRequest.id)
    await supabase.from('repositories').delete().eq('id', testRepository.id)
  })

  it('should create a new comment when no comment exists', async () => {
    const mockCommentId = 123
    ;(createPullRequestComment as unknown as MockInstance).mockResolvedValue({
      id: mockCommentId,
      node_id: 'test-node-id',
      url: 'https://github.com/test/test/pull/1#discussion_r123',
    })

    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: '1',
      pullRequestId: testPullRequest.id,
      repositoryId: testRepository.id,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
    }

    const result = await postComment(testPayload)

    expect(result.success).toBe(true)
    expect(createPullRequestComment).toHaveBeenCalledWith(
      testRepository.installation_id,
      testRepository.owner,
      testRepository.name,
      testPullRequest.pull_number,
      expect.stringContaining(`Test review comment

Migration URL: ${process.env['NEXT_PUBLIC_BASE_URL']}/app/migrations/${testMigration.id}`),
    )
    expect(createPullRequestComment).toHaveBeenCalledTimes(1)

    const { data: updatedPR } = await supabase
      .from('pull_requests')
      .select('*')
      .eq('id', testPullRequest.id)
      .single()

    expect(updatedPR?.comment_id).toBe(mockCommentId)
  })

  it('should update existing comment when comment exists', async () => {
    const existingCommentId = 456
    await supabase
      .from('pull_requests')
      .update({ comment_id: existingCommentId })
      .eq('id', testPullRequest.id)

    const testPayload = {
      reviewComment: 'Updated review comment',
      projectId: '1',
      pullRequestId: testPullRequest.id,
      repositoryId: testRepository.id,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
    }

    const result = await postComment(testPayload)

    expect(result.success).toBe(true)
    expect(updatePullRequestComment).toHaveBeenCalledWith(
      testRepository.installation_id,
      testRepository.owner,
      testRepository.name,
      existingCommentId,
      expect.stringContaining('Updated review comment'),
    )
    expect(updatePullRequestComment).toHaveBeenCalledTimes(1)
  })

  it('should throw error when repository not found', async () => {
    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: '1',
      pullRequestId: testPullRequest.id,
      repositoryId: '999999', // Non-existent ID
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
    }

    await expect(postComment(testPayload)).rejects.toThrow(
      /Repository with ID 999999 not found/,
    )
  })

  it('should throw error when pull request not found', async () => {
    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: '1',
      pullRequestId: '999999', // Non-existent ID
      repositoryId: testRepository.id,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
    }

    await expect(postComment(testPayload)).rejects.toThrow(
      /Pull request with ID 999999 not found/,
    )
  })

  it('should throw error when migration not found', async () => {
    const prWithoutMigration = {
      id: '8888',
      pull_number: 2,
      repository_id: testRepository.id,
      comment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await supabase.from('pull_requests').insert(prWithoutMigration)

    const testPayload = {
      reviewComment: 'Test review comment',
      projectId: '1',
      pullRequestId: prWithoutMigration.id,
      repositoryId: testRepository.id,
      branchName: 'test-branch',
      traceId: 'test-trace-id-123',
    }

    try {
      await expect(postComment(testPayload)).rejects.toThrow(
        /Migration for Pull request with ID 8888 not found/,
      )
    } finally {
      await supabase
        .from('pull_requests')
        .delete()
        .eq('id', prWithoutMigration.id)
    }
  })
})
