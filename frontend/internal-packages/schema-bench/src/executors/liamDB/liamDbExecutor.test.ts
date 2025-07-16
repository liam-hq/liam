import { describe, expect, it, vi } from 'vitest'
import { err, ok } from 'neverthrow'
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

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'design_sessions') {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: 'test-session-id' },
                      error: null,
                    }),
                  ),
                })),
              })),
            }
          }
          if (table === 'building_schemas') {
            return {
              insert: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
              ),
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: 'test-building-schema-id',
                        schema: {
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
                      },
                      error: null,
                    }),
                  ),
                })),
              })),
            }
          }
          if (table === 'timeline_items') {
            return {
              insert: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
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
                          data: { number: 1 },
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

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

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
      vi.mocked(createSupabaseRepositories).mockReturnValue(
        mockRepositories as any,
      )

      vi.mocked(deepModeling).mockResolvedValue(ok({ text: 'Success' }) as any)

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

      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Failed to create session' },
                }),
              ),
            })),
          })),
        })),
      }

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

      const executor = createLiamDBExecutor(mockConfig)
      const result = await executor.execute({ prompt: 'Create a users table' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to create design session')
      }
    })

    it('should handle deep modeling failure', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { createSupabaseRepositories, deepModeling } = await import(
        '@liam-hq/agent'
      )

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'design_sessions') {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: 'test-session-id' },
                      error: null,
                    }),
                  ),
                })),
              })),
            }
          }
          if (table === 'building_schemas') {
            return {
              insert: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
              ),
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: 'test-building-schema-id' },
                      error: null,
                    }),
                  ),
                })),
              })),
            }
          }
          if (table === 'timeline_items') {
            return {
              insert: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
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
                          data: { number: 1 },
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

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

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
      vi.mocked(createSupabaseRepositories).mockReturnValue(
        mockRepositories as any,
      )

      vi.mocked(deepModeling).mockResolvedValue(
        err(new Error('AI processing failed')) as any,
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

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'design_sessions') {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: 'test-session-id' },
                      error: null,
                    }),
                  ),
                })),
              })),
            }
          }
          if (table === 'building_schemas') {
            return {
              insert: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
              ),
              select: vi.fn((fields?: string) => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => {
                    // Select 'id' returns success for runDeepModeling
                    if (fields === 'id') {
                      return Promise.resolve({
                        data: { id: 'test-building-schema-id' },
                        error: null,
                      })
                    }
                    // Select 'schema' returns error for fetchSchema
                    if (fields === 'schema') {
                      return Promise.resolve({
                        data: null,
                        error: { message: 'Schema not found' },
                      })
                    }
                    return Promise.resolve({
                      data: null,
                      error: { message: 'Unexpected query' },
                    })
                  }),
                })),
              })),
            }
          }
          if (table === 'timeline_items') {
            return {
              insert: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
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
                          data: { number: 1 },
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

      vi.mocked(createClient).mockReturnValue(mockSupabase as any)

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
      vi.mocked(createSupabaseRepositories).mockReturnValue(
        mockRepositories as any,
      )

      vi.mocked(deepModeling).mockResolvedValue(ok({ text: 'Success' }) as any)

      const executor = createLiamDBExecutor(mockConfig)
      const result = await executor.execute({ prompt: 'Create a users table' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to fetch schema')
      }
    })
  })
})