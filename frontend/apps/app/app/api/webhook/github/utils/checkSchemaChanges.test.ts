import { getPullRequestFiles } from '@liam-hq/github'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkSchemaChanges } from '../checkSchemaChanges'

// Only mock the GitHub API calls, not Supabase
vi.mock('@liam-hq/github', () => ({
  getPullRequestFiles: vi.fn(),
}))

vi.mock('@/src/trigger/jobs', () => ({
  savePullRequestTask: { trigger: vi.fn() },
}))

describe('checkSchemaChanges', () => {
  const mockSchemaParams = {
    pullRequestNumber: 1,
    pullRequestTitle: 'Update schema',
    projectId: '100',
    owner: 'user',
    name: 'repo',
    installationId: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return false if project has no schema file paths', async () => {
    // Setup GitHub API mock to return some files
    vi.mocked(getPullRequestFiles).mockResolvedValue([
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

    const result = await checkSchemaChanges(mockSchemaParams)
    expect(result).toEqual({ shouldContinue: false })
  })

  it('should return false if no files match the schema paths', async () => {
    // Setup GitHub API mock to return non-matching files
    vi.mocked(getPullRequestFiles).mockResolvedValue([
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
        patch: 'console.log("Hello, world!");',
        fileType: 'text',
      },
    ])

    const result = await checkSchemaChanges(mockSchemaParams)
    expect(result).toEqual({ shouldContinue: false })
  })

  it.skip('should return true if schema file changes are detected', async () => {
    // Get the Supabase client
    const { createClient } = await import('@/libs/db/server')
    const supabase = await createClient()

    // Create a test project
    const now = new Date().toISOString()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project for Schema Changes Test',
        updated_at: now,
      })
      .select()
      .single()

    if (projectError || !project) {
      console.error('Failed to create test project:', projectError)
      throw projectError
    }

    try {
      // Create a test schema path for the project
      const { data: schemaPath, error: schemaPathError } = await supabase
        .from('schema_file_paths')
        .insert({
          path: 'migrations/2024_update.sql',
          project_id: project.id,
          format: 'postgres',
          updated_at: now,
        })
        .select()
        .single()

      if (schemaPathError || !schemaPath) {
        console.error('Failed to create test schema path:', schemaPathError)
        throw schemaPathError
      }

      // Mock the GitHub API to return SQL files
      vi.mocked(getPullRequestFiles).mockResolvedValue([
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

      // Use the real project ID in the test params
      const testParams = {
        ...mockSchemaParams,
        projectId: project.id,
      }

      // Call the actual function with real database records
      const result = await checkSchemaChanges(testParams)
      expect(result).toEqual({ shouldContinue: true })

      // Clean up the schema path
      await supabase.from('schema_file_paths').delete().eq('id', schemaPath.id)
    } finally {
      // Clean up the project
      await supabase.from('projects').delete().eq('id', project.id)
    }
  })
})
