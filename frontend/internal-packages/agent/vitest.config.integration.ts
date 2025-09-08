import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    testTimeout: 300000,
    reporters: ['dot'],
    env: {
      // Disable background callbacks for LangChain to ensure proper tracing in tests
      // When running LangGraph in tests, we need to send traces to LangSmith synchronously
      // If callbacks complete in the background, test execution may end before traces are sent
      // Setting this to 'false' ensures callbacks complete before test finishes
      // Reference: https://js.langchain.com/docs/how_to/callbacks_serverless
      LANGCHAIN_CALLBACKS_BACKGROUND: 'false',
    },
  },
})
