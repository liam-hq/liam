/**
 * Generate LangSmith thread_id search URL
 *
 * Note: This function depends on LangSmith's implicit behavior of recording thread_id as metadata.
 * When thread_id is set in LangChain RunnableConfig, LangSmith automatically records the following metadata:
 * - metadata_key: "thread_id"
 * - metadata_value: actual thread_id value
 *
 * If this implicit behavior changes, the generated URL may not be able to find traces.
 */
export const generateLangSmithUrl = (threadId: string): string | null => {
  const organizationId = process.env['LANGSMITH_ORGANIZATION_ID']
  const projectId = process.env['LANGSMITH_PROJECT_ID']

  if (!organizationId || !projectId) {
    return null
  }

  const baseUrl = `https://smith.langchain.com/o/${organizationId}/projects/p/${projectId}`
  const filter = `and(eq(is_root, true), and(eq(metadata_key, "thread_id"), eq(metadata_value, "${threadId}")))`
  const searchModel = { filter }
  const encodedSearchModel = encodeURIComponent(JSON.stringify(searchModel))

  return `${baseUrl}?searchModel=${encodedSearchModel}`
}
