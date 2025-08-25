export class ProcessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export class WarningError extends ProcessError {
  constructor(message: string) {
    super(message)
    this.name = 'WarningError'
  }
}

export class UnexpectedTokenWarningError extends WarningError {
  constructor(message: string) {
    super(message)
    this.name = 'UnexpectedTokenWarningError'
  }
}
