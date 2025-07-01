import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { err, ok } from 'neverthrow'
import type { SetupResult, WorkspaceConfig, WorkspaceError } from '../types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWorkspaceDirectories = (workspacePath: string): SetupResult => {
  const directories = [
    workspacePath,
    path.join(workspacePath, 'execution'),
    path.join(workspacePath, 'execution', 'input'),
    path.join(workspacePath, 'execution', 'reference'),
    path.join(workspacePath, 'execution', 'output'),
    path.join(workspacePath, 'evaluation'),
  ]

  try {
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: workspacePath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const copyDefaultData = (
  defaultDataPath: string,
  workspacePath: string,
): SetupResult => {
  const inputSourceDir = path.join(defaultDataPath, 'execution', 'input')
  const referenceSourceDir = path.join(
    defaultDataPath,
    'execution',
    'reference',
  )
  const inputTargetDir = path.join(workspacePath, 'execution', 'input')
  const referenceTargetDir = path.join(workspacePath, 'execution', 'reference')

  try {
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

    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: defaultDataPath,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

const validateWorkspace = (workspacePath: string): SetupResult => {
  const requiredDirectories = [
    path.join(workspacePath, 'execution', 'input'),
    path.join(workspacePath, 'execution', 'reference'),
    path.join(workspacePath, 'execution', 'output'),
    path.join(workspacePath, 'evaluation'),
  ]

  for (const dir of requiredDirectories) {
    if (!fs.existsSync(dir)) {
      return err({ type: 'DIRECTORY_NOT_FOUND', path: dir })
    }
  }

  return ok(undefined)
}

export const setupWorkspace = async (
  config: WorkspaceConfig,
): Promise<SetupResult> => {
  try {
    if (fs.existsSync(config.workspacePath)) {
      fs.rmSync(config.workspacePath, { recursive: true, force: true })
    }
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: config.workspacePath,
      cause:
        error instanceof Error
          ? error.message
          : 'Failed to remove existing workspace',
    })
  }

  // Create directories
  const createResult = createWorkspaceDirectories(config.workspacePath)
  if (createResult.isErr()) {
    return createResult
  }

  // Copy default data
  const copyResult = copyDefaultData(
    config.defaultDataPath,
    config.workspacePath,
  )
  if (copyResult.isErr()) {
    return copyResult
  }

  // Validate workspace
  const validateResult = validateWorkspace(config.workspacePath)
  if (validateResult.isErr()) {
    return validateResult
  }

  return ok(undefined)
}
