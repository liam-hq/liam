import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { FileSystemError } from '../../errors.js'
import { buildCommand } from './index.js'

vi.mock('node:fs')
vi.mock('../runPreprocess.js')

describe('buildCommand', () => {
  const mockInputPath = '/test/input.sql'
  const mockOutDir = '/test/output'
  const mockFormat = 'postgres' as const

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully build when all operations succeed', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: '/test/output/schema.json',
      errors: [],
    })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdirSync).mockImplementation(() => {})
    vi.mocked(fs.cpSync).mockImplementation(() => {})
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const result = await buildCommand(mockInputPath, mockOutDir, mockFormat)

    expect(result).toEqual([])
    expect(runPreprocess).toHaveBeenCalledWith(mockInputPath, path.resolve(mockOutDir), mockFormat)
    expect(fs.existsSync).toHaveBeenCalled()
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.resolve(mockOutDir), { recursive: true })
    expect(fs.cpSync).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should return preprocessing errors when runPreprocess fails', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    const preprocessError = new FileSystemError('Preprocessing failed')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: null,
      errors: [preprocessError],
    })

    const result = await buildCommand(mockInputPath, mockOutDir, mockFormat)

    expect(result).toEqual([preprocessError])
    expect(fs.existsSync).not.toHaveBeenCalled()
  })

  it('should return error when source directory does not exist', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: '/test/output/schema.json',
      errors: [],
    })
    vi.mocked(fs.existsSync).mockReturnValue(false)

    const result = await buildCommand(mockInputPath, mockOutDir, mockFormat)

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(FileSystemError)
    expect(result[0].message).toContain('does not exist')
  })

  it('should handle file system errors during copy operation', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: '/test/output/schema.json',
      errors: [],
    })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdirSync).mockImplementation(() => {
      throw new Error('Permission denied')
    })

    const result = await buildCommand(mockInputPath, mockOutDir, mockFormat)

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(FileSystemError)
    expect(result[0].message).toContain('Error processing files')
  })

  it('should handle file system errors during cpSync operation', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: '/test/output/schema.json',
      errors: [],
    })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdirSync).mockImplementation(() => {})
    vi.mocked(fs.cpSync).mockImplementation(() => {
      throw new Error('Copy failed')
    })

    const result = await buildCommand(mockInputPath, mockOutDir, mockFormat)

    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(FileSystemError)
    expect(result[0].message).toContain('Error processing files')
  })

  it('should display relative path for relative output directory', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: '/test/output/schema.json',
      errors: [],
    })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdirSync).mockImplementation(() => {})
    vi.mocked(fs.cpSync).mockImplementation(() => {})
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const relativeOutDir = './relative-output'
    await buildCommand(mockInputPath, relativeOutDir, mockFormat)

    expect(consoleSpy).toHaveBeenCalled()
    const consoleCall = consoleSpy.mock.calls[0][0]
    expect(consoleCall).toContain('relative-output')

    consoleSpy.mockRestore()
  })

  it('should display absolute path for absolute output directory', async () => {
    const { runPreprocess } = await import('../runPreprocess.js')
    vi.mocked(runPreprocess).mockResolvedValue({
      outputFilePath: '/test/output/schema.json',
      errors: [],
    })
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdirSync).mockImplementation(() => {})
    vi.mocked(fs.cpSync).mockImplementation(() => {})
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    await buildCommand(mockInputPath, mockOutDir, mockFormat)

    expect(consoleSpy).toHaveBeenCalled()
    const consoleCall = consoleSpy.mock.calls[0][0]
    expect(consoleCall).toContain(path.resolve(mockOutDir))

    consoleSpy.mockRestore()
  })
})
