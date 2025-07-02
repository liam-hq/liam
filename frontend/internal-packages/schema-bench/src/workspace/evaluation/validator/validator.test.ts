import * as fs from 'node:fs'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EvaluationConfig } from '../../types'
import { validateDirectories } from './validator'

vi.mock('node:fs')
vi.mock('node:path')

describe('validateDirectories', () => {
  const mockConfig: EvaluationConfig = {
    workspacePath: '/test/workspace',
    outputFormat: 'json',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
  })

  it('should return ok when both output and reference directories exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)

    const result = validateDirectories(mockConfig)

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap()).toBe(undefined)
    expect(fs.existsSync).toHaveBeenCalledTimes(2)
    expect(fs.existsSync).toHaveBeenCalledWith(
      '/test/workspace/execution/output',
    )
    expect(fs.existsSync).toHaveBeenCalledWith(
      '/test/workspace/execution/reference',
    )
  })

  it('should return error when output directory does not exist', () => {
    vi.mocked(fs.existsSync)
      .mockReturnValueOnce(false) // output dir
      .mockReturnValueOnce(true) // reference dir

    const result = validateDirectories(mockConfig)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'DIRECTORY_NOT_FOUND',
      path: '/test/workspace/execution/output',
    })
    expect(fs.existsSync).toHaveBeenCalledTimes(1)
  })

  it('should return error when reference directory does not exist', () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (path === '/test/workspace/execution/output') return true
      if (path === '/test/workspace/execution/reference') return false
      return false
    })

    const result = validateDirectories(mockConfig)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'DIRECTORY_NOT_FOUND',
      path: '/test/workspace/execution/reference',
    })
    expect(fs.existsSync).toHaveBeenCalledTimes(2)
  })

  it('should handle different workspace paths', () => {
    const customConfig: EvaluationConfig = {
      workspacePath: '/custom/path/to/workspace',
      outputFormat: 'json',
    }

    vi.mocked(fs.existsSync).mockReturnValue(true)

    const result = validateDirectories(customConfig)

    expect(result.isOk()).toBe(true)
    expect(path.join).toHaveBeenCalledWith(
      '/custom/path/to/workspace',
      'execution',
      'output',
    )
    expect(path.join).toHaveBeenCalledWith(
      '/custom/path/to/workspace',
      'execution',
      'reference',
    )
  })

  it('should validate directories for config with caseId', () => {
    const configWithCaseId: EvaluationConfig = {
      workspacePath: '/test/workspace',
      outputFormat: 'json',
      caseId: 'specific-case',
    }

    vi.mocked(fs.existsSync).mockReturnValue(true)

    const result = validateDirectories(configWithCaseId)

    expect(result.isOk()).toBe(true)
    expect(fs.existsSync).toHaveBeenCalledWith(
      '/test/workspace/execution/output',
    )
    expect(fs.existsSync).toHaveBeenCalledWith(
      '/test/workspace/execution/reference',
    )
  })

  it('should check output directory before reference directory', () => {
    const callOrder: string[] = []
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      callOrder.push(path as string)
      return false
    })

    validateDirectories(mockConfig)

    expect(callOrder[0]).toBe('/test/workspace/execution/output')
    expect(callOrder.length).toBe(1) // Should stop after first failure
  })
})
