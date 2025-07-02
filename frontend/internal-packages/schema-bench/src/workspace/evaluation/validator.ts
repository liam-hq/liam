import * as fs from 'node:fs'
import * as path from 'node:path'
import { err, ok } from 'neverthrow'
import type { EvaluationConfig, WorkspaceResult } from '../types'

export const validateDirectories = (
  config: EvaluationConfig,
): WorkspaceResult<void> => {
  const outputDir = path.join(config.workspacePath, 'execution', 'output')
  const referenceDir = path.join(config.workspacePath, 'execution', 'reference')

  if (!fs.existsSync(outputDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: outputDir })
  }

  if (!fs.existsSync(referenceDir)) {
    return err({ type: 'DIRECTORY_NOT_FOUND', path: referenceDir })
  }

  return ok(undefined)
}
