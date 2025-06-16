import LangfuseCallbackHandler from 'langfuse-langchain'

export const createLangfuseHandler = () => {
  return new LangfuseCallbackHandler({
    publicKey: process.env['LANGFUSE_PUBLIC_KEY'] || '',
    secretKey: process.env['LANGFUSE_SECRET_KEY'] || '',
    baseUrl: process.env['LANGFUSE_BASE_URL'] || 'https://cloud.langfuse.com',
    environment: process.env['NEXT_PUBLIC_ENV_NAME'] || 'development',
    // flushAt: 1 ensures events are sent immediately, preventing loss when job processes terminate
    flushAt: 1,
  })
}
