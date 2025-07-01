import type { Schema } from '@liam-hq/db-structure'
import { describe, expect, it } from 'vitest'
import { evaluateForeignKeys } from './evaluateForeignKeys'

describe('evaluateForeignKeys', () => {
  it('should return perfect scores for matching foreign keys', () => {
    const referenceTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
      orders: {
        name: 'orders',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {},
      },
    }

    const predictTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
      orders: {
        name: 'orders',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {},
      },
    }

    const result = evaluateForeignKeys(referenceTables, predictTables)

    expect(result).toEqual({
      foreignKeyF1: 1.0,
      foreignKeyAllCorrect: 1,
    })
  })

  it('should handle partial foreign key matches', () => {
    const referenceTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
          fk2: {
            name: 'fk2',
            type: 'FOREIGN KEY',
            columnName: 'order_id',
            targetTableName: 'orders',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
    }

    const predictTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
    }

    const result = evaluateForeignKeys(referenceTables, predictTables)

    expect(result.foreignKeyF1).toBeCloseTo(0.67, 2) // precision: 1.0, recall: 0.5, F1: 0.67
    expect(result.foreignKeyAllCorrect).toBe(0)
  })

  it('should handle no foreign keys', () => {
    const referenceTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {},
      },
    }

    const predictTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {},
      },
    }

    const result = evaluateForeignKeys(referenceTables, predictTables)

    expect(result).toEqual({
      foreignKeyF1: 0.0,
      foreignKeyAllCorrect: 0,
    })
  })

  it('should handle mismatched foreign keys', () => {
    const referenceTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
    }

    const predictTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'order_id',
            targetTableName: 'orders',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
    }

    const result = evaluateForeignKeys(referenceTables, predictTables)

    expect(result).toEqual({
      foreignKeyF1: 0.0,
      foreignKeyAllCorrect: 0,
    })
  })

  it('should handle empty schemas', () => {
    const referenceTables: Schema['tables'] = {}
    const predictTables: Schema['tables'] = {}

    const result = evaluateForeignKeys(referenceTables, predictTables)

    expect(result).toEqual({
      foreignKeyF1: 0.0,
      foreignKeyAllCorrect: 0,
    })
  })

  it('should handle non-foreign key constraints', () => {
    const referenceTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          pk1: {
            name: 'pk1',
            type: 'PRIMARY KEY',
            columnName: 'id',
          },
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
    }

    const predictTables: Schema['tables'] = {
      users: {
        name: 'users',
        columns: {},
        comment: null,
        indexes: {},
        constraints: {
          pk1: {
            name: 'pk1',
            type: 'PRIMARY KEY',
            columnName: 'id',
          },
          fk1: {
            name: 'fk1',
            type: 'FOREIGN KEY',
            columnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
            updateConstraint: 'CASCADE',
            deleteConstraint: 'CASCADE',
          },
        },
      },
    }

    const result = evaluateForeignKeys(referenceTables, predictTables)

    // Should only count foreign keys, not primary keys
    expect(result).toEqual({
      foreignKeyF1: 1.0,
      foreignKeyAllCorrect: 1,
    })
  })
})
