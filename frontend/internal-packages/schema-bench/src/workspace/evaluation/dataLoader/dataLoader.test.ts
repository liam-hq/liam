import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Schema } from '@liam-hq/db-structure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadOutputData, loadReferenceData } from './dataLoader'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}))
vi.mock('node:path')

describe('dataLoader', () => {
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
        },
        comment: null,
        indexes: {},
        constraints: {},
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadOutputData', () => {
    const workspacePath = '/test/workspace'
    const outputDir = '/test/workspace/execution/output'

    beforeEach(() => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
    })

    it('should load all JSON files from output directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        'case1.json',
        'case2.json',
        'README.md',
        // biome-ignore lint/suspicious/noExplicitAny: mocking fs return value
      ] as any)
      vi.mocked(path.basename).mockImplementation((filePath) => {
        if (filePath === 'case1.json') return 'case1'
        if (filePath === 'case2.json') return 'case2'
        return filePath
      })
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSchema))

      const result = loadOutputData(workspacePath)

      expect(result.isOk()).toBe(true)
      const data = result._unsafeUnwrap()
      expect(data.size).toBe(2)
      expect(data.get('case1')).toEqual(mockSchema)
      expect(data.get('case2')).toEqual(mockSchema)
      expect(fs.readFileSync).toHaveBeenCalledTimes(2)
    })

    it('should return error when output directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = loadOutputData(workspacePath)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'DIRECTORY_NOT_FOUND',
        path: outputDir,
      })
    })

    it('should return error when JSON parsing fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      // biome-ignore lint/suspicious/noExplicitAny: mocking fs return value
      vi.mocked(fs.readdirSync).mockReturnValue(['case1.json'] as any)
      vi.mocked(path.basename).mockReturnValue('case1')
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json')

      const result = loadOutputData(workspacePath)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'JSON_PARSE_ERROR',
        path: `${outputDir}/case1.json`,
        cause: expect.stringContaining('JSON'),
      })
    })

    it('should return error when file read fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = loadOutputData(workspacePath)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_READ_ERROR',
        path: outputDir,
        cause: 'Permission denied',
      })
    })

    it('should handle empty directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([])

      const result = loadOutputData(workspacePath)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().size).toBe(0)
    })
  })

  describe('loadReferenceData', () => {
    const workspacePath = '/test/workspace'
    const referenceDir = '/test/workspace/execution/reference'

    beforeEach(() => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
    })

    it('should load all JSON files from reference directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        'case1.json',
        'case2.json',
        'config.yml',
        // biome-ignore lint/suspicious/noExplicitAny: mocking fs return value
      ] as any)
      vi.mocked(path.basename).mockImplementation((filePath) => {
        if (filePath === 'case1.json') return 'case1'
        if (filePath === 'case2.json') return 'case2'
        return filePath
      })
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSchema))

      const result = loadReferenceData(workspacePath)

      expect(result.isOk()).toBe(true)
      const data = result._unsafeUnwrap()
      expect(data.size).toBe(2)
      expect(data.get('case1')).toEqual(mockSchema)
      expect(data.get('case2')).toEqual(mockSchema)
      expect(fs.readFileSync).toHaveBeenCalledTimes(2)
    })

    it('should return error when reference directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = loadReferenceData(workspacePath)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'DIRECTORY_NOT_FOUND',
        path: referenceDir,
      })
    })

    it('should return error when JSON parsing fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      // biome-ignore lint/suspicious/noExplicitAny: mocking fs return value
      vi.mocked(fs.readdirSync).mockReturnValue(['case1.json'] as any)
      vi.mocked(path.basename).mockReturnValue('case1')
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid: json }')

      const result = loadReferenceData(workspacePath)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'JSON_PARSE_ERROR',
        path: `${referenceDir}/case1.json`,
        cause: expect.stringContaining('JSON'),
      })
    })

    it('should return error when file read fails with non-Error object', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw 'String error'
      })

      const result = loadReferenceData(workspacePath)

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr()).toEqual({
        type: 'FILE_READ_ERROR',
        path: referenceDir,
        cause: 'Unknown error',
      })
    })

    it('should filter only JSON files', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        'case1.json',
        'readme.txt',
        '.hidden',
        'data.JSON',
        // biome-ignore lint/suspicious/noExplicitAny: mocking fs return value
      ] as any)
      vi.mocked(path.basename).mockReturnValue('case1')
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSchema))

      const result = loadReferenceData(workspacePath)

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap().size).toBe(1)
      expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    })
  })
})
