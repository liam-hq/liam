import { err, ok } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import { createLiamDBExecutor } from './liamDbExecutor.ts'

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}))

vi.mock('@liam-hq/agent', () => ({
  createSupabaseRepositories: vi.fn(() => ({
    schema: {
      getSchema: vi.fn(),
    },
  })),
  deepModeling: vi.fn(),
}))

// Helper function for building_schemas select mock
const selectBuildingSchema = (
  fields: string | undefined,
  config: {
    buildingSchemaSuccess: boolean
    buildingSchemaId: string
    schemaFetchSuccess: boolean
    schemaData: unknown
  },
) => {
  const {
    buildingSchemaSuccess,
    buildingSchemaId,
    schemaFetchSuccess,
    schemaData,
  } = config

  if (fields === 'id') {
    return Promise.resolve(
      buildingSchemaSuccess
        ? { data: { id: buildingSchemaId }, error: null }
        : {
            data: null,
            error: { message: 'Building schema not found' },
          },
    )
  }
  if (fields === 'schema') {
    return Promise.resolve(
      schemaFetchSuccess
        ? { data: { schema: schemaData }, error: null }
        : { data: null, error: { message: 'Schema not found' } },
    )
  }
  return Promise.resolve({
    data: null,
    error: { message: 'Unexpected query' },
  })
}

// Helper functions for building_schemas table mock
const createBuildingSchemasMock = (config: {
  buildingSchemaSuccess: boolean
  buildingSchemaId: string
  schemaFetchSuccess: boolean
  schemaData: unknown
}) => {
  const {
    buildingSchemaSuccess,
    buildingSchemaId,
    schemaFetchSuccess,
    schemaData,
  } = config

  return {
    insert: vi.fn(() =>
      Promise.resolve(
        buildingSchemaSuccess
          ? { error: null }
          : { error: { message: 'Failed to create building schema' } },
      ),
    ),
    select: vi.fn((fields?: string) => ({
      eq: vi.fn(() => ({
        single: vi.fn(() =>
          selectBuildingSchema(fields, {
            buildingSchemaSuccess,
            buildingSchemaId,
            schemaFetchSuccess,
            schemaData,
          }),
        ),
      })),
    })),
  }
}

// Helper function to create mock Supabase client
const createMockSupabase = (config: {
  designSessionSuccess?: boolean
  buildingSchemaSuccess?: boolean
  buildingSchemaId?: string
  timelineItemSuccess?: boolean
  versionNumber?: number
  schemaFetchSuccess?: boolean
  schemaData?: unknown
}) => {
  const {
    designSessionSuccess = true,
    buildingSchemaSuccess = true,
    buildingSchemaId = 'test-building-schema-id',
    timelineItemSuccess = true,
    versionNumber = 1,
    schemaFetchSuccess = true,
    schemaData = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              notNull: true,
              default: null,
              check: null,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    },
  } = config

  return {
    from: vi.fn((table: string) => {
      if (table === 'design_sessions') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve(
                  designSessionSuccess
                    ? { data: { id: 'test-session-id' }, error: null }
                    : {
                        data: null,
                        error: { message: 'Failed to create session' },
                      },
                ),
              ),
            })),
          })),
        }
      }
      if (table === 'building_schemas') {
        return createBuildingSchemasMock({
          buildingSchemaSuccess,
          buildingSchemaId,
          schemaFetchSuccess,
          schemaData,
        })
      }
      if (table === 'timeline_items') {
        return {
          insert: vi.fn(() =>
            Promise.resolve(
              timelineItemSuccess
                ? { error: null }
                : { error: { message: 'Failed to create timeline item' } },
            ),
          ),
        }
      }
      if (table === 'building_schema_versions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(() =>
                    Promise.resolve({
                      data: versionNumber ? { number: versionNumber } : null,
                      error: null,
                    }),
                  ),
                })),
              })),
            })),
          })),
        }
      }
      return {}
    }),
  }
}

describe('createLiamDBExecutor', () => {
  const mockConfig = {
    supabaseUrl: 'https://test.supabase.co',
    supabaseAnonKey: 'test-key',
    organizationId: 'test-org-id',
  }

  it('should create an executor with execute function', () => {
    const executor = createLiamDBExecutor(mockConfig)
    expect(executor).toHaveProperty('execute')
    expect(typeof executor.execute).toBe('function')
  })

  describe('execute', () => {
    it('should handle successful schema generation', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { createSupabaseRepositories, deepModeling } = await import(
        '@liam-hq/agent'
      )

      const mockSupabase = createMockSupabase({})
      // @ts-expect-error - Mock implementation
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const mockRepositories = {
        schema: {
          getSchema: vi.fn(() =>
            Promise.resolve({
              data: { tables: {} },
              error: null,
            }),
          ),
        },
      }
      // @ts-expect-error - Mock implementation
      vi.mocked(createSupabaseRepositories).mockReturnValue(mockRepositories)

      vi.mocked(deepModeling).mockResolvedValue(ok({ text: 'Success' }))

      const executor = createLiamDBExecutor(mockConfig)
      const result = await executor.execute({ prompt: 'Create a users table' })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveProperty('tables')
        expect(result.value.tables).toHaveProperty('users')
      }
    })

    it('should handle design session creation failure', async () => {
      const { createClient } = await import('@supabase/supabase-js')

      const mockSupabase = createMockSupabase({ designSessionSuccess: false })
      // @ts-expect-error - Mock implementation
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const executor = createLiamDBExecutor(mockConfig)
      const result = await executor.execute({ prompt: 'Create a users table' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain(
          'Failed to create design session',
        )
      }
    })

    it('should handle deep modeling failure', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { createSupabaseRepositories, deepModeling } = await import(
        '@liam-hq/agent'
      )

      const mockSupabase = createMockSupabase({})
      // @ts-expect-error - Mock implementation
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const mockRepositories = {
        schema: {
          getSchema: vi.fn(() =>
            Promise.resolve({
              data: { tables: {} },
              error: null,
            }),
          ),
        },
      }
      // @ts-expect-error - Mock implementation
      vi.mocked(createSupabaseRepositories).mockReturnValue(mockRepositories)

      vi.mocked(deepModeling).mockResolvedValue(
        err(new Error('AI processing failed')),
      )

      const executor = createLiamDBExecutor(mockConfig)
      const result = await executor.execute({ prompt: 'Create a users table' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Deep modeling failed')
      }
    })

    it('should handle schema fetch failure', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { createSupabaseRepositories, deepModeling } = await import(
        '@liam-hq/agent'
      )

      const mockSupabase = createMockSupabase({ schemaFetchSuccess: false })
      // @ts-expect-error - Mock implementation
      vi.mocked(createClient).mockReturnValue(mockSupabase)

      const mockRepositories = {
        schema: {
          getSchema: vi.fn(() =>
            Promise.resolve({
              data: { tables: {} },
              error: null,
            }),
          ),
        },
      }
      // @ts-expect-error - Mock implementation
      vi.mocked(createSupabaseRepositories).mockReturnValue(mockRepositories)

      vi.mocked(deepModeling).mockResolvedValue(ok({ text: 'Success' }))

      const executor = createLiamDBExecutor(mockConfig)
      const result = await executor.execute({ prompt: 'Create a users table' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to fetch schema')
      }
    })
  })
})
