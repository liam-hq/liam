/**
 * Default recursion limit for LangGraph workflow execution.
 * This value limits the total number of state transitions (edges) in the graph.
 *
 * Important: Node retries do NOT count toward this limit. The limit only
 * applies to transitions between nodes.
 *
 * The workflow has 8 nodes:
 * - Normal execution: 9 transitions (START → 8 nodes → END)
 * - With error loops: May have additional transitions when errors occur
 *   (e.g., validateSchema → designSchema)
 *
 * Setting this to 50 ensures:
 * - Complete workflow execution under normal conditions
 * - Ample headroom for complex error handling loops and retries
 * - Protection against infinite loops while allowing for complex workflows
 * - Sufficient capacity for finding optimal workflow patterns
 */
export const DEFAULT_RECURSION_LIMIT = 50
