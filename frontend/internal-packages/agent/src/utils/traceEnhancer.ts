export const createEnhancedTraceData = (
  runId: string,
  workflowType: string,
  tags: string[] = [],
  metadata: Record<string, unknown> = {},
) => {
  const enhancedTags = [
    `run_id:${runId}`,
    `workflow_type:${workflowType}`,
    ...tags,
  ]

  const enhancedMetadata = {
    run_id: runId,
    workflow_type: workflowType,
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  return {
    tags: enhancedTags,
    metadata: enhancedMetadata,
  }
}
