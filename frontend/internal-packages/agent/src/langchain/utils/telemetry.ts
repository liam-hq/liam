import type { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import LangfuseHandler from 'langfuse-langchain'

export const createLangfuseHandler = (): BaseCallbackHandler => {
  const publicKey = process.env['LANGFUSE_PUBLIC_KEY']
  const secretKey = process.env['LANGFUSE_SECRET_KEY']
  const baseUrl = process.env['LANGFUSE_BASE_URL']

  return new LangfuseHandler({
    ...(publicKey && { publicKey }),
    ...(secretKey && { secretKey }),
    ...(baseUrl && { baseUrl }),
  })
}
