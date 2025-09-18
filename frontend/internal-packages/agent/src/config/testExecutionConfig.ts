/**
 * Configuration for test execution behavior
 */
const TEST_EXECUTION_CONFIG = {
  /**
   * Maximum number of concurrent test executions
   * Lower values reduce memory usage but increase execution time
   * Default: 3 (balance between performance and resource usage)
   */
  MAX_CONCURRENCY: Number(process.env['TEST_MAX_CONCURRENCY']) || 3,

  /**
   * Timeout for individual test execution in milliseconds
   * Default: 30 seconds per test
   */
  TEST_TIMEOUT_MS: Number(process.env['TEST_TIMEOUT_MS']) || 30000,

  /**
   * Initial memory allocation per PGlite instance in MB
   * Reduced from default to prevent memory spikes with concurrent instances
   * Default: 64MB (reduced from 2GB)
   */
  PGLITE_INITIAL_MEMORY_MB:
    Number(process.env['PGLITE_INITIAL_MEMORY_MB']) || 64,
} as const

/**
 * Get test execution configuration with optional overrides
 */
export function getTestExecutionConfig(overrides?: {
  maxConcurrency?: number
  timeoutMs?: number
  initialMemoryMb?: number
}) {
  return {
    maxConcurrency:
      overrides?.maxConcurrency ?? TEST_EXECUTION_CONFIG.MAX_CONCURRENCY,
    timeoutMs: overrides?.timeoutMs ?? TEST_EXECUTION_CONFIG.TEST_TIMEOUT_MS,
    initialMemoryMb:
      overrides?.initialMemoryMb ??
      TEST_EXECUTION_CONFIG.PGLITE_INITIAL_MEMORY_MB,
  }
}
