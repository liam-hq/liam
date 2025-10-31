/**
 * Default recursion limit for LangGraph workflow execution.
 * This value limits the total number of state transitions (edges) in the graph.
 *
 * Important: Node retries do NOT count toward this limit. The limit only
 * applies to transitions between nodes.
 *
 * TEMPORARY LIMITATION (set to 10):
 * Due to issues with createMigrationTool, the DB Agent cannot resolve schema issues
 * on the second and subsequent attempts, causing infinite loops between:
 * leadAgent → dbAgent → qaAgent → leadAgent (when schemaIssues exist)
 *
 * Current behavior with limit=10:
 * - Allows multiple iterations of: PM Agent → DB Agent → QA Agent → Lead Agent → DB Agent
 * - The workflow will fail after 10 loops if issues persist
 * - Provides more opportunities for the DB Agent to refine the schema
 *
 * TODO: Increase this limit after fixing createMigrationTool to properly handle
 * schema modifications (e.g., unique constraint issues, JSON patch errors)
 * See: route06/liam-internal#5642
 */
export const DEFAULT_RECURSION_LIMIT = 10

/**
 * Recursion limit for QA Agent execution with auto-retry functionality.
 *
 * Supports up to 3 automatic SQL retry attempts:
 * - Initial execution: ~10 steps
 * - Retry cycles: 3 × 10 = 30 steps
 * - Total: 40 steps + buffer = 50 steps
 *
 * @see {@link routeAfterAnalyzeFailures} for retry limit logic (MAX_RETRY_ATTEMPTS = 3)
 */
export const QA_AGENT_RECURSION_LIMIT = 50

/**
 * Maximum number of retry attempts for failed SQL test cases.
 *
 * Behavior:
 * - CI environment: 0 attempts (fast execution, compact logs)
 * - Development/Production: 3 attempts (allows learning from failures)
 *
 * @see {@link routeAfterAnalyzeFailures} for retry routing logic
 */
export const MAX_RETRY_ATTEMPTS = process.env['CI'] === 'true' ? 0 : 3
