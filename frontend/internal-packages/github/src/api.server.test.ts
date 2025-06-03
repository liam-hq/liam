import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPullRequestDetails } from './api.server'

// Mock Octokit
const mockGet = vi.fn()
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    pulls: {
      get: mockGet,
    },
  })),
}))

describe('getPullRequestDetails', () => {
  const mockPullRequest = {
    number: 1,
    title: 'Test PR',
    state: 'open',
    user: {
      login: 'testuser',
    },
    head: {
      ref: 'feature-branch',
    },
    base: {
      ref: 'main',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup mock return value
    mockGet.mockResolvedValue({ data: mockPullRequest })
  })

  it('should fetch pull request details successfully', async () => {
    const result = await getPullRequestDetails(123, 'owner', 'repo', 1)

    expect(result).toEqual(mockPullRequest)
    expect(mockGet).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 1,
    })
  })

  it('should throw error when API call fails', async () => {
    const errorMessage = 'API call failed'
    mockGet.mockRejectedValue(new Error(errorMessage))

    await expect(
      getPullRequestDetails(123, 'owner', 'repo', 1),
    ).rejects.toThrow(errorMessage)
  })
})
