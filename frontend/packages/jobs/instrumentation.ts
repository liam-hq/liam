import { registerOTel } from '@vercel/otel'
import { LangfuseExporter } from 'langfuse-vercel'

export async function register() {
  registerOTel({
    serviceName: 'liam-app',
    traceExporter: new LangfuseExporter({
      publicKey: process.env['LANGFUSE_PUBLIC_KEY'] || '',
      secretKey: process.env['LANGFUSE_SECRET_KEY'] || '',
      baseUrl: process.env['LANGFUSE_BASE_URL'] || 'https://cloud.langfuse.com',
      environment: process.env['NEXT_PUBLIC_ENV_NAME'] || 'development',
    }),
  })
}

if (process.env['NODE_ENV'] !== 'production') {
  register()
}
