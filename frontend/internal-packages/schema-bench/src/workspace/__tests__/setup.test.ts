import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setupWorkspace } from '../setup/setup.ts'
import { SetupTestWorkspace } from './setupTestHelpers'

describe('setupWorkspace', () => {
  let workspace: SetupTestWorkspace

  beforeEach(() => {
    workspace = new SetupTestWorkspace()
    workspace.createDefaultDataStructure()
  })

  afterEach(() => {
    workspace.cleanup()
  })

  describe('setupWorkspace', () => {
    it('should remove existing workspace', async () => {
      const workspacePath = workspace.createExistingWorkspace()
      const config = workspace.getConfig(workspacePath)

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      // Should have removed existing file and created new structure
      expect(fs.existsSync(path.join(workspacePath, 'existing.txt'))).toBe(
        false,
      )
      workspace.expectWorkspaceStructure(workspacePath)
    })

    it('should create required directories', async () => {
      const config = workspace.getConfig()

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      workspace.expectWorkspaceStructure(config.workspacePath)
    })

    it('should copy default data files', async () => {
      const config = workspace.getConfig()

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      workspace.expectFilesCopied(config.workspacePath)
    })

    it('should handle missing default data directories gracefully', async () => {
      const config = workspace.getEmptyDefaultDataConfig()

      const result = await setupWorkspace(config)
      expect(result.isOk()).toBe(true)

      // Should still create workspace structure even without default data
      workspace.expectWorkspaceStructure(config.workspacePath)

      // Clean up the empty directory
      fs.rmSync(config.defaultDataPath, { recursive: true, force: true })
    })
  })
})
