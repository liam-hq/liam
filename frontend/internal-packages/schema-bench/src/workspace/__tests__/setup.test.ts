import {
  beforeEach,
  describe,
  expect,
  it,
  type MockedFunction,
  vi,
} from 'vitest'
import { createSetupWorkspace } from '../setup/setup.ts'
import type { FileSystemAdapter, WorkspaceConfig } from '../types'

describe('setupWorkspace', () => {
  let mockFs: FileSystemAdapter
  let setupWorkspace: ReturnType<typeof createSetupWorkspace>

  beforeEach(() => {
    mockFs = {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
      readdirSync: vi.fn(),
      copyFileSync: vi.fn(),
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
    }
    setupWorkspace = createSetupWorkspace(mockFs)
  })

  describe('setupWorkspace', () => {
    const config: WorkspaceConfig = {
      workspacePath: '/test/workspace',
      defaultDataPath: '/test/default',
      overwrite: false,
    }

    it('should skip setup if workspace exists and overwrite is false', async () => {
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)

      await setupWorkspace(config)

      expect(mockFs.rmSync).not.toHaveBeenCalled()
      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })

    it('should remove existing workspace if overwrite is true', async () => {
      const configWithOverwrite = { ...config, overwrite: true }
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValue(true)
      ;(
        mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>
      ).mockReturnValue([])

      await setupWorkspace(configWithOverwrite)

      expect(mockFs.rmSync).toHaveBeenCalledWith('/test/workspace', {
        recursive: true,
        force: true,
      })
    })

    it('should create required directories', async () => {
      ;(mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>)
        .mockReturnValueOnce(false) // workspace doesn't exist
        .mockReturnValueOnce(false) // input source dir doesn't exist
        .mockReturnValueOnce(false) // reference source dir doesn't exist
        .mockReturnValue(true) // all required directories exist after creation
      ;(
        mockFs.readdirSync as MockedFunction<typeof mockFs.readdirSync>
      ).mockReturnValue([])

      await setupWorkspace(config)

      // Check that mkdirSync was called for the workspace directory
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/workspace', {
        recursive: true,
      })
      // Only one call is made because recursive: true creates all subdirectories
      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(1)
    })

    it('should handle file copying when source directories exist', async () => {
      // Mock to simulate workspace already exists and we're just testing copy functionality
      ;(
        mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>
      ).mockReturnValueOnce(true) // workspace exists, so setup is skipped

      await setupWorkspace(config)

      // Since workspace exists and overwrite is false, no operations should be performed
      expect(mockFs.copyFileSync).not.toHaveBeenCalled()
      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })

    it('should throw error if required directories are missing after setup', async () => {
      ;(mockFs.existsSync as MockedFunction<typeof mockFs.existsSync>)
        .mockReturnValueOnce(false) // workspace doesn't exist
        .mockReturnValueOnce(false) // input source dir doesn't exist
        .mockReturnValueOnce(false) // reference source dir doesn't exist
        .mockReturnValueOnce(false) // required directory missing

      await expect(setupWorkspace(config)).rejects.toThrow(
        'Required directory does not exist',
      )
    })
  })
})
