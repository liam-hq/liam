import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPullRequestDetails, getRepositoryStats } from './api.server'

// Mock Octokit
const mockGet = vi.fn()
const mockReposGet = vi.fn()
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    pulls: {
      get: mockGet,
    },
    repos: {
      get: mockReposGet,
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

describe('getRepositoryStats', () => {
  const mockRepositoryData = {
    stargazers_count: 100,
    forks_count: 25,
    language: 'TypeScript',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockReposGet.mockResolvedValue({ data: mockRepositoryData })
  })

  it('should fetch repository stats successfully', async () => {
    const result = await getRepositoryStats(123, 'owner', 'repo')

    expect(result).toEqual({
      stars: 100,
      forks: 25,
      language: 'TypeScript',
    })
    expect(mockReposGet).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('should handle missing stats gracefully', async () => {
    mockReposGet.mockResolvedValue({ data: {} })

    const result = await getRepositoryStats(123, 'owner', 'repo')

    expect(result).toEqual({
      stars: 0,
      forks: 0,
      language: null,
    })
  })

  it('should return null when API call fails', async () => {
    mockReposGet.mockRejectedValue(new Error('API call failed'))

    const result = await getRepositoryStats(123, 'owner', 'repo')

    expect(result).toBeNull()
  })
})
