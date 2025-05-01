import { getExistingVectorStore } from './supabaseVectorStore'

/**
 * Retrieves relevant documents based on a query
 * @param query The search query
 * @param k Number of documents to retrieve (default: 4)
 * @returns Array of relevant documents
 */
export async function retrieveRelevantDocuments(query: string, k = 4) {
  // Get existing vector store
  const vectorStore = await getExistingVectorStore()

  // Try direct similarity search with lower threshold
  const relevantDocs = await vectorStore.similaritySearch(query, k, {
    score_threshold: 0.3, // Lower threshold to get more results
  })

  // If still no documents, try fallback to general documentation
  if (relevantDocs.length === 0) {
    // Fallback logic would go here if needed
  }

  return relevantDocs
}
