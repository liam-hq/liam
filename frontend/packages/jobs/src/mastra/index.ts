// @ts-nocheck : because of the way Mastra is initialized
// Import additional modules from Mastra to ensure proper initialization
import '@mastra/core'
import { createLogger } from '@mastra/core/logger'
import { Mastra } from '@mastra/core/mastra'

import { LangfuseExporter } from 'langfuse-vercel'
import { docsSuggestionAgent } from './agents/generateDocsSuggestion'
import { reviewAgent } from './agents/generateReview'
import { schemaOverrideAgent } from './agents/generateSchemaOverride'

export const mastra: Mastra = new Mastra({
  agents: {
    reviewAgent,
    schemaOverrideAgent,
    docsSuggestionAgent,
  },
  logger: createLogger({
    name: 'Mastra',
    level: 'debug',
  }),
  telemetry: {
    serviceName: 'ai', // this must be set to "ai" so that the LangfuseExporter thinks it's an AI SDK trace
    enabled: true,
    sampling: {
      type: 'always_on',
    },
    export: {
      type: 'custom',
      exporter: new LangfuseExporter({
        publicKey: process.env['LANGFUSE_PUBLIC_KEY'] || '',
        secretKey: process.env['LANGFUSE_SECRET_KEY'] || '',
        baseUrl:
          process.env['LANGFUSE_BASE_URL'] || 'https://cloud.langfuse.com',
      }),
    },
  },
})
