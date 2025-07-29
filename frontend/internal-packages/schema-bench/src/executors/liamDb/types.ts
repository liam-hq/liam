import type { Result } from 'neverthrow'

export type LiamDbExecutorInput = {
  input: string
}

export type LiamDbExecutorOutput = {
  // biome-ignore lint/suspicious/noExplicitAny: Need flexible table structure for Phase 1
  tables: Record<string, any>
}

export type LiamDbExecutor = {
  execute: (
    input: LiamDbExecutorInput,
  ) => Promise<Result<LiamDbExecutorOutput, Error>>
}
