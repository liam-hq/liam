import { describe, expect, it } from 'vitest'
import { calculateTableMetrics } from './calculateTableMetrics'

describe('calculateTableMetrics', () => {
  it('should return perfect scores for perfect match', () => {
    const referenceTables = ['users', 'orders', 'products']
    const predictedTables = ['users', 'orders', 'products']
    const tableMapping = {
      users: 'users',
      orders: 'orders',
      products: 'products',
    }

    const result = calculateTableMetrics(
      referenceTables,
      predictedTables,
      tableMapping,
    )

    expect(result).toEqual({
      tableF1: 1.0,
      tableAllcorrect: 1,
    })
  })

  it('should handle partial matches correctly', () => {
    const referenceTables = ['users', 'orders', 'products']
    const predictedTables = ['users', 'orders']
    const tableMapping = { users: 'users', orders: 'orders' }

    const result = calculateTableMetrics(
      referenceTables,
      predictedTables,
      tableMapping,
    )

    expect(result.tableF1).toBeCloseTo(0.8, 2) // precision: 1.0, recall: 0.67, F1: 0.8
    expect(result.tableAllcorrect).toBe(0)
  })

  it('should handle no matches', () => {
    const referenceTables = ['users', 'orders']
    const predictedTables = ['products', 'categories']
    const tableMapping = {}

    const result = calculateTableMetrics(
      referenceTables,
      predictedTables,
      tableMapping,
    )

    expect(result).toEqual({
      tableF1: 0.0,
      tableAllcorrect: 0,
    })
  })

  it('should handle empty reference tables', () => {
    const referenceTables: string[] = []
    const predictedTables: string[] = []
    const tableMapping = {}

    const result = calculateTableMetrics(
      referenceTables,
      predictedTables,
      tableMapping,
    )

    expect(result).toEqual({
      tableF1: 0.0,
      tableAllcorrect: 0,
    })
  })

  it('should handle over-prediction correctly', () => {
    const referenceTables = ['users']
    const predictedTables = ['users', 'orders', 'products']
    const tableMapping = { users: 'users' }

    const result = calculateTableMetrics(
      referenceTables,
      predictedTables,
      tableMapping,
    )

    expect(result.tableF1).toBeCloseTo(0.5, 2) // precision: 0.33, recall: 1.0, F1: 0.5
    expect(result.tableAllcorrect).toBe(0)
  })
})
