import type { Schema } from '@liam-hq/db-structure'
import { createHash } from 'node:crypto'

/**
 * In-memory vector store implementation for testing/offline use
 * This mocks the functionality of SupabaseVectorStore without requiring external dependencies
 */
export class InMemoryVectorStore {
  private documents: Map<string, {
    id: string
    content: string
    metadata: Record<string, any>
    hash: string
  }> = new Map()

  constructor() {}

  /**
   * Generate a simple hash for schema content (replaces embedding)
   */
  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex')
  }

  /**
   * Mock embedding sync - stores schema content with hash-based change detection
   */
  async syncSchemaEmbeddings(schema: Schema): Promise<{ success: boolean; error?: string }> {
    try {
      const schemaContent = JSON.stringify(schema)
      const hash = this.generateHash(schemaContent)
      
      // Check if content has changed
      const existingDoc = Array.from(this.documents.values()).find(doc => 
        doc.metadata.type === 'schema'
      )
      
      if (existingDoc && existingDoc.hash === hash) {
        // No changes, skip sync
        return { success: true }
      }

      // Create or update document
      const docId = existingDoc?.id || `schema-${Date.now()}`
      this.documents.set(docId, {
        id: docId,
        content: schemaContent,
        metadata: {
          type: 'schema',
          tableCount: Object.keys(schema.tables).length,
          relationCount: schema.relations.length,
          lastUpdated: new Date().toISOString()
        },
        hash
      })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mock similarity search - returns stored documents based on simple matching
   */
  async searchSimilar(query: string, limit: number = 5): Promise<Array<{
    id: string
    content: string
    metadata: Record<string, any>
    similarity: number
  }>> {
    const results: Array<{
      id: string
      content: string
      metadata: Record<string, any>
      similarity: number
    }> = []

    // Simple text-based similarity (mock implementation)
    for (const doc of this.documents.values()) {
      const similarity = this.calculateTextSimilarity(query, doc.content)
      if (similarity > 0.1) { // Threshold for relevance
        results.push({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          similarity
        })
      }
    }

    // Sort by similarity and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  /**
   * Simple text similarity calculation (Jaccard similarity)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<{
    id: string
    content: string
    metadata: Record<string, any>
  } | null> {
    const doc = this.documents.get(id)
    if (!doc) return null
    
    return {
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata
    }
  }

  /**
   * Get all documents with optional filtering
   */
  async getAllDocuments(filter?: { type?: string }): Promise<Array<{
    id: string
    content: string
    metadata: Record<string, any>
  }>> {
    const results: Array<{
      id: string
      content: string
      metadata: Record<string, any>
    }> = []

    for (const doc of this.documents.values()) {
      if (!filter || !filter.type || doc.metadata.type === filter.type) {
        results.push({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata
        })
      }
    }

    return results
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.documents.clear()
  }

  /**
   * Get document count
   */
  getDocumentCount(): number {
    return this.documents.size
  }
}