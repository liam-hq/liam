import { getPullRequestFiles } from '@liam-hq/github'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@/libs/db/server'
import { checkSchemaChanges } from '../checkSchemaChanges'

// Mock external dependencies at I/O boundaries
vi.mock('@liam-hq/github', () => ({
  getPullRequestFiles: vi.fn(),
}))

vi.mock('@/libs/db/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/src/trigger/jobs', () => ({
  savePullRequestTask: { trigger: vi.fn() },
}))

const mockGetPullRequestFiles = vi.mocked(getPullRequestFiles)
const mockCreateClient = vi.mocked(createClient)

describe('checkSchemaChanges', () => {
  const mockSchemaParams = {
    pullRequestNumber: 1,
    pullRequestTitle: 'Update schema',
    projectId: '100',
    owner: 'user',
    name: 'repo',
    installationId: 1,
  }

  const mockSingle = vi.fn()
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock the Supabase client with minimal interface needed for testing
    // Using unknown intermediate cast as suggested by TypeScript for intentional mock typing
    mockCreateClient.mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>,
    )
  })

  it('should return false if project has no schema file paths', async () => {
    // Given: PR files exist but no schema paths in database
    mockGetPullRequestFiles.mockResolvedValue([
      {
        filename: 'dummy.sql',
        status: 'added',
        additions: 1,
        deletions: 0,
        changes: 1,
        fileType: 'text',
        patch: 'CREATE TABLE dummy (id INT);',
      },
    ])

    // Mock database to return no schema paths (error)
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'No schema path found' },
    })

    // When: checking for schema changes
    const result = await checkSchemaChanges(mockSchemaParams)

    // Then: should not continue processing
    expect(result).toEqual({ shouldContinue: false })
    expect(mockSupabase.from).toHaveBeenCalledWith('schema_file_paths')
  })

  it('should return false if no files match the schema paths', async () => {
    // Given: PR files don't match schema path
    mockGetPullRequestFiles.mockResolvedValue([
      {
        filename: 'src/index.js',
        status: 'modified',
        additions: 10,
        deletions: 2,
        changes: 12,
        patch: 'console.log("Hello, world!");',
        fileType: 'text',
      },
      {
        filename: 'README.md',
        status: 'modified',
        additions: 5,
        deletions: 1,
        changes: 6,
        patch: 'Updated documentation',
        fileType: 'text',
      },
    ])

    // Mock database to return schema path that doesn't match PR files
    mockSingle.mockResolvedValue({
      data: { path: 'migrations/schema.sql' },
      error: null,
    })

    // When: checking for schema changes
    const result = await checkSchemaChanges(mockSchemaParams)

    // Then: should not continue processing
    expect(result).toEqual({ shouldContinue: false })
  })

  it('should return true if schema file changes are detected', async () => {
    // Given: PR files include file matching schema path
    mockGetPullRequestFiles.mockResolvedValue([
      {
        filename: 'migrations/2024_update.sql',
        status: 'added',
        additions: 20,
        deletions: 0,
        changes: 20,
        patch: 'CREATE TABLE test (id INT);',
        fileType: 'text',
      },
      {
        filename: 'src/index.js',
        status: 'modified',
        additions: 10,
        deletions: 2,
        changes: 12,
        patch: 'console.log("Hello, world!");',
        fileType: 'text',
      },
    ])

    // Mock database to return matching schema path
    mockSingle.mockResolvedValue({
      data: { path: 'migrations/2024_update.sql' },
      error: null,
    })

    // When: checking for schema changes
    const result = await checkSchemaChanges(mockSchemaParams)

    // Then: should continue processing
    expect(result).toEqual({ shouldContinue: true })
    expect(mockGetPullRequestFiles).toHaveBeenCalledWith(
      mockSchemaParams.installationId,
      mockSchemaParams.owner,
      mockSchemaParams.name,
      mockSchemaParams.pullRequestNumber,
    )
  })
})
