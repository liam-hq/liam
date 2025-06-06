import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import LangfuseHandler from 'langfuse-langchain'

export const createLangfuseHandler = (): BaseCallbackHandler => {
  return new LangfuseHandler({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
  })
}
