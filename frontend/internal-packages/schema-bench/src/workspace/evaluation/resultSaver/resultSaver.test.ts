import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EvaluationResult } from '../../types'
import { displaySummary, saveResults } from './resultSaver'

vi.mock('node:fs')
vi.mock('node:path')
vi.mock('../metricsCalculator/metricsCalculator')

describe('resultSaver', () => {
  const mockEvaluationResult: EvaluationResult = {
    caseId: 'case1',
    timestamp: '2024-01-01T12:00:00.000Z',
    metrics: {
      tableF1Score: 0.9,
      tableAllCorrectRate: 0.8,
      columnF1ScoreAverage: 0.85,
      columnAllCorrectRateAverage: 0.75,
      primaryKeyAccuracyAverage: 0.95,
      constraintAccuracy: 0.88,
      foreignKeyF1Score: 0.92,
      foreignKeyAllCorrectRate: 0.87,
      overallSchemaAccuracy: 0.89,
    },
    tableMapping: { users: 'users' },
    columnMappings: { users: { id: 'id' } },
  }

  const mockAverageMetrics = {
    tableF1Score: 0.9,
    tableAllCorrectRate: 0.8,
    columnF1ScoreAverage: 0.85,
    columnAllCorrectRateAverage: 0.75,
    primaryKeyAccuracyAverage: 0.95,
    constraintAccuracy: 0.88,
    foreignKeyF1Score: 0.92,
    foreignKeyAllCorrectRate: 0.87,
    overallSchemaAccuracy: 0.89,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('saveResults', () => {
    it('should create evaluation directory if it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const result = saveResults([mockEvaluationResult], '/test/workspace')

      expect(result.isOk()).toBe(true)
      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/workspace/evaluation', {
        recursive: true,
      })
    })

    it('should save individual result files', async () => {
      const { calculateAverageMetrics } = await import(
        '../metricsCalculator/metricsCalculator'
      )
      vi.mocked(calculateAverageMetrics).mockReturnValue(mockAverageMetrics)

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const result = saveResults([mockEvaluationResult], '/test/workspace')

      expect(result.isOk()).toBe(true)
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/workspace/evaluation/case1_results_2024-01-01T12-00-00-000Z.json',
        JSON.stringify(mockEvaluationResult, null, 2),
      )
    })

    it('should save summary file when multiple results exist', async () => {
      const { calculateAverageMetrics } = await import(
        '../metricsCalculator/metricsCalculator'
      )
      vi.mocked(calculateAverageMetrics).mockReturnValue(mockAverageMetrics)

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const multipleResults = [
        mockEvaluationResult,
        { ...mockEvaluationResult, caseId: 'case2' },
      ]

      const result = saveResults(multipleResults, '/test/workspace')

      expect(result.isOk()).toBe(true)
      expect(fs.writeFileSync).toHaveBeenCalledTimes(3) // 2 individual + 1 summary
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/workspace/evaluation/summary_results_2024-01-01T12-00-00-000Z.json',
        expect.stringContaining('"totalCases": 2'),
      )
    })

    it('should not save summary file for single result', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const result = saveResults([mockEvaluationResult], '/test/workspace')

      expect(result.isOk()).toBe(true)
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1) // Only individual file
    })

    it('should return error when directory creation fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = saveResults([mockEvaluationResult], '/test/workspace')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_WRITE_ERROR',
        path: '/test/workspace/evaluation',
        cause: 'Permission denied',
      })
    })

    it('should return error when individual file write fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Disk full')
      })

      const result = saveResults([mockEvaluationResult], '/test/workspace')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_WRITE_ERROR',
        path: '/test/workspace/evaluation/case1_results_2024-01-01T12-00-00-000Z.json',
        cause: 'Disk full',
      })
    })

    it('should return error when summary file write fails', async () => {
      const { calculateAverageMetrics } = await import(
        '../metricsCalculator/metricsCalculator'
      )
      vi.mocked(calculateAverageMetrics).mockReturnValue(mockAverageMetrics)

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.writeFileSync)
        .mockImplementationOnce(() => {}) // First individual file succeeds
        .mockImplementationOnce(() => {}) // Second individual file succeeds
        .mockImplementationOnce(() => {
          throw new Error('Summary write failed')
        })

      const multipleResults = [
        mockEvaluationResult,
        { ...mockEvaluationResult, caseId: 'case2' },
      ]

      const result = saveResults(multipleResults, '/test/workspace')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_WRITE_ERROR',
        path: '/test/workspace/evaluation/summary_results_2024-01-01T12-00-00-000Z.json',
        cause: 'Summary write failed',
      })
    })

    it('should handle non-Error objects in catch blocks', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw 'String error'
      })

      const result = saveResults([mockEvaluationResult], '/test/workspace')

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_WRITE_ERROR',
        path: '/test/workspace/evaluation',
        cause: 'Unknown error',
      })
    })

    it('should properly escape colons and dots in timestamps', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const resultWithSpecialTimestamp = {
        ...mockEvaluationResult,
        timestamp: '2024-12-25T23:59:59.999Z',
      }

      saveResults([resultWithSpecialTimestamp], '/test/workspace')

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/workspace/evaluation/case1_results_2024-12-25T23-59-59-999Z.json',
        expect.any(String),
      )
    })
  })

  describe('displaySummary', () => {
    it('should handle empty results array', () => {
      expect(() => displaySummary([])).not.toThrow()
    })

    it('should handle non-empty results array', () => {
      expect(() => displaySummary([mockEvaluationResult])).not.toThrow()
    })
  })
})
