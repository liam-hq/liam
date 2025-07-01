import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateAverages } from '../calculateAverages/calculateAverages'
import { calculateTableMetrics } from '../calculateTableMetrics/calculateTableMetrics'
import { createTableMapping } from '../createTableMapping/createTableMapping'
import { evaluate } from '../evaluate'
import { evaluateColumns } from '../evaluateColumns/evaluateColumns'
import { evaluateForeignKeys } from '../evaluateForeignKeys/evaluateForeignKeys'
import { ALL_CORRECT_THRESHOLD } from '../types'

vi.mock('../createTableMapping/createTableMapping')
vi.mock('../calculateTableMetrics/calculateTableMetrics')
vi.mock('../evaluateColumns/evaluateColumns')
vi.mock('../evaluateForeignKeys/evaluateForeignKeys')
vi.mock('../calculateAverages/calculateAverages')

describe('evaluate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('testSuccessfulSchemaEvaluationWithMatchingElements', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
        orders: {
          name: 'orders',
          columns: {},
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
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
        orders: {
          name: 'orders',
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const mockTableMapping = { users: 'users', orders: 'orders' }
    const mockTableMetrics = { tableF1: 1.0, tableAllcorrect: 1 }
    const mockColumnData = {
      totalColumnF1Score: 2.0,
      totalColumnAllCorrectCount: 2,
      totalPrimaryKeyCorrectCount: 2,
      totalConstraintCorrectCount: 2,
      allColumnMappings: { users: {}, orders: {} },
    }
    const mockForeignKeyData = { foreignKeyF1: 1.0, foreignKeyAllCorrect: 1 }
    const mockAverages = {
      columnF1ScoreAverage: 1.0,
      columnAllCorrectRateAverage: 1.0,
      primaryKeyAccuracyAverage: 1.0,
      constraintAccuracy: 1.0,
    }

    vi.mocked(createTableMapping).mockResolvedValue(mockTableMapping)
    vi.mocked(calculateTableMetrics).mockReturnValue(mockTableMetrics)
    vi.mocked(evaluateColumns).mockResolvedValue(mockColumnData)
    vi.mocked(evaluateForeignKeys).mockReturnValue(mockForeignKeyData)
    vi.mocked(calculateAverages).mockReturnValue(mockAverages)

    const result = await evaluate(referenceSchema, predictedSchema)

    expect(result.tableMapping).toEqual(mockTableMapping)
    expect(result.columnMappings).toEqual(mockColumnData.allColumnMappings)
    expect(result.tableF1Score).toBe(1.0)
    expect(result.tableAllCorrectRate).toBe(1)
    expect(result.columnF1ScoreAverage).toBe(1.0)
    expect(result.columnAllCorrectRateAverage).toBe(1.0)
    expect(result.primaryKeyAccuracyAverage).toBe(1.0)
    expect(result.constraintAccuracy).toBe(1.0)
    expect(result.foreignKeyF1Score).toBe(1.0)
    expect(result.foreignKeyAllCorrectRate).toBe(1)
    expect(result.overallSchemaAccuracy).toBe(1)
  })

  it('testOverallSchemaAccuracyCalculationAboveThreshold', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {},
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
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const mockTableMapping = { users: 'users' }
    const mockTableMetrics = { tableF1: 1.0, tableAllcorrect: 1 }
    const mockColumnData = {
      totalColumnF1Score: 1.0,
      totalColumnAllCorrectCount: 1,
      totalPrimaryKeyCorrectCount: 1,
      totalConstraintCorrectCount: 1,
      allColumnMappings: {},
    }
    const mockForeignKeyData = { foreignKeyF1: 1.0, foreignKeyAllCorrect: 1 }
    const mockAverages = {
      columnF1ScoreAverage: 1.0,
      columnAllCorrectRateAverage: 1.0,
      primaryKeyAccuracyAverage: 1.0,
      constraintAccuracy: 1.0,
    }

    vi.mocked(createTableMapping).mockResolvedValue(mockTableMapping)
    vi.mocked(calculateTableMetrics).mockReturnValue(mockTableMetrics)
    vi.mocked(evaluateColumns).mockResolvedValue(mockColumnData)
    vi.mocked(evaluateForeignKeys).mockReturnValue(mockForeignKeyData)
    vi.mocked(calculateAverages).mockReturnValue(mockAverages)

    const result = await evaluate(referenceSchema, predictedSchema)

    const accuracySum =
      mockAverages.primaryKeyAccuracyAverage +
      mockAverages.columnAllCorrectRateAverage +
      mockTableMetrics.tableAllcorrect
    expect(accuracySum).toBeGreaterThan(ALL_CORRECT_THRESHOLD)
    expect(result.overallSchemaAccuracy).toBe(1)
  })

  it('testMetricsAggregationIntoEvaluateResult', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {},
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
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const mockTableMapping = { users: 'users' }
    const mockTableMetrics = { tableF1: 0.8, tableAllcorrect: 0 }
    const mockColumnData = {
      totalColumnF1Score: 0.7,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 1,
      totalConstraintCorrectCount: 0,
      allColumnMappings: { users: { col1: 'col1' } },
    }
    const mockForeignKeyData = { foreignKeyF1: 0.9, foreignKeyAllCorrect: 1 }
    const mockAverages = {
      columnF1ScoreAverage: 0.7,
      columnAllCorrectRateAverage: 0.0,
      primaryKeyAccuracyAverage: 1.0,
      constraintAccuracy: 0.0,
    }

    vi.mocked(createTableMapping).mockResolvedValue(mockTableMapping)
    vi.mocked(calculateTableMetrics).mockReturnValue(mockTableMetrics)
    vi.mocked(evaluateColumns).mockResolvedValue(mockColumnData)
    vi.mocked(evaluateForeignKeys).mockReturnValue(mockForeignKeyData)
    vi.mocked(calculateAverages).mockReturnValue(mockAverages)

    const result = await evaluate(referenceSchema, predictedSchema)

    expect(result).toEqual({
      tableMapping: mockTableMapping,
      columnMappings: mockColumnData.allColumnMappings,
      tableF1Score: mockTableMetrics.tableF1,
      tableAllCorrectRate: mockTableMetrics.tableAllcorrect,
      columnF1ScoreAverage: mockAverages.columnF1ScoreAverage,
      columnAllCorrectRateAverage: mockAverages.columnAllCorrectRateAverage,
      primaryKeyAccuracyAverage: mockAverages.primaryKeyAccuracyAverage,
      constraintAccuracy: mockAverages.constraintAccuracy,
      foreignKeyF1Score: mockForeignKeyData.foreignKeyF1,
      foreignKeyAllCorrectRate: mockForeignKeyData.foreignKeyAllCorrect,
      overallSchemaAccuracy: 0,
    })
  })

  it('testEvaluationWithEmptyReferenceSchema', async () => {
    const referenceSchema: Schema = { tables: {} }
    const predictedSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const mockTableMapping = {}
    const mockTableMetrics = { tableF1: 0, tableAllcorrect: 0 }
    const mockColumnData = {
      totalColumnF1Score: 0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      allColumnMappings: {},
    }
    const mockForeignKeyData = { foreignKeyF1: 0, foreignKeyAllCorrect: 0 }
    const mockAverages = {
      columnF1ScoreAverage: 0,
      columnAllCorrectRateAverage: 0,
      primaryKeyAccuracyAverage: 0,
      constraintAccuracy: 0,
    }

    vi.mocked(createTableMapping).mockResolvedValue(mockTableMapping)
    vi.mocked(calculateTableMetrics).mockReturnValue(mockTableMetrics)
    vi.mocked(evaluateColumns).mockResolvedValue(mockColumnData)
    vi.mocked(evaluateForeignKeys).mockReturnValue(mockForeignKeyData)
    vi.mocked(calculateAverages).mockReturnValue(mockAverages)

    const result = await evaluate(referenceSchema, predictedSchema)

    expect(calculateAverages).toHaveBeenCalledWith({
      totalColumnF1Score: 0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      totalTableCount: 0,
    })
    expect(result.overallSchemaAccuracy).toBe(0)
  })

  it('testEvaluationWithEmptyPredictedSchema', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }
    const predictedSchema: Schema = { tables: {} }

    const mockTableMapping = {}
    const mockTableMetrics = { tableF1: 0, tableAllcorrect: 0 }
    const mockColumnData = {
      totalColumnF1Score: 0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      allColumnMappings: {},
    }
    const mockForeignKeyData = { foreignKeyF1: 0, foreignKeyAllCorrect: 0 }
    const mockAverages = {
      columnF1ScoreAverage: 0,
      columnAllCorrectRateAverage: 0,
      primaryKeyAccuracyAverage: 0,
      constraintAccuracy: 0,
    }

    vi.mocked(createTableMapping).mockResolvedValue(mockTableMapping)
    vi.mocked(calculateTableMetrics).mockReturnValue(mockTableMetrics)
    vi.mocked(evaluateColumns).mockResolvedValue(mockColumnData)
    vi.mocked(evaluateForeignKeys).mockReturnValue(mockForeignKeyData)
    vi.mocked(calculateAverages).mockReturnValue(mockAverages)

    const result = await evaluate(referenceSchema, predictedSchema)

    expect(calculateTableMetrics).toHaveBeenCalledWith(
      ['users'],
      [],
      mockTableMapping,
    )
    expect(result.tableF1Score).toBe(0)
    expect(result.overallSchemaAccuracy).toBe(0)
  })

  it('testOverallSchemaAccuracyBelowThreshold', async () => {
    const referenceSchema: Schema = {
      tables: {
        users: {
          name: 'users',
          columns: {},
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
          columns: {},
          comment: null,
          indexes: {},
          constraints: {},
        },
      },
    }

    const mockTableMapping = { users: 'users' }
    const mockTableMetrics = { tableF1: 0.5, tableAllcorrect: 0 }
    const mockColumnData = {
      totalColumnF1Score: 0.5,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      allColumnMappings: {},
    }
    const mockForeignKeyData = { foreignKeyF1: 0.5, foreignKeyAllCorrect: 0 }
    const mockAverages = {
      columnF1ScoreAverage: 0.5,
      columnAllCorrectRateAverage: 0.0,
      primaryKeyAccuracyAverage: 0.0,
      constraintAccuracy: 0.0,
    }

    vi.mocked(createTableMapping).mockResolvedValue(mockTableMapping)
    vi.mocked(calculateTableMetrics).mockReturnValue(mockTableMetrics)
    vi.mocked(evaluateColumns).mockResolvedValue(mockColumnData)
    vi.mocked(evaluateForeignKeys).mockReturnValue(mockForeignKeyData)
    vi.mocked(calculateAverages).mockReturnValue(mockAverages)

    const result = await evaluate(referenceSchema, predictedSchema)

    const accuracySum =
      mockAverages.primaryKeyAccuracyAverage +
      mockAverages.columnAllCorrectRateAverage +
      mockTableMetrics.tableAllcorrect
    expect(accuracySum).toBeLessThanOrEqual(ALL_CORRECT_THRESHOLD)
    expect(result.overallSchemaAccuracy).toBe(0)
  })
})
