import type { Schema } from '@liam-hq/schema'

export type OpenAIExecutorInput = {
  input: string
}

export type OpenAIExecutorOutput = {} & Schema

export type OpenAIExecutorConfig = {
  apiKey: string
  model?: string
  timeout?: number
}
