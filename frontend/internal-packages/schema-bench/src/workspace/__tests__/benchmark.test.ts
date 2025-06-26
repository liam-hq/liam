import type { Schema } from '@liam-hq/db-structure'
import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import { BenchmarkRunner } from '../benchmark'
import type { BenchmarkConfig, FileSystemAdapter } from '../types'

// Mock the evaluate function
vi.mock('../../evaluate/evaluate.ts', () => ({
  evaluate: vi.fn(),
}))

describe('BenchmarkRunner', () => {
  let mockFs: FileSystemAdapter
  let mockEvaluate: MockedFunction<any>
  let benchmarkRunner: BenchmarkRunner

  const mockSchema: Schema = {
    tables: {
      users: {
        name: 'users',
        comment: '',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            default: '',
            check: '',
            primary: true,
            unique: false,
            notNull: true,
            comment: '',
          },
          name: {
            name: 'name',
            type: 'varchar',
            default: '',
            check: '',
            primary: false,
            unique: false,
            notNull: false,
            comment: '',
          },
        },
        indexes: {},
        constraints: {},
      },
    },
  }

  const mockEvaluateResult = {
    tableF1Score: 0.9,
    tableAllCorrectRate: 0.8,
    columnF1ScoreAverage: 0.85,
    columnAllCorrectRateAverage: 0.75,
    primaryKeyAccuracyAverage: 0.95,
    constraintAccuracy: 0.88,
    foreignKeyF1Score: 0.92,
    foreignKeyAllCorrectRate: 0.87,
    overallSchemaAccuracy: 0.89,
    tableMapping: { users: 'users' },
    columnMappings: { users: { id: 'id', name: 'name' } },
  }

  beforeEach(async () => {
    const { evaluate } = await import('../../evaluate/evaluate.ts')
    mockEvaluate = evaluate as MockedFunction<any>
    mockEvaluate.mockClear()
    mockEvaluate.mockResolvedValue(mockEvaluateResult)

    mockFs = {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
      readdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
    }
    benchmarkRunner = new BenchmarkRunner(mockFs)
  })

  describe('runBenchmark', () => {
    const config: BenchmarkConfig = {
      workspacePath: '/test/workspace',
      outputFormat: 'json',
    }

    it('should load output and reference data and run evaluation', async () => {
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['case1.json', 'case2.json']) // output files
        .mockReturnValueOnce(['case1.json', 'case2.json']) // reference files
      ;(mockFs.readFileSync as MockedFunction<any>).mockReturnValue(
        JSON.stringify(mockSchema),
      )

      await benchmarkRunner.runBenchmark(config)

      expect(mockFs.readFileSync).toHaveBeenCalledTimes(4) // 2 output + 2 reference
      expect(mockEvaluate).toHaveBeenCalledTimes(2)
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should run evaluation for specific case when caseId is provided', async () => {
      const configWithCase = { ...config, caseId: 'case1' }
      ;(mockFs.existsSync as MockedFunction<any>)
        .mockReturnValueOnce(true) // output dir exists
        .mockReturnValueOnce(true) // reference dir exists
        .mockReturnValue(true) // evaluation dir exists
      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['case1.json', 'case2.json']) // output files
        .mockReturnValueOnce(['case1.json', 'case2.json']) // reference files
      ;(mockFs.readFileSync as MockedFunction<any>).mockReturnValue(
        JSON.stringify(mockSchema),
      )

      await benchmarkRunner.runBenchmark(configWithCase)

      expect(mockEvaluate).toHaveBeenCalledTimes(1)
      expect(mockEvaluate).toHaveBeenCalledWith(mockSchema, mockSchema)
    })

    it('should throw error if output directory does not exist', async () => {
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(false)

      await expect(benchmarkRunner.runBenchmark(config)).rejects.toThrow(
        'Output directory does not exist',
      )
    })

    it('should throw error if reference directory does not exist', async () => {
      ;(mockFs.existsSync as MockedFunction<any>)
        .mockReturnValueOnce(true) // output dir exists
        .mockReturnValueOnce(false) // reference dir doesn't exist
      ;(mockFs.readdirSync as MockedFunction<any>).mockReturnValueOnce([
        'case1.json',
      ]) // output files

      await expect(benchmarkRunner.runBenchmark(config)).rejects.toThrow(
        'Reference directory does not exist',
      )
    })

    it('should throw error if specific case output schema not found', async () => {
      const configWithCase = { ...config, caseId: 'nonexistent' }
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['case1.json']) // output files
        .mockReturnValueOnce(['case1.json']) // reference files
      ;(mockFs.readFileSync as MockedFunction<any>).mockReturnValue(
        JSON.stringify(mockSchema),
      )

      await expect(
        benchmarkRunner.runBenchmark(configWithCase),
      ).rejects.toThrow('Output schema not found for case: nonexistent')
    })

    it('should throw error if specific case reference schema not found', async () => {
      const configWithCase = { ...config, caseId: 'case1' }
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['case1.json']) // output files
        .mockReturnValueOnce(['case2.json']) // reference files (different case)
      ;(mockFs.readFileSync as MockedFunction<any>).mockReturnValue(
        JSON.stringify(mockSchema),
      )

      await expect(
        benchmarkRunner.runBenchmark(configWithCase),
      ).rejects.toThrow('Reference schema not found for case: case1')
    })

    it('should create summary when multiple results exist', async () => {
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['case1.json', 'case2.json']) // output files
        .mockReturnValueOnce(['case1.json', 'case2.json']) // reference files
      ;(mockFs.readFileSync as MockedFunction<any>).mockReturnValue(
        JSON.stringify(mockSchema),
      )

      await benchmarkRunner.runBenchmark(config)

      // Should write individual results + summary
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3) // 2 individual + 1 summary
    })

    it('should handle JSON parsing errors gracefully', async () => {
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['case1.json']) // output files
        .mockReturnValueOnce(['case1.json']) // reference files
      ;(mockFs.readFileSync as MockedFunction<any>).mockReturnValue(
        'invalid json',
      )

      await expect(benchmarkRunner.runBenchmark(config)).rejects.toThrow()
    })
  })
})
