import * as fs from 'node:fs'
import * as path from 'node:path'
import { err, ok } from 'neverthrow'
import type { SetupResult, WorkspaceConfig } from '../types'
import { copyInputData, copyReferenceData } from './fileCopier/fileCopier'
import { cleanExistingWorkspace } from './workspaceManager/workspaceManager'

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
  const inputResult = copyInputData(defaultDataPath, workspacePath)
  if (inputResult.isErr()) {
    return inputResult
  }

  const referenceResult = copyReferenceData(defaultDataPath, workspacePath)
  if (referenceResult.isErr()) {
    return referenceResult
  }

  return ok(undefined)
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
  const cleanResult = cleanExistingWorkspace(config.workspacePath)
  if (cleanResult.isErr()) {
    return cleanResult
  }

  const createResult = createWorkspaceDirectories(config.workspacePath)
  if (createResult.isErr()) {
    return createResult
  }

  const copyResult = copyDefaultData(
    config.defaultDataPath,
    config.workspacePath,
  )
  if (copyResult.isErr()) {
    return copyResult
  }

  const validateResult = validateWorkspace(config.workspacePath)
  if (validateResult.isErr()) {
    return validateResult
  }

  return ok(undefined)
}
