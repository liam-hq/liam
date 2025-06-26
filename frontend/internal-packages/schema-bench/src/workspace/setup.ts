import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WorkspaceConfig, FileSystemAdapter } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class WorkspaceSetup {
  fs: FileSystemAdapter

  constructor(fs: FileSystemAdapter) {
    this.fs = fs
  }

  private createWorkspaceDirectories(workspacePath: string): void {
    const directories = [
      workspacePath,
      path.join(workspacePath, 'execution'),
      path.join(workspacePath, 'execution', 'input'),
      path.join(workspacePath, 'execution', 'reference'),
      path.join(workspacePath, 'execution', 'output'),
      path.join(workspacePath, 'evaluation'),
    ]

    for (const dir of directories) {
      if (!this.fs.existsSync(dir)) {
        this.fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  private copyDefaultData(defaultDataPath: string, workspacePath: string): void {
    const inputSourceDir = path.join(defaultDataPath, 'execution', 'input')
    const referenceSourceDir = path.join(
      defaultDataPath,
      'execution',
      'reference',
    )
    const inputTargetDir = path.join(workspacePath, 'execution', 'input')
    const referenceTargetDir = path.join(workspacePath, 'execution', 'reference')

    if (this.fs.existsSync(inputSourceDir)) {
      const inputFiles = this.fs.readdirSync(inputSourceDir)
      for (const file of inputFiles) {
        const sourcePath = path.join(inputSourceDir, file)
        const targetPath = path.join(inputTargetDir, file)
        if (!this.fs.existsSync(targetPath)) {
          this.fs.copyFileSync(sourcePath, targetPath)
        }
      }
    }

    if (this.fs.existsSync(referenceSourceDir)) {
      const referenceFiles = this.fs.readdirSync(referenceSourceDir)
      for (const file of referenceFiles) {
        const sourcePath = path.join(referenceSourceDir, file)
        const targetPath = path.join(referenceTargetDir, file)
        if (!this.fs.existsSync(targetPath)) {
          this.fs.copyFileSync(sourcePath, targetPath)
        }
      }
    }
  }

  private validateWorkspace(workspacePath: string): void {
    const requiredDirectories = [
      path.join(workspacePath, 'execution', 'input'),
      path.join(workspacePath, 'execution', 'reference'),
      path.join(workspacePath, 'execution', 'output'),
      path.join(workspacePath, 'evaluation'),
    ]

    for (const dir of requiredDirectories) {
      if (!this.fs.existsSync(dir)) {
        throw new Error(`Required directory does not exist: ${dir}`)
      }
    }
  }

  async setupWorkspace(config: WorkspaceConfig): Promise<void> {
    if (this.fs.existsSync(config.workspacePath) && !config.overwrite) {
      return
    }

    if (this.fs.existsSync(config.workspacePath) && config.overwrite) {
      this.fs.rmSync(config.workspacePath, { recursive: true, force: true })
    }

    this.createWorkspaceDirectories(config.workspacePath)
    this.copyDefaultData(config.defaultDataPath, config.workspacePath)
    this.validateWorkspace(config.workspacePath)
  }
}

// Node.js fs adapter for production use
const createNodeFsAdapter = (): FileSystemAdapter => ({
  existsSync: fs.existsSync,
  mkdirSync: fs.mkdirSync,
  rmSync: fs.rmSync,
  readdirSync: fs.readdirSync,
  copyFileSync: fs.copyFileSync,
  readFileSync: fs.readFileSync,
  writeFileSync: fs.writeFileSync,
})

export const setupWorkspace = async (config: WorkspaceConfig): Promise<void> => {
  const workspaceSetup = new WorkspaceSetup(createNodeFsAdapter())
  return workspaceSetup.setupWorkspace(config)
}

const main = async (): Promise<void> => {
  const initCwd = process.env.INIT_CWD || process.cwd()
  const workspacePath = path.resolve(initCwd, 'benchmark-workspace')
  const defaultDataPath = path.resolve(
    __dirname,
    '../../benchmark-workspace-default',
  )
  const overwrite = process.argv.includes('--overwrite')

  const config: WorkspaceConfig = {
    workspacePath,
    defaultDataPath,
    overwrite,
  }

  try {
    await setupWorkspace(config)
  } catch (error) {
    console.error('❌ Workspace setup failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
