import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setupWorkspace } from '../setup/setup.ts'
import type { WorkspaceConfig } from '../types'

describe('setupWorkspace', () => {
  let tempDir: string
  let defaultDataDir: string

  beforeEach(() => {
    // Create temporary directories for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-workspace-'))
    defaultDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-default-'))

    // Create default data structure
    const inputDir = path.join(defaultDataDir, 'execution', 'input')
    const referenceDir = path.join(defaultDataDir, 'execution', 'reference')
    fs.mkdirSync(inputDir, { recursive: true })
    fs.mkdirSync(referenceDir, { recursive: true })

    // Create sample files
    fs.writeFileSync(path.join(inputDir, 'test.json'), '{"test": "data"}')
    fs.writeFileSync(
      path.join(referenceDir, 'test.json'),
      '{"reference": "data"}',
    )
  })

  afterEach(() => {
    // Clean up temporary directories
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    if (fs.existsSync(defaultDataDir)) {
      fs.rmSync(defaultDataDir, { recursive: true, force: true })
    }
  })

  describe('setupWorkspace', () => {
    it('should remove existing workspace', async () => {
      const workspacePath = path.join(tempDir, 'workspace')
      fs.mkdirSync(workspacePath)
      fs.writeFileSync(
        path.join(workspacePath, 'existing.txt'),
        'existing content',
      )

      const config: WorkspaceConfig = {
        workspacePath,
        defaultDataPath: defaultDataDir,
      }

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      // Should have removed existing file and created new structure
      expect(fs.existsSync(path.join(workspacePath, 'existing.txt'))).toBe(
        false,
      )
      expect(fs.existsSync(path.join(workspacePath, 'execution'))).toBe(true)
    })

    it('should create required directories', async () => {
      const workspacePath = path.join(tempDir, 'workspace')

      const config: WorkspaceConfig = {
        workspacePath,
        defaultDataPath: defaultDataDir,
      }

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      // Check that all required directories are created
      expect(fs.existsSync(workspacePath)).toBe(true)
      expect(fs.existsSync(path.join(workspacePath, 'execution'))).toBe(true)
      expect(
        fs.existsSync(path.join(workspacePath, 'execution', 'input')),
      ).toBe(true)
      expect(
        fs.existsSync(path.join(workspacePath, 'execution', 'reference')),
      ).toBe(true)
      expect(
        fs.existsSync(path.join(workspacePath, 'execution', 'output')),
      ).toBe(true)
      expect(fs.existsSync(path.join(workspacePath, 'evaluation'))).toBe(true)
    })

    it('should copy default data files', async () => {
      const workspacePath = path.join(tempDir, 'workspace')

      const config: WorkspaceConfig = {
        workspacePath,
        defaultDataPath: defaultDataDir,
      }

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      // Check that files were copied
      const inputFile = path.join(
        workspacePath,
        'execution',
        'input',
        'test.json',
      )
      const referenceFile = path.join(
        workspacePath,
        'execution',
        'reference',
        'test.json',
      )

      expect(fs.existsSync(inputFile)).toBe(true)
      expect(fs.existsSync(referenceFile)).toBe(true)

      // Check file contents
      const inputContent = fs.readFileSync(inputFile, 'utf-8')
      const referenceContent = fs.readFileSync(referenceFile, 'utf-8')

      expect(inputContent).toBe('{"test": "data"}')
      expect(referenceContent).toBe('{"reference": "data"}')
    })

    it('should handle missing default data directories gracefully', async () => {
      const workspacePath = path.join(tempDir, 'workspace')
      const emptyDefaultDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'test-empty-'),
      )

      const config: WorkspaceConfig = {
        workspacePath,
        defaultDataPath: emptyDefaultDir,
      }

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      // Should still create workspace structure even without default data
      expect(fs.existsSync(workspacePath)).toBe(true)
      expect(
        fs.existsSync(path.join(workspacePath, 'execution', 'input')),
      ).toBe(true)
      expect(
        fs.existsSync(path.join(workspacePath, 'execution', 'reference')),
      ).toBe(true)

      // Clean up
      fs.rmSync(emptyDefaultDir, { recursive: true, force: true })
    })
  })
})
