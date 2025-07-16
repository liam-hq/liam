import type { Schema } from '@liam-hq/db-structure'

export type OpenAIExecutorInput = {
  input: string
}

export type OpenAIExecutorOutput = {} & Schema

export type OpenAIExecutorConfig = {
  apiKey: string
  model?: string
  timeout?: number
}
