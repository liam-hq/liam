import { describe, expect, it } from 'vitest'
import type { AverageCalculationParams } from '../types'
import { calculateAverages } from './calculateAverages'

describe('calculateAverages', () => {
  it('should calculate averages correctly with normal values', () => {
    const params: AverageCalculationParams = {
      totalColumnF1Score: 8.0,
      totalColumnAllCorrectCount: 3,
      totalPrimaryKeyCorrectCount: 2,
      totalConstraintCorrectCount: 4,
      totalTableCount: 4,
    }

    const result = calculateAverages(params)

    expect(result).toEqual({
      columnF1ScoreAverage: 2.0, // 8.0 / 4
      columnAllCorrectRateAverage: 0.75, // 3 / 4
      primaryKeyAccuracyAverage: 0.5, // 2 / 4
      constraintAccuracy: 1.0, // 4 / 4
    })
  })

  it('should handle zero division gracefully', () => {
    const params: AverageCalculationParams = {
      totalColumnF1Score: 0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 0,
      totalConstraintCorrectCount: 0,
      totalTableCount: 0,
    }

    const result = calculateAverages(params)

    expect(result).toEqual({
      columnF1ScoreAverage: 0,
      columnAllCorrectRateAverage: 0,
      primaryKeyAccuracyAverage: 0,
      constraintAccuracy: 0,
    })
  })

  it('should handle partial zero values', () => {
    const params: AverageCalculationParams = {
      totalColumnF1Score: 5.0,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 1,
      totalConstraintCorrectCount: 0,
      totalTableCount: 2,
    }

    const result = calculateAverages(params)

    expect(result).toEqual({
      columnF1ScoreAverage: 2.5, // 5.0 / 2
      columnAllCorrectRateAverage: 0, // 0 / 2
      primaryKeyAccuracyAverage: 0.5, // 1 / 2
      constraintAccuracy: 0, // 0 / 2
    })
  })

  it('should handle perfect scores', () => {
    const params: AverageCalculationParams = {
      totalColumnF1Score: 3.0,
      totalColumnAllCorrectCount: 3,
      totalPrimaryKeyCorrectCount: 3,
      totalConstraintCorrectCount: 3,
      totalTableCount: 3,
    }

    const result = calculateAverages(params)

    expect(result).toEqual({
      columnF1ScoreAverage: 1.0, // 3.0 / 3
      columnAllCorrectRateAverage: 1.0, // 3 / 3
      primaryKeyAccuracyAverage: 1.0, // 3 / 3
      constraintAccuracy: 1.0, // 3 / 3
    })
  })

  it('should handle single table scenario', () => {
    const params: AverageCalculationParams = {
      totalColumnF1Score: 0.8,
      totalColumnAllCorrectCount: 0,
      totalPrimaryKeyCorrectCount: 1,
      totalConstraintCorrectCount: 0,
      totalTableCount: 1,
    }

    const result = calculateAverages(params)

    expect(result).toEqual({
      columnF1ScoreAverage: 0.8, // 0.8 / 1
      columnAllCorrectRateAverage: 0, // 0 / 1
      primaryKeyAccuracyAverage: 1.0, // 1 / 1
      constraintAccuracy: 0, // 0 / 1
    })
  })
})
