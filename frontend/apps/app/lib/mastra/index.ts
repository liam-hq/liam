import { Mastra } from '@mastra/core'
import { LangfuseExporter } from 'langfuse-vercel'
import { databaseSchemaAskAgent, databaseSchemaBuildAgent } from './agents'
/**
 * Mastra instance with Langfuse tracing integration
 *
 * The telemetry configuration is set up to work with the Langfuse exporter
 * configured in instrumentation.ts. The serviceName must be 'ai' to match
 * the ATTR_SERVICE_NAME in the NodeSDK configuration.
 */
export const mastra = new Mastra({
  agents: {
    databaseSchemaAskAgent,
    databaseSchemaBuildAgent,
  },
  telemetry: {
    serviceName: 'ai', // Must match ATTR_SERVICE_NAME in instrumentation.ts
    enabled: true,
    export: {
      type: 'custom',
      exporter: new LangfuseExporter({
        publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
        secretKey: process.env.LANGFUSE_SECRET_KEY || '',
        baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        environment: process.env.NEXT_PUBLIC_ENV_NAME || 'development',
        debug: true,
      }),
    },
  },
})
