import * as fs from 'node:fs'
import * as path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupWorkspace } from './setup.ts'
import type { WorkspaceConfig } from '../types'

// Mock fs module
vi.mock('node:fs')

// Mock path module
vi.mock('node:path', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:path')>()),
  join: vi.fn(),
  dirname: vi.fn(),
}))

// Mock fileURLToPath
vi.mock('node:url', () => ({
  fileURLToPath: vi.fn().mockReturnValue('/mocked/file/path'),
}))

const mockFs = vi.mocked(fs)
const mockPath = vi.mocked(path)

describe('setupWorkspace', () => {
  const mockWorkspacePath = '/test/workspace'
  const mockDefaultDataPath = '/test/default-data'
  const mockConfig: WorkspaceConfig = {
    workspacePath: mockWorkspacePath,
    defaultDataPath: mockDefaultDataPath,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockPath.join.mockImplementation((...args) => args.join('/'))
    mockPath.dirname.mockReturnValue('/mocked/dir')
    
    mockFs.existsSync.mockReturnValue(false)
    mockFs.mkdirSync.mockReturnValue(undefined)
    mockFs.rmSync.mockReturnValue(undefined)
    mockFs.readdirSync.mockReturnValue([] as any)
    mockFs.copyFileSync.mockReturnValue(undefined)
  })

  describe('workspace cleanup', () => {
    it('should remove existing workspace directory', async () => {
      mockFs.existsSync.mockReturnValue(true)
      
      await setupWorkspace(mockConfig)
      
      expect(mockFs.rmSync).toHaveBeenCalledWith(mockWorkspacePath, {
        recursive: true,
        force: true,
      })
    })

    it('should not attempt to remove non-existent workspace directory', async () => {
      mockFs.existsSync.mockReturnValue(false)
      
      await setupWorkspace(mockConfig)
      
      expect(mockFs.rmSync).not.toHaveBeenCalled()
    })
  })

  describe('directory creation', () => {
    it('should create all required workspace directories', async () => {
      await setupWorkspace(mockConfig)
      
      const expectedDirectories = [
        mockWorkspacePath,
        `${mockWorkspacePath}/execution`,
        `${mockWorkspacePath}/execution/input`,
        `${mockWorkspacePath}/execution/reference`,
        `${mockWorkspacePath}/execution/output`,
        `${mockWorkspacePath}/evaluation`,
      ]
      
      expectedDirectories.forEach((dir) => {
        expect(mockFs.mkdirSync).toHaveBeenCalledWith(dir, { recursive: true })
      })
    })

    it('should not create directories that already exist', async () => {
      mockFs.existsSync.mockReturnValue(true)
      
      await setupWorkspace(mockConfig)
      
      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })

    it('should create only missing directories', async () => {
      // Mock some directories as existing
      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath.toString().includes('execution')
      })
      
      await setupWorkspace(mockConfig)
      
      // Should create workspace and evaluation directories
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockWorkspacePath, { recursive: true })
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        `${mockWorkspacePath}/evaluation`,
        { recursive: true }
      )
      
      // Should not create execution directories
      expect(mockFs.mkdirSync).not.toHaveBeenCalledWith(
        `${mockWorkspacePath}/execution`,
        expect.any(Object)
      )
    })
  })

  describe('default data copying', () => {
    const mockInputFiles = ['case1.sql', 'case2.sql']
    const mockReferenceFiles = ['case1.json', 'case2.json']

    beforeEach(() => {
      mockFs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.toString().includes('input')) {
          return mockInputFiles as any
        }
        if (dirPath.toString().includes('reference')) {
          return mockReferenceFiles as any
        }
        return [] as any
      })
    })

    it('should copy input files from default data', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath.toString().includes('default-data')
      })
      
      await setupWorkspace(mockConfig)
      
      mockInputFiles.forEach((file) => {
        expect(mockFs.copyFileSync).toHaveBeenCalledWith(
          `${mockDefaultDataPath}/execution/input/${file}`,
          `${mockWorkspacePath}/execution/input/${file}`
        )
      })
    })

    it('should copy reference files from default data', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath.toString().includes('default-data')
      })
      
      await setupWorkspace(mockConfig)
      
      mockReferenceFiles.forEach((file) => {
        expect(mockFs.copyFileSync).toHaveBeenCalledWith(
          `${mockDefaultDataPath}/execution/reference/${file}`,
          `${mockWorkspacePath}/execution/reference/${file}`
        )
      })
    })

    it('should not copy files if default data directories do not exist', async () => {
      mockFs.existsSync.mockReturnValue(false)
      
      await setupWorkspace(mockConfig)
      
      expect(mockFs.copyFileSync).not.toHaveBeenCalled()
    })

    it('should not overwrite existing files', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        // Default data directories exist
        if (dirPath.toString().includes('default-data')) {
          return true
        }
        // Target files already exist
        if (dirPath.toString().includes('workspace')) {
          return true
        }
        return false
      })
      
      await setupWorkspace(mockConfig)
      
      expect(mockFs.copyFileSync).not.toHaveBeenCalled()
    })

    it('should copy only files that do not exist in target', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        // Default data directories exist
        if (dirPath.toString().includes('default-data')) {
          return true
        }
        // Only case1 files exist in target
        if (dirPath.toString().includes('case1')) {
          return true
        }
        return false
      })
      
      await setupWorkspace(mockConfig)
      
      // Should copy case2 files but not case1 files
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        `${mockDefaultDataPath}/execution/input/case2.sql`,
        `${mockWorkspacePath}/execution/input/case2.sql`
      )
      expect(mockFs.copyFileSync).toHaveBeenCalledWith(
        `${mockDefaultDataPath}/execution/reference/case2.json`,
        `${mockWorkspacePath}/execution/reference/case2.json`
      )
      
      expect(mockFs.copyFileSync).not.toHaveBeenCalledWith(
        expect.stringContaining('case1'),
        expect.any(String)
      )
    })
  })

  describe('workspace validation', () => {
    it('should validate all required directories exist', async () => {
      await setupWorkspace(mockConfig)
      
      const requiredDirectories = [
        `${mockWorkspacePath}/execution/input`,
        `${mockWorkspacePath}/execution/reference`,
        `${mockWorkspacePath}/execution/output`,
        `${mockWorkspacePath}/evaluation`,
      ]
      
      // existsSync should be called for validation
      requiredDirectories.forEach((dir) => {
        expect(mockFs.existsSync).toHaveBeenCalledWith(dir)
      })
    })

    it('should throw error if required directory is missing after setup', async () => {
      mockFs.existsSync.mockImplementation((dirPath) => {
        // Simulate missing output directory
        return !dirPath.toString().includes('output')
      })
      
      await expect(setupWorkspace(mockConfig)).rejects.toThrow(
        'Required directory does not exist:'
      )
    })

    it('should throw error with specific directory path', async () => {
      const missingDir = `${mockWorkspacePath}/execution/input`
      mockFs.existsSync.mockImplementation((dirPath) => {
        return dirPath.toString() !== missingDir
      })
      
      await expect(setupWorkspace(mockConfig)).rejects.toThrow(missingDir)
    })
  })

  describe('complete workflow', () => {
    it('should complete full setup workflow successfully', async () => {
      const inputFiles = ['case1.sql']
      const referenceFiles = ['case1.json']
      
      mockFs.existsSync.mockImplementation((dirPath) => {
        // Workspace exists initially
        if (dirPath.toString() === mockWorkspacePath) {
          return true
        }
        // Default data directories exist
        if (dirPath.toString().includes('default-data')) {
          return true
        }
        // Created directories exist after creation
        return dirPath.toString().includes('workspace')
      })
      
      mockFs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.toString().includes('input')) {
          return inputFiles as any
        }
        if (dirPath.toString().includes('reference')) {
          return referenceFiles as any
        }
        return [] as any
      })
      
      await expect(setupWorkspace(mockConfig)).resolves.not.toThrow()
      
      // Verify the sequence of operations
      expect(mockFs.rmSync).toHaveBeenCalledBefore(mockFs.mkdirSync as any)
      expect(mockFs.mkdirSync).toHaveBeenCalledBefore(mockFs.copyFileSync as any)
    })
  })
})
