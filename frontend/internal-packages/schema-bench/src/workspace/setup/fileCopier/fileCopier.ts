import * as fs from 'node:fs'
import * as path from 'node:path'
import { err, ok } from 'neverthrow'
import type { SetupResult } from '../../types'

const copyFiles = (sourceDir: string, targetDir: string): SetupResult => {
  if (!fs.existsSync(sourceDir)) {
    return ok(undefined)
  }

  try {
    const files = fs.readdirSync(sourceDir)
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file)
      const targetPath = path.join(targetDir, file)
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath)
      }
    }
    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_READ_ERROR',
      path: sourceDir,
      cause: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const copyInputData = (
  defaultDataPath: string,
  workspacePath: string,
): SetupResult => {
  const inputSourceDir = path.join(defaultDataPath, 'execution', 'input')
  const inputTargetDir = path.join(workspacePath, 'execution', 'input')

  return copyFiles(inputSourceDir, inputTargetDir)
}

export const copyReferenceData = (
  defaultDataPath: string,
  workspacePath: string,
): SetupResult => {
  const referenceSourceDir = path.join(
    defaultDataPath,
    'execution',
    'reference',
  )
  const referenceTargetDir = path.join(workspacePath, 'execution', 'reference')

  return copyFiles(referenceSourceDir, referenceTargetDir)
}
