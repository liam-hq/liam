import { Langfuse } from 'langfuse'

export const langfuseHandler = new Langfuse({
  publicKey: process.env['LANGFUSE_PUBLIC_KEY'] ?? '',
  secretKey: process.env['LANGFUSE_SECRET_KEY'] ?? '',
  baseUrl: process.env['LANGFUSE_BASE_URL'] ?? 'https://cloud.langfuse.com',
  environment: process.env['NEXT_PUBLIC_ENV_NAME'] ?? '',
})

export const createLangfuseTrace = (
  name: string,
  metadata?: Record<string, unknown>,
) => {
  return langfuseHandler.trace({
    name,
    metadata,
  })
}

export const createLangfuseGeneration = (
  trace: ReturnType<typeof createLangfuseTrace>,
  name: string,
  input: unknown,
  options: { model: string; tags?: string[] },
) => {
  return trace.generation({
    name,
    model: options.model,
    input,
    metadata: {
      tags: options.tags,
    },
  })
}
