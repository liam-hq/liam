import { red, yellow } from 'yoctocolors'
import { CriticalError, WarningError } from './errors.js'

function actionErrorHandler(error: Error) {
  if (error instanceof CriticalError) {
    console.error(red(`ERROR: ${error.message}`))
    return
  }

  if (error instanceof WarningError) {
    console.warn(yellow(`WARN: ${error.message}`))
    return
  }
}

export function actionRunner<T>(fn: (args: T) => Promise<Error[]>) {
  return async (args: T) => {
    const errors = await fn(args)
    if (errors.length > 0) {
      errors.forEach(actionErrorHandler)
    }

    if (errors.some((error) => error instanceof CriticalError)) {
      process.exit(1)
    }
  }
}
