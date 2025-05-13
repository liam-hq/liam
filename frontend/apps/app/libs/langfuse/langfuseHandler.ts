import { CallbackHandler } from 'langfuse-langchain'

export const langfuseHandler = new CallbackHandler({
  secretKey: process.env.LANGFUSE_SECRET_KEY ?? '',
  publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? '',
  baseUrl: process.env.LANGFUSE_BASE_URL ?? 'https://cloud.langfuse.com',
  // Setting flushAt to 1 sends events immediately without batching
  flushAt: 1,
  // Set environment name for Langfuse to track different environments
  environment: process.env.NEXT_PUBLIC_ENV_NAME ?? 'development',
})
