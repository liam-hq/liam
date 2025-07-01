import type { Schema } from '@liam-hq/db-structure'
import { describe, expect, it, vi } from 'vitest'
import { nameSimilarity } from '../../nameSimilarity/nameSimilarity'
import { wordOverlapMatch } from '../../wordOverlapMatch/wordOverlapMatch'
import { validateConstraints } from '../validateConstraints/validateConstraints'
import { validatePrimaryKeys } from '../validatePrimaryKeys/validatePrimaryKeys'
import { evaluateColumns } from './evaluateColumns'

vi.mock('../../nameSimilarity/nameSimilarity')
vi.mock('../../wordOverlapMatch/wordOverlapMatch')
vi.mock('../validateConstraints/validateConstraints')
vi.mock('../validatePrimaryKeys/validatePrimaryKeys')

describe('evaluateColumns', () => {
  it('should evaluate columns with perfect match', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            name: {
              name: 'name',
              type: 'varchar',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const predictedSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            name: {
              name: 'name',
              type: 'varchar',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const tableMapping = { users: 'users' }

    // Mock the column mapping functions to create perfect mapping
    vi.mocked(nameSimilarity).mockImplementation(
      async (_ref, _pred, mapping) => {
        mapping['id'] = 'id'
        mapping['name'] = 'name'
      },
    )
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})
    vi.mocked(validatePrimaryKeys).mockReturnValue(true)
    vi.mocked(validateConstraints).mockReturnValue(true)

    const result = await evaluateColumns(
      referenceSchema,
      predictedSchema,
      tableMapping,
    )

    expect(result).toEqual({
      totalColumnF1Score: 1.0,
      totalColumnAllCorrectCount: 1,
      totalPrimaryKeyCorrectCount: 1,
      totalConstraintCorrectCount: 1,
      allColumnMappings: { users: { id: 'id', name: 'name' } },
    })
  })

  it('should handle empty schemas', async () => {
    const referenceSchema: Schema = { tables: {} }
    const predictedSchema: Schema = { tables: {} }
    const tableMapping = {}

    const result = await evaluateColumns(
      referenceSchema,
      predictedSchema,
      tableMapping,
    )

    expect(result).toEqual({
      totalColumnF1Score: 0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      allColumnMappings: {},
    })
  })

  it('should handle partial column matches', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            name: {
              name: 'name',
              type: 'varchar',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            email: {
              name: 'email',
              type: 'varchar',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const predictedSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            name: {
              name: 'name',
              type: 'varchar',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const tableMapping = { users: 'users' }

    // Mock partial column mapping (2 out of 3 reference columns matched)
    vi.mocked(nameSimilarity).mockImplementation(
      async (_ref, _pred, mapping) => {
        mapping['id'] = 'id'
        mapping['name'] = 'name'
      },
    )
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})
    vi.mocked(validatePrimaryKeys).mockReturnValue(false)
    vi.mocked(validateConstraints).mockReturnValue(false)

    const result = await evaluateColumns(
      referenceSchema,
      predictedSchema,
      tableMapping,
    )

    expect(result.totalColumnF1Score).toBeCloseTo(0.8, 2) // precision: 1.0, recall: 0.67, F1: 0.8
    expect(result.totalColumnAllCorrectCount).toBe(0)
    expect(result.totalPrimaryKeyCorrectCount).toBe(0)
    expect(result.totalConstraintCorrectCount).toBe(0)
    expect(result.allColumnMappings).toEqual({
      users: { id: 'id', name: 'name' },
    })
  })

  it('should handle no table mapping', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const predictedSchema: Schema = {
      tables: {
        products: {
          name: 'products',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const tableMapping = {}

    const result = await evaluateColumns(
      referenceSchema,
      predictedSchema,
      tableMapping,
    )

    expect(result).toEqual({
      totalColumnF1Score: 0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      allColumnMappings: {},
    })
  })

  it('should handle multiple tables', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
        orders: {
          name: 'orders',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            user_id: {
              name: 'user_id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const predictedSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
        orders: {
          name: 'orders',
          columns: {
            id: {
              name: 'id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
            user_id: {
              name: 'user_id',
              type: 'integer',
              default: null,
              check: null,
              notNull: false,
              comment: null,
            },
          },
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const tableMapping = { users: 'users', orders: 'orders' }

    vi.mocked(nameSimilarity).mockImplementation(async (ref, pred, mapping) => {
      // Perfect match for all columns
      for (const refCol of ref) {
        if (pred.includes(refCol)) {
          mapping[refCol] = refCol
        }
      }
    })
    vi.mocked(wordOverlapMatch).mockImplementation(() => {})
    vi.mocked(validatePrimaryKeys).mockReturnValue(true)
    vi.mocked(validateConstraints).mockReturnValue(true)

    const result = await evaluateColumns(
      referenceSchema,
      predictedSchema,
      tableMapping,
    )

    expect(result).toEqual({
      totalColumnF1Score: 2.0, // 1.0 for users + 1.0 for orders
      totalColumnAllCorrectCount: 2,
      totalPrimaryKeyCorrectCount: 2,
      totalConstraintCorrectCount: 2,
      allColumnMappings: {
        users: { id: 'id' },
        orders: { id: 'id', user_id: 'user_id' },
      },
    })
  })
})
