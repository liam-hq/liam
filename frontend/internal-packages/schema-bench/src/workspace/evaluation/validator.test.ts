import * as fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import type { EvaluationConfig } from '../types'
import { validateDirectories } from './validator.ts'

vi.mock('node:fs')

describe('validateDirectories', () => {
  const mockConfig: EvaluationConfig = {
    workspacePath: '/test/workspace',
    outputFormat: 'json',
  }

  it('should return ok when both directories exist', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return (
        path === '/test/workspace/execution/output' ||
        path === '/test/workspace/execution/reference'
      )
    })

    const result = validateDirectories(mockConfig)

    expect(result.isOk()).toBe(true)
    expect(fs.existsSync).toHaveBeenCalledWith(
      '/test/workspace/execution/output',
    )
    expect(fs.existsSync).toHaveBeenCalledWith(
      '/test/workspace/execution/reference',
    )
  })

  it('should return error when output directory does not exist', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return path === '/test/workspace/execution/reference'
    })

    const result = validateDirectories(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
      if (result.error.type === 'DIRECTORY_NOT_FOUND') {
        expect(result.error.path).toBe('/test/workspace/execution/output')
      }
    }
  })

  it('should return error when reference directory does not exist', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return path === '/test/workspace/execution/output'
    })

    const result = validateDirectories(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
      if (result.error.type === 'DIRECTORY_NOT_FOUND') {
        expect(result.error.path).toBe('/test/workspace/execution/reference')
      }
    }
  })

  it('should return error when both directories do not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)

    const result = validateDirectories(mockConfig)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('DIRECTORY_NOT_FOUND')
      // Should fail on the first check (output directory)
      if (result.error.type === 'DIRECTORY_NOT_FOUND') {
        expect(result.error.path).toBe('/test/workspace/execution/output')
      }
    }
  })
})
