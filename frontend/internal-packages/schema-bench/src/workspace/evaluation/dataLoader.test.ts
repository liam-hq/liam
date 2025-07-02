import * as fs from 'node:fs'
import type { Schema } from '@liam-hq/db-structure'
import { describe, expect, it, vi } from 'vitest'
import { loadOutputData, loadReferenceData } from './dataLoader.ts'

vi.mock('node:fs')

describe('dataLoader', () => {
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
            notNull: true,
            comment: '',
          },
        },
        indexes: {},
        constraints: {},
      },
    },
  }

  describe('loadOutputData', () => {
    it('should load output data successfully', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        'case1.json',
        'case2.json',
      ] as any)
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        const pathStr = String(filePath)
        if (pathStr.includes('case1.json')) {
          return JSON.stringify(mockSchema)
        }
        if (pathStr.includes('case2.json')) {
          return JSON.stringify({ ...mockSchema, tables: {} })
        }
        return ''
      })

      const result = loadOutputData(workspacePath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.size).toBe(2)
        expect(result.value.get('case1')).toEqual(mockSchema)
        expect(result.value.get('case2')).toEqual({
          ...mockSchema,
          tables: {},
        })
      }
    })

    it('should filter non-json files', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        'case1.json',
        'README.md',
        'case2.txt',
        'case3.json',
      ] as any)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSchema))

      const result = loadOutputData(workspacePath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.size).toBe(2) // Only case1.json and case3.json
        expect(result.value.has('case1')).toBe(true)
        expect(result.value.has('case3')).toBe(true)
      }
    })

    it('should return error when directory does not exist', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = loadOutputData(workspacePath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
        if (result.error.type === 'DIRECTORY_NOT_FOUND') {
          expect(result.error.path).toBe('/test/workspace/execution/output')
        }
      }
    })

    it('should return error when directory read fails', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = loadOutputData(workspacePath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('FILE_READ_ERROR')
        if (result.error.type === 'FILE_READ_ERROR') {
          expect(result.error.path).toBe('/test/workspace/execution/output')
        }
      }
    })

    it('should return error when JSON parsing fails', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue(['case1.json'] as any)
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json')

      const result = loadOutputData(workspacePath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('JSON_PARSE_ERROR')
        if (result.error.type === 'JSON_PARSE_ERROR') {
          expect(result.error.path).toContain('case1.json')
        }
      }
    })
  })

  describe('loadReferenceData', () => {
    it('should load reference data successfully', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        'case1.json',
        'case2.json',
      ] as any)
      vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
        const pathStr = String(filePath)
        if (pathStr.includes('case1.json')) {
          return JSON.stringify(mockSchema)
        }
        if (pathStr.includes('case2.json')) {
          return JSON.stringify({ ...mockSchema, tables: {} })
        }
        return ''
      })

      const result = loadReferenceData(workspacePath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.size).toBe(2)
        expect(result.value.get('case1')).toEqual(mockSchema)
        expect(result.value.get('case2')).toEqual({
          ...mockSchema,
          tables: {},
        })
      }
    })

    it('should handle empty directory', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([] as any)

      const result = loadReferenceData(workspacePath)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.size).toBe(0)
      }
    })

    it('should return error when directory does not exist', () => {
      const workspacePath = '/test/workspace'

      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = loadReferenceData(workspacePath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
        if (result.error.type === 'DIRECTORY_NOT_FOUND') {
          expect(result.error.path).toBe('/test/workspace/execution/reference')
        }
      }
    })
  })
})
