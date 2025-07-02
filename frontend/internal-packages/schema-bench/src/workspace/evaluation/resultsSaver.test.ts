import * as fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EvaluationResult } from '../types'
import { saveResults } from './resultsSaver.ts'

// Mock the dependent modules
vi.mock('node:fs')
vi.mock('./metricsCalculator.ts', () => ({
  calculateAverageMetrics: vi.fn(),
}))

describe('resultsSaver', () => {
  const mockEvaluationResult: EvaluationResult = {
    timestamp: '2024-01-01T00:00:00.000Z',
    caseId: 'case1',
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

  describe('saveResults', () => {
    const workspacePath = '/test/workspace'
    const evaluationPath = '/test/workspace/evaluation'

    beforeEach(() => {
      vi.clearAllMocks()
      // Default mock implementations
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
      vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)
    })

    it('should save single result without summary', () => {
      const results = [mockEvaluationResult]

      const result = saveResults(results, workspacePath)

      expect(result.isOk()).toBe(true)

      // Should create directory if it doesn't exist
      expect(fs.existsSync).toHaveBeenCalledWith(evaluationPath)

      // Should save individual result
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(`${evaluationPath}/case1_results_`),
        JSON.stringify(mockEvaluationResult, null, 2),
      )
    })

    it('should save multiple results with summary', async () => {
      const { calculateAverageMetrics } = await import('./metricsCalculator.ts')

      const results = [
        mockEvaluationResult,
        { ...mockEvaluationResult, caseId: 'case2' },
      ]

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

      vi.mocked(calculateAverageMetrics).mockReturnValue(mockAverageMetrics)

      const result = saveResults(results, workspacePath)

      expect(result.isOk()).toBe(true)

      // Should save individual results
      expect(fs.writeFileSync).toHaveBeenCalledTimes(3) // 2 individual + 1 summary
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(`${evaluationPath}/case1_results_`),
        JSON.stringify(results[0], null, 2),
      )
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(`${evaluationPath}/case2_results_`),
        JSON.stringify(results[1], null, 2),
      )

      // Should save summary
      const summaryCall = vi
        .mocked(fs.writeFileSync)
        .mock.calls.find((call) => String(call[0]).includes('summary_results_'))
      expect(summaryCall).toBeDefined()
      const summaryData = JSON.parse(summaryCall?.[1] as string) as {
        totalCases: number
        averageMetrics: typeof mockAverageMetrics
      }
      expect(summaryData.totalCases).toBe(2)
      expect(summaryData.averageMetrics).toEqual(mockAverageMetrics)
    })

    it('should create directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const results = [mockEvaluationResult]
      const result = saveResults(results, workspacePath)

      expect(result.isOk()).toBe(true)
      expect(fs.mkdirSync).toHaveBeenCalledWith(evaluationPath, {
        recursive: true,
      })
    })

    it('should handle empty results array', () => {
      const results: EvaluationResult[] = []

      const result = saveResults(results, workspacePath)

      expect(result.isOk()).toBe(true)
      // Should not write any files
      expect(fs.writeFileSync).not.toHaveBeenCalled()
    })

    it('should return error when directory creation fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.mocked(fs.mkdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const results = [mockEvaluationResult]
      const result = saveResults(results, workspacePath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_WRITE_ERROR')
        if (result.error.type === 'FILE_WRITE_ERROR') {
          expect(result.error.path).toBe(evaluationPath)
        }
      }
    })

    it('should return error when file write fails', () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Disk full')
      })

      const results = [mockEvaluationResult]
      const result = saveResults(results, workspacePath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_WRITE_ERROR')
        if (result.error.type === 'FILE_WRITE_ERROR') {
          expect(result.error.path).toContain('case1_results_')
        }
      }
    })

    it('should handle special characters in case IDs', () => {
      const resultWithSpecialChars = {
        ...mockEvaluationResult,
        caseId: 'case/with\\special:chars',
      }

      const result = saveResults([resultWithSpecialChars], workspacePath)

      expect(result.isOk()).toBe(true)
      // The actual implementation might need to sanitize file names
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('case/with\\special:chars_results_'),
        expect.any(String),
      )
    })

    it('should generate summary with correct timestamp', async () => {
      const { calculateAverageMetrics } = await import('./metricsCalculator.ts')

      const results = [
        mockEvaluationResult,
        { ...mockEvaluationResult, caseId: 'case2' },
      ]

      vi.mocked(calculateAverageMetrics).mockReturnValue({
        tableF1Score: 0.9,
        tableAllCorrectRate: 0.8,
        columnF1ScoreAverage: 0.85,
        columnAllCorrectRateAverage: 0.75,
        primaryKeyAccuracyAverage: 0.95,
        constraintAccuracy: 0.88,
        foreignKeyF1Score: 0.92,
        foreignKeyAllCorrectRate: 0.87,
        overallSchemaAccuracy: 0.89,
      })

      const beforeTime = new Date().toISOString()
      const result = saveResults(results, workspacePath)
      const afterTime = new Date().toISOString()

      expect(result.isOk()).toBe(true)

      const summaryCall = vi
        .mocked(fs.writeFileSync)
        .mock.calls.find((call) => String(call[0]).includes('summary_results_'))
      const summaryData = JSON.parse(summaryCall?.[1] as string) as {
        timestamp: string
      }

      // Timestamp should be between before and after
      expect(summaryData.timestamp >= beforeTime).toBe(true)
      expect(summaryData.timestamp <= afterTime).toBe(true)
    })
  })
})
