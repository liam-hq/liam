export class CliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliError'
  }
}

export class CriticalError extends CliError {
  constructor(message: string) {
    super(message)
    this.name = 'CriticalError'
  }
}

export class FileSystemError extends CriticalError {
  constructor(message: string) {
    super(message)
    this.name = 'FileSystemError'
  }
}

export class ArgumentError extends CriticalError {
  constructor(message: string) {
    super(message)
    this.name = 'ArgumentError'
  }
}

export class WarningError extends CliError {
  constructor(message: string) {
    super(message)
    this.name = 'WarningError'
  }
}

export class WarningProcessingError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'WarningProcessingError'
  }
}
