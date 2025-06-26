import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import type { FileSystemAdapter, WorkspaceConfig } from '../types'
import { WorkspaceSetup } from '../setup'

describe('WorkspaceSetup', () => {
  let mockFs: FileSystemAdapter
  let workspaceSetup: WorkspaceSetup

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
    workspaceSetup = new WorkspaceSetup(mockFs)
  })

  describe('setupWorkspace', () => {
    const config: WorkspaceConfig = {
      workspacePath: '/test/workspace',
      defaultDataPath: '/test/default',
      overwrite: false,
    }

    it('should skip setup if workspace exists and overwrite is false', async () => {
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)

      await workspaceSetup.setupWorkspace(config)

      expect(mockFs.rmSync).not.toHaveBeenCalled()
      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })

    it('should remove existing workspace if overwrite is true', async () => {
      const configWithOverwrite = { ...config, overwrite: true }
      ;(mockFs.existsSync as MockedFunction<any>).mockReturnValue(true)
      ;(mockFs.readdirSync as MockedFunction<any>).mockReturnValue([])

      await workspaceSetup.setupWorkspace(configWithOverwrite)

      expect(mockFs.rmSync).toHaveBeenCalledWith('/test/workspace', {
        recursive: true,
        force: true,
      })
    })

    it('should create required directories', async () => {
      ;(mockFs.existsSync as MockedFunction<any>)
        .mockReturnValueOnce(false) // workspace doesn't exist
        .mockReturnValueOnce(false) // input source dir doesn't exist
        .mockReturnValueOnce(false) // reference source dir doesn't exist
        .mockReturnValue(true) // all required directories exist after creation
      ;(mockFs.readdirSync as MockedFunction<any>).mockReturnValue([])

      await workspaceSetup.setupWorkspace(config)

      // Check that mkdirSync was called for the workspace directory
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/workspace', { recursive: true })
      // Only one call is made because recursive: true creates all subdirectories
      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(1)
    })

    it('should copy default data files', async () => {
      // Setup the mock to simulate the actual flow:
      // 1. workspace doesn't exist
      // 2. createWorkspaceDirectories calls existsSync for each directory (6 times)
      // 3. copyDefaultData calls existsSync for source directories (2 times)
      // 4. copyDefaultData calls existsSync for each target file (4 times)
      // 5. validateWorkspace calls existsSync for required directories (4 times)
      ;(mockFs.existsSync as MockedFunction<any>)
        .mockReturnValueOnce(false) // workspace doesn't exist
        .mockReturnValueOnce(false) // workspace dir doesn't exist (for mkdir)
        .mockReturnValueOnce(false) // execution dir doesn't exist (for mkdir)
        .mockReturnValueOnce(false) // input dir doesn't exist (for mkdir)
        .mockReturnValueOnce(false) // reference dir doesn't exist (for mkdir)
        .mockReturnValueOnce(false) // output dir doesn't exist (for mkdir)
        .mockReturnValueOnce(false) // evaluation dir doesn't exist (for mkdir)
        .mockReturnValueOnce(true) // input source dir exists
        .mockReturnValueOnce(true) // reference source dir exists
        .mockReturnValueOnce(false) // target file 1 doesn't exist
        .mockReturnValueOnce(false) // target file 2 doesn't exist
        .mockReturnValueOnce(false) // target file 3 doesn't exist
        .mockReturnValueOnce(false) // target file 4 doesn't exist
        .mockReturnValueOnce(true) // validation: input dir exists
        .mockReturnValueOnce(true) // validation: reference dir exists
        .mockReturnValueOnce(true) // validation: output dir exists
        .mockReturnValue(true) // validation: evaluation dir exists

      ;(mockFs.readdirSync as MockedFunction<any>)
        .mockReturnValueOnce(['input1.json', 'input2.json']) // input files
        .mockReturnValueOnce(['ref1.json', 'ref2.json']) // reference files

      await workspaceSetup.setupWorkspace(config)

      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        '/test/default/execution/input/input1.json',
        '/test/workspace/execution/input/input1.json'
      )
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        '/test/default/execution/reference/ref1.json',
        '/test/workspace/execution/reference/ref1.json'
      )
    })

    it('should throw error if required directories are missing after setup', async () => {
      ;(mockFs.existsSync as MockedFunction<any>)
        .mockReturnValueOnce(false) // workspace doesn't exist
        .mockReturnValueOnce(false) // input source dir doesn't exist
        .mockReturnValueOnce(false) // reference source dir doesn't exist
        .mockReturnValueOnce(false) // required directory missing

      await expect(workspaceSetup.setupWorkspace(config)).rejects.toThrow(
        'Required directory does not exist'
      )
    })
  })
})
