import { describe, expect, it } from 'vitest'
import type { EvaluationResult } from '../types'
import { calculateAverageMetrics } from './metricsCalculator.ts'

describe('calculateAverageMetrics', () => {
  it('should calculate average metrics for multiple results', () => {
    const results: EvaluationResult[] = [
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        caseId: 'case1',
        metrics: {
          tableF1Score: 0.8,
          tableAllCorrectRate: 0.7,
          columnF1ScoreAverage: 0.6,
          columnAllCorrectRateAverage: 0.5,
          primaryKeyAccuracyAverage: 0.9,
          constraintAccuracy: 0.85,
          foreignKeyF1Score: 0.75,
          foreignKeyAllCorrectRate: 0.65,
          overallSchemaAccuracy: 0.7,
        },
        tableMapping: {},
        columnMappings: {},
      },
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        caseId: 'case2',
        metrics: {
          tableF1Score: 1.0,
          tableAllCorrectRate: 0.9,
          columnF1ScoreAverage: 0.8,
          columnAllCorrectRateAverage: 0.7,
          primaryKeyAccuracyAverage: 0.95,
          constraintAccuracy: 0.95,
          foreignKeyF1Score: 0.85,
          foreignKeyAllCorrectRate: 0.75,
          overallSchemaAccuracy: 0.9,
        },
        tableMapping: {},
        columnMappings: {},
      },
    ]

    const averageMetrics = calculateAverageMetrics(results)

    expect(averageMetrics.tableF1Score).toBeCloseTo(0.9) // (0.8 + 1.0) / 2
    expect(averageMetrics.tableAllCorrectRate).toBeCloseTo(0.8) // (0.7 + 0.9) / 2
    expect(averageMetrics.columnF1ScoreAverage).toBeCloseTo(0.7) // (0.6 + 0.8) / 2
    expect(averageMetrics.columnAllCorrectRateAverage).toBeCloseTo(0.6) // (0.5 + 0.7) / 2
    expect(averageMetrics.primaryKeyAccuracyAverage).toBeCloseTo(0.925) // (0.9 + 0.95) / 2
    expect(averageMetrics.constraintAccuracy).toBeCloseTo(0.9) // (0.85 + 0.95) / 2
    expect(averageMetrics.foreignKeyF1Score).toBeCloseTo(0.8) // (0.75 + 0.85) / 2
    expect(averageMetrics.foreignKeyAllCorrectRate).toBeCloseTo(0.7) // (0.65 + 0.75) / 2
    expect(averageMetrics.overallSchemaAccuracy).toBeCloseTo(0.8) // (0.7 + 0.9) / 2
  })

  it('should return the same metrics for a single result', () => {
    const results: EvaluationResult[] = [
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        caseId: 'case1',
        metrics: {
          tableF1Score: 0.8,
          tableAllCorrectRate: 0.7,
          columnF1ScoreAverage: 0.6,
          columnAllCorrectRateAverage: 0.5,
          primaryKeyAccuracyAverage: 0.9,
          constraintAccuracy: 0.85,
          foreignKeyF1Score: 0.75,
          foreignKeyAllCorrectRate: 0.65,
          overallSchemaAccuracy: 0.7,
        },
        tableMapping: {},
        columnMappings: {},
      },
    ]

    const averageMetrics = calculateAverageMetrics(results)

    expect(averageMetrics.tableF1Score).toBe(0.8)
    expect(averageMetrics.tableAllCorrectRate).toBe(0.7)
    expect(averageMetrics.columnF1ScoreAverage).toBe(0.6)
    expect(averageMetrics.columnAllCorrectRateAverage).toBe(0.5)
    expect(averageMetrics.primaryKeyAccuracyAverage).toBe(0.9)
    expect(averageMetrics.constraintAccuracy).toBe(0.85)
    expect(averageMetrics.foreignKeyF1Score).toBe(0.75)
    expect(averageMetrics.foreignKeyAllCorrectRate).toBe(0.65)
    expect(averageMetrics.overallSchemaAccuracy).toBe(0.7)
  })

  it('should handle empty results array', () => {
    const results: EvaluationResult[] = []

    const averageMetrics = calculateAverageMetrics(results)

    // When dividing by 0, all metrics should be NaN
    expect(averageMetrics.tableF1Score).toBeNaN()
    expect(averageMetrics.tableAllCorrectRate).toBeNaN()
    expect(averageMetrics.columnF1ScoreAverage).toBeNaN()
    expect(averageMetrics.columnAllCorrectRateAverage).toBeNaN()
    expect(averageMetrics.primaryKeyAccuracyAverage).toBeNaN()
    expect(averageMetrics.constraintAccuracy).toBeNaN()
    expect(averageMetrics.foreignKeyF1Score).toBeNaN()
    expect(averageMetrics.foreignKeyAllCorrectRate).toBeNaN()
    expect(averageMetrics.overallSchemaAccuracy).toBeNaN()
  })

  it('should handle results with zero values', () => {
    const results: EvaluationResult[] = [
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        caseId: 'case1',
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
        },
        tableMapping: {},
        columnMappings: {},
      },
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        caseId: 'case2',
        metrics: {
          tableF1Score: 1,
          tableAllCorrectRate: 1,
          columnF1ScoreAverage: 1,
          columnAllCorrectRateAverage: 1,
          primaryKeyAccuracyAverage: 1,
          constraintAccuracy: 1,
          foreignKeyF1Score: 1,
          foreignKeyAllCorrectRate: 1,
          overallSchemaAccuracy: 1,
        },
        tableMapping: {},
        columnMappings: {},
      },
    ]

    const averageMetrics = calculateAverageMetrics(results)

    // All metrics should be 0.5 (average of 0 and 1)
    expect(averageMetrics.tableF1Score).toBe(0.5)
    expect(averageMetrics.tableAllCorrectRate).toBe(0.5)
    expect(averageMetrics.columnF1ScoreAverage).toBe(0.5)
    expect(averageMetrics.columnAllCorrectRateAverage).toBe(0.5)
    expect(averageMetrics.primaryKeyAccuracyAverage).toBe(0.5)
    expect(averageMetrics.constraintAccuracy).toBe(0.5)
    expect(averageMetrics.foreignKeyF1Score).toBe(0.5)
    expect(averageMetrics.foreignKeyAllCorrectRate).toBe(0.5)
    expect(averageMetrics.overallSchemaAccuracy).toBe(0.5)
  })
})
