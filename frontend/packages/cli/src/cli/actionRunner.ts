import { red, yellow } from 'yoctocolors'
import { CriticalError, WarningError } from './errors.js'
import { TroubleshootingUrl } from './urls.js'

type ErrorType = Error
function actionErrorHandler(error: ErrorType) {
  if (error instanceof CriticalError) {
    console.error(red(`ERROR: ${error.message}`))
    return
  }

  if (error instanceof WarningError) {
    console.warn(yellow(`WARN: ${error.message}`))
    return
  }
}

function printTroubleshootingUrl() {
  console.info(`For more information, see ${TroubleshootingUrl}`)
}

export function actionRunner<T>(fn: (args: T) => Promise<Error[]>) {
  return async (args: T) => {
    const errors = await fn(args)
    if (errors.length > 0) {
      errors.forEach(actionErrorHandler)
      printTroubleshootingUrl()

      // Currently, to align with the behavior of `buildCommand`, the process exits with status 1 if there is at least one error.
      // In the future, we want to allow dist to be generated and the process to complete successfully with a warning message, even if there are minor errors.
      // In that case, the process should exit with status 1 only if there is at least one `CriticalError`.
      process.exit(1)
    }
  }
}
