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
