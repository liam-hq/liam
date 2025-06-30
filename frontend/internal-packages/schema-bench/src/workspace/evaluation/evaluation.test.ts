import * as fs from 'node:fs'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Schema } from '@liam-hq/db-structure'
import { evaluateSchema } from './evaluation.ts'
import type { EvaluationConfig } from '../types'

// Mock the evaluate module
vi.mock('../../evaluate/evaluate.ts', () => ({
  evaluate: vi.fn(),
}))

// Mock fs module
vi.mock('node:fs')

// Mock path module 
vi.mock('node:path', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:path')>()),
  join: vi.fn(),
  basename: vi.fn(),
}))

const mockFs = vi.mocked(fs)
const mockPath = vi.mocked(path)
const { evaluate } = await import('../../evaluate/evaluate.ts')
const mockEvaluate = vi.mocked(evaluate)

describe('evaluateSchema', () => {
  const mockWorkspacePath = '/test/workspace'
  const mockConfig: EvaluationConfig = {
    workspacePath: mockWorkspacePath,
    outputFormat: 'json',
  }

  const mockSchema: Schema = {
    tables: {
      users: {
        name: 'users',
        columns: {
          id: {
            name: 'id',
            type: 'integer',
            default: null,
            check: null,
            notNull: true,
            comment: null,
          },
          name: {
            name: 'name',
            type: 'varchar',
            default: null,
            check: null,
            notNull: true,
            comment: null,
          },
        },
        comment: null,
        indexes: {},
        constraints: {},
      },
    },
  }

  const mockEvaluationResult = {
    tableF1Score: 0.95,
    tableAllCorrectRate: 0.9,
    columnF1ScoreAverage: 0.85,
    columnAllCorrectRateAverage: 0.8,
    primaryKeyAccuracyAverage: 0.92,
    constraintAccuracy: 0.88,
    foreignKeyF1Score: 0.9,
    foreignKeyAllCorrectRate: 0.85,
    overallSchemaAccuracy: 0.87,
    tableMapping: { users: 'users' },
    columnMappings: { users: { id: 'id', name: 'name' } },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockPath.join.mockImplementation((...args) => args.join('/'))
    mockPath.basename.mockImplementation((filePath, ext) => {
      const fileName = filePath.split('/').pop() || ''
      return ext ? fileName.replace(ext, '') : fileName
    })
    
    mockFs.existsSync.mockReturnValue(true)
    mockFs.mkdirSync.mockReturnValue(undefined)
    mockFs.writeFileSync.mockReturnValue(undefined)
    mockFs.readdirSync.mockReturnValue(['case1.json'] as any)
    mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSchema))
    mockEvaluate.mockResolvedValue(mockEvaluationResult)
  })

  describe('directory validation', () => {
    it('should throw error when output directory does not exist', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        return !dirPath.toString().includes('output')
      })

      await expect(evaluateSchema(mockConfig)).rejects.toThrow(
        'Output directory does not exist'
      )
    })

    it('should throw error when reference directory does not exist', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        return !dirPath.toString().includes('reference')
      })

      await expect(evaluateSchema(mockConfig)).rejects.toThrow(
        'Reference directory does not exist'
      )
    })
  })

  describe('data loading', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue(['case1.json', 'case2.json', 'not-json.txt'] as any)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSchema))
    })

    it('should load output and reference data successfully', async () => {
      await expect(evaluateSchema(mockConfig)).resolves.not.toThrow()
      
      expect(mockFs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('output'))
      expect(mockFs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('reference'))
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(4) // 2 output + 2 reference files
    })

    it('should filter only JSON files', async () => {
      await evaluateSchema(mockConfig)
      
      // Should read only the JSON files (case1.json, case2.json), not not-json.txt
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(4) // 2 output + 2 reference files
    })

    it('should throw error when JSON parsing fails', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json')
      
      await expect(evaluateSchema(mockConfig)).rejects.toThrow()
    })
  })

  describe('specific case evaluation', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue(['case1.json'] as any)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSchema))
    })

    it('should evaluate specific case when caseId is provided', async () => {
      const configWithCaseId: EvaluationConfig = {
        ...mockConfig,
        caseId: 'case1',
      }

      await evaluateSchema(configWithCaseId)
      
      expect(mockEvaluate).toHaveBeenCalledTimes(1)
    })

    it('should throw error when specific case output schema is not found', async () => {
      const configWithCaseId: EvaluationConfig = {
        ...mockConfig,
        caseId: 'nonexistent',
      }

      await expect(evaluateSchema(configWithCaseId)).rejects.toThrow(
        'Output schema not found for case: nonexistent'
      )
    })

    it('should throw error when specific case reference schema is not found', async () => {
      const configWithCaseId: EvaluationConfig = {
        ...mockConfig,
        caseId: 'case1',
      }

      // Mock to return output but not reference
      mockFs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.toString().includes('output')) {
          return ['case1.json'] as any
        }
        return [] as any // No reference files
      })

      await expect(evaluateSchema(configWithCaseId)).rejects.toThrow(
        'Reference schema not found for case: case1'
      )
    })
  })

  describe('all cases evaluation', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue(['case1.json', 'case2.json'] as any)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSchema))
    })

    it('should evaluate all cases when no caseId is provided', async () => {
      await evaluateSchema(mockConfig)
      
      expect(mockEvaluate).toHaveBeenCalledTimes(2)
    })

    it('should skip cases without matching reference schema', async () => {
      // Mock different files in output vs reference
      mockFs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.toString().includes('output')) {
          return ['case1.json', 'case2.json'] as any
        }
        return ['case1.json'] as any // Only case1 has reference
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await evaluateSchema(mockConfig)
      
      expect(mockEvaluate).toHaveBeenCalledTimes(1) // Only case1 evaluated
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No reference schema found for case: case2')
      )

      consoleSpy.mockRestore()
    })

    it('should throw error when no cases to evaluate', async () => {
      mockFs.readdirSync.mockReturnValue([] as any)

      await expect(evaluateSchema(mockConfig)).rejects.toThrow(
        'No cases to evaluate. Make sure output and reference schemas exist.'
      )
    })
  })

  describe('results saving', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue(['case1.json'] as any)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSchema))
    })

    it('should save individual results', async () => {
      await evaluateSchema(mockConfig)
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('case1_results_'),
        expect.stringContaining('"caseId":"case1"')
      )
    })

    it('should save summary results for multiple cases', async () => {
      mockFs.readdirSync.mockReturnValue(['case1.json', 'case2.json'] as any)
      
      await evaluateSchema(mockConfig)
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('summary_results_'),
        expect.stringContaining('"totalCases":2')
      )
    })

    it('should create evaluation directory if it does not exist', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        return !dirPath.toString().includes('evaluation')
      })

      await evaluateSchema(mockConfig)
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('evaluation'),
        { recursive: true }
      )
    })
  })

  describe('result structure', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue(['case1.json'] as any)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockSchema))
    })

    it('should create evaluation result with correct structure', async () => {
      await evaluateSchema(mockConfig)
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/"timestamp":\s*"[\d-T:.Z]+/)
      )
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"caseId":"case1"')
      )
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"tableF1Score":0.95')
      )
    })

    it('should handle different output formats', async () => {
      const summaryConfig: EvaluationConfig = {
        ...mockConfig,
        outputFormat: 'summary',
      }

      await evaluateSchema(summaryConfig)
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      )
    })
  })
})
