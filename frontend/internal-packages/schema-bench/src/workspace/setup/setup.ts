import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { WorkspaceConfig } from '../types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWorkspaceDirectories = (workspacePath: string): void => {
  const directories = [
    workspacePath,
    path.join(workspacePath, 'execution'),
    path.join(workspacePath, 'execution', 'input'),
    path.join(workspacePath, 'execution', 'reference'),
    path.join(workspacePath, 'execution', 'output'),
    path.join(workspacePath, 'evaluation'),
  ]

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

const copyDefaultData = (
  defaultDataPath: string,
  workspacePath: string,
): void => {
  const inputSourceDir = path.join(defaultDataPath, 'execution', 'input')
  const referenceSourceDir = path.join(
    defaultDataPath,
    'execution',
    'reference',
  )
  const inputTargetDir = path.join(workspacePath, 'execution', 'input')
  const referenceTargetDir = path.join(workspacePath, 'execution', 'reference')

  if (fs.existsSync(inputSourceDir)) {
    const inputFiles = fs.readdirSync(inputSourceDir)
    for (const file of inputFiles) {
      const sourcePath = path.join(inputSourceDir, file)
      const targetPath = path.join(inputTargetDir, file)
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath)
      }
    }
  }

  if (fs.existsSync(referenceSourceDir)) {
    const referenceFiles = fs.readdirSync(referenceSourceDir)
    for (const file of referenceFiles) {
      const sourcePath = path.join(referenceSourceDir, file)
      const targetPath = path.join(referenceTargetDir, file)
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath)
      }
    }
  }
}

const validateWorkspace = (workspacePath: string): void => {
  const requiredDirectories = [
    path.join(workspacePath, 'execution', 'input'),
    path.join(workspacePath, 'execution', 'reference'),
    path.join(workspacePath, 'execution', 'output'),
    path.join(workspacePath, 'evaluation'),
  ]

  for (const dir of requiredDirectories) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Required directory does not exist: ${dir}`)
    }
  }
}

export const setupWorkspace = async (
  config: WorkspaceConfig,
): Promise<void> => {
  if (fs.existsSync(config.workspacePath)) {
    fs.rmSync(config.workspacePath, { recursive: true, force: true })
  }

  createWorkspaceDirectories(config.workspacePath)
  copyDefaultData(config.defaultDataPath, config.workspacePath)
  validateWorkspace(config.workspacePath)
}
