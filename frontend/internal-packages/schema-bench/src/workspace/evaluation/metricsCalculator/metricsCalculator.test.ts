import { describe, expect, it } from 'vitest'
import type { EvaluationResult } from '../../types'
import { calculateAverageMetrics } from './metricsCalculator'

describe('calculateAverageMetrics', () => {
  const createEvaluationResult = (
    metrics: Partial<EvaluationResult['metrics']>,
  ): EvaluationResult => ({
    caseId: 'test',
    timestamp: '2024-01-01T00:00:00Z',
    metrics: {
      tableF1Score: 0,
      tableAllCorrectRate: 0,
      columnF1ScoreAverage: 0,
      columnAllCorrectRateAverage: 0,
      primaryKeyAccuracyAverage: 0,
      constraintAccuracy: 0,
      foreignKeyF1Score: 0,
      foreignKeyAllCorrectRate: 0,
      overallSchemaAccuracy: 0,
      ...metrics,
    },
    tableMapping: {},
    columnMappings: {},
  })

  it('should calculate average metrics for multiple results', () => {
    const results: EvaluationResult[] = [
      createEvaluationResult({
        tableF1Score: 0.8,
        tableAllCorrectRate: 0.7,
        columnF1ScoreAverage: 0.9,
        columnAllCorrectRateAverage: 0.85,
        primaryKeyAccuracyAverage: 0.95,
        constraintAccuracy: 0.88,
        foreignKeyF1Score: 0.82,
        foreignKeyAllCorrectRate: 0.78,
        overallSchemaAccuracy: 0.84,
      }),
      createEvaluationResult({
        tableF1Score: 0.9,
        tableAllCorrectRate: 0.8,
        columnF1ScoreAverage: 0.7,
        columnAllCorrectRateAverage: 0.75,
        primaryKeyAccuracyAverage: 0.85,
        constraintAccuracy: 0.92,
        foreignKeyF1Score: 0.88,
        foreignKeyAllCorrectRate: 0.82,
        overallSchemaAccuracy: 0.86,
      }),
      createEvaluationResult({
        tableF1Score: 1.0,
        tableAllCorrectRate: 0.9,
        columnF1ScoreAverage: 0.8,
        columnAllCorrectRateAverage: 0.8,
        primaryKeyAccuracyAverage: 0.9,
        constraintAccuracy: 0.96,
        foreignKeyF1Score: 0.94,
        foreignKeyAllCorrectRate: 0.9,
        overallSchemaAccuracy: 0.92,
      }),
    ]

    const averages = calculateAverageMetrics(results)

    expect(averages.tableF1Score).toBeCloseTo(0.9)
    expect(averages.tableAllCorrectRate).toBeCloseTo(0.8)
    expect(averages.columnF1ScoreAverage).toBeCloseTo(0.8)
    expect(averages.columnAllCorrectRateAverage).toBeCloseTo(0.8)
    expect(averages.primaryKeyAccuracyAverage).toBeCloseTo(0.9)
    expect(averages.constraintAccuracy).toBeCloseTo(0.92)
    expect(averages.foreignKeyF1Score).toBeCloseTo(0.88)
    expect(averages.foreignKeyAllCorrectRate).toBeCloseTo(0.833333)
    expect(averages.overallSchemaAccuracy).toBeCloseTo(0.873333)
  })

  it('should handle single result', () => {
    const results: EvaluationResult[] = [
      createEvaluationResult({
        tableF1Score: 0.95,
        tableAllCorrectRate: 0.92,
        columnF1ScoreAverage: 0.88,
        columnAllCorrectRateAverage: 0.86,
        primaryKeyAccuracyAverage: 0.91,
        constraintAccuracy: 0.89,
        foreignKeyF1Score: 0.87,
        foreignKeyAllCorrectRate: 0.85,
        overallSchemaAccuracy: 0.9,
      }),
    ]

    const averages = calculateAverageMetrics(results)

    expect(averages.tableF1Score).toBe(0.95)
    expect(averages.tableAllCorrectRate).toBe(0.92)
    expect(averages.columnF1ScoreAverage).toBe(0.88)
    expect(averages.columnAllCorrectRateAverage).toBe(0.86)
    expect(averages.primaryKeyAccuracyAverage).toBe(0.91)
    expect(averages.constraintAccuracy).toBe(0.89)
    expect(averages.foreignKeyF1Score).toBe(0.87)
    expect(averages.foreignKeyAllCorrectRate).toBe(0.85)
    expect(averages.overallSchemaAccuracy).toBe(0.9)
  })

  it('should handle all zero metrics', () => {
    const results: EvaluationResult[] = [
      createEvaluationResult({}),
      createEvaluationResult({}),
    ]

    const averages = calculateAverageMetrics(results)

    expect(averages.tableF1Score).toBe(0)
    expect(averages.tableAllCorrectRate).toBe(0)
    expect(averages.columnF1ScoreAverage).toBe(0)
    expect(averages.columnAllCorrectRateAverage).toBe(0)
    expect(averages.primaryKeyAccuracyAverage).toBe(0)
    expect(averages.constraintAccuracy).toBe(0)
    expect(averages.foreignKeyF1Score).toBe(0)
    expect(averages.foreignKeyAllCorrectRate).toBe(0)
    expect(averages.overallSchemaAccuracy).toBe(0)
  })

  it('should handle perfect scores', () => {
    const results: EvaluationResult[] = [
      createEvaluationResult({
        tableF1Score: 1,
        tableAllCorrectRate: 1,
        columnF1ScoreAverage: 1,
        columnAllCorrectRateAverage: 1,
        primaryKeyAccuracyAverage: 1,
        constraintAccuracy: 1,
        foreignKeyF1Score: 1,
        foreignKeyAllCorrectRate: 1,
        overallSchemaAccuracy: 1,
      }),
      createEvaluationResult({
        tableF1Score: 1,
        tableAllCorrectRate: 1,
        columnF1ScoreAverage: 1,
        columnAllCorrectRateAverage: 1,
        primaryKeyAccuracyAverage: 1,
        constraintAccuracy: 1,
        foreignKeyF1Score: 1,
        foreignKeyAllCorrectRate: 1,
        overallSchemaAccuracy: 1,
      }),
    ]

    const averages = calculateAverageMetrics(results)

    expect(averages.tableF1Score).toBe(1)
    expect(averages.tableAllCorrectRate).toBe(1)
    expect(averages.columnF1ScoreAverage).toBe(1)
    expect(averages.columnAllCorrectRateAverage).toBe(1)
    expect(averages.primaryKeyAccuracyAverage).toBe(1)
    expect(averages.constraintAccuracy).toBe(1)
    expect(averages.foreignKeyF1Score).toBe(1)
    expect(averages.foreignKeyAllCorrectRate).toBe(1)
    expect(averages.overallSchemaAccuracy).toBe(1)
  })

  it('should calculate correct averages with mixed values', () => {
    const results: EvaluationResult[] = [
      createEvaluationResult({
        tableF1Score: 0.2,
        tableAllCorrectRate: 0.4,
        columnF1ScoreAverage: 0.6,
        columnAllCorrectRateAverage: 0.8,
        primaryKeyAccuracyAverage: 1.0,
        constraintAccuracy: 0.1,
        foreignKeyF1Score: 0.3,
        foreignKeyAllCorrectRate: 0.5,
        overallSchemaAccuracy: 0.7,
      }),
      createEvaluationResult({
        tableF1Score: 0.8,
        tableAllCorrectRate: 0.6,
        columnF1ScoreAverage: 0.4,
        columnAllCorrectRateAverage: 0.2,
        primaryKeyAccuracyAverage: 0.0,
        constraintAccuracy: 0.9,
        foreignKeyF1Score: 0.7,
        foreignKeyAllCorrectRate: 0.5,
        overallSchemaAccuracy: 0.3,
      }),
    ]

    const averages = calculateAverageMetrics(results)

    expect(averages.tableF1Score).toBeCloseTo(0.5)
    expect(averages.tableAllCorrectRate).toBeCloseTo(0.5)
    expect(averages.columnF1ScoreAverage).toBeCloseTo(0.5)
    expect(averages.columnAllCorrectRateAverage).toBeCloseTo(0.5)
    expect(averages.primaryKeyAccuracyAverage).toBeCloseTo(0.5)
    expect(averages.constraintAccuracy).toBeCloseTo(0.5)
    expect(averages.foreignKeyF1Score).toBeCloseTo(0.5)
    expect(averages.foreignKeyAllCorrectRate).toBeCloseTo(0.5)
    expect(averages.overallSchemaAccuracy).toBeCloseTo(0.5)
  })
})
