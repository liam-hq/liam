import * as fs from 'node:fs'
import { err, ok } from 'neverthrow'
import type { SetupResult } from '../../types'

export const cleanExistingWorkspace = (workspacePath: string): SetupResult => {
  try {
    if (fs.existsSync(workspacePath)) {
      fs.rmSync(workspacePath, { recursive: true, force: true })
    }
    return ok(undefined)
  } catch (error) {
    return err({
      type: 'FILE_WRITE_ERROR',
      path: workspacePath,
      cause:
        error instanceof Error
          ? error.message
          : 'Failed to remove existing workspace',
    })
  }
}
