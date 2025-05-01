import fs from 'node:fs/promises'
import path from 'node:path'
import { Document } from 'langchain/document'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { MarkdownTextSplitter } from 'langchain/text_splitter'

/**
 * Custom text loader that tracks line numbers in the loaded documents
 * This loader adds line number information to document metadata
 */
class LineAwareTextLoader extends BaseDocumentLoader {
  private filePath: string

  constructor(filePath: string) {
    super()
    this.filePath = filePath
  }

  async load(): Promise<Document[]> {
    // Get the file content
    const text = await fs.readFile(this.filePath, 'utf8')

    // Split content into lines
    const lines = text.split('\n')

    // Create a document with the content
    const doc = new Document({
      pageContent: text,
      metadata: {
        source: this.filePath.replace(/^.*[\\\/]liam[\\\/]/, ''), // Store relative path from liam root
        totalLines: lines.length,
      },
    })

    return [doc]
  }

  // Required by BaseDocumentLoader interface
  async loadAndSplit() {
    return this.load()
  }
}

/**
 * Custom markdown splitter that preserves line number information
 * This extends the standard MarkdownTextSplitter to track line numbers when splitting documents
 */
class LineAwareMarkdownSplitter extends MarkdownTextSplitter {
  async splitDocuments(documents: Document[]): Promise<Document[]> {
    // Get chunks from the parent splitter
    const chunks = await super.splitDocuments(documents)

    // Process each chunk to add line number information
    return chunks.map((chunk) => {
      const originalDoc = documents.find(
        (doc) => doc.metadata.source === chunk.metadata.source,
      )

      if (!originalDoc) {
        return chunk
      }

      // Calculate line numbers for the chunk
      const originalContent = originalDoc.pageContent
      const chunkContent = chunk.pageContent

      // Find the chunk's position in the original document
      const chunkStart = originalContent.indexOf(chunkContent)
      if (chunkStart === -1) {
        return chunk
      }

      // Count newlines to determine the start line
      const contentBeforeChunk = originalContent.substring(0, chunkStart)
      const startLine = (contentBeforeChunk.match(/\n/g) || []).length + 1

      // Count newlines in the chunk to determine the end line
      const endLine = startLine + (chunkContent.match(/\n/g) || []).length

      // Add line information to metadata
      return new Document({
        pageContent: chunk.pageContent,
        metadata: {
          ...chunk.metadata,
          loc: {
            lines: {
              from: startLine,
              to: endLine,
            },
          },
        },
      })
    })
  }
}

/**
 * Loads documents from specified directories and splits them into chunks
 * This function processes Markdown files from the docs/best_practices and docs/postgres directories
 * @returns Array of document chunks ready for embedding
 */
export async function loadDocuments() {
  // Get the project root path (from frontend/apps/app to the root liam directory)
  const rootPath = path.resolve(process.cwd(), '../../..')

  // Create loader for best_practices directory with our custom loader
  const bestPracticesLoader = new DirectoryLoader(
    path.join(rootPath, 'docs/best_practices'),
    {
      '.md': (path) => new LineAwareTextLoader(path),
    },
  )

  // Create loader for postgres directory with recursive option
  const postgresLoader = new DirectoryLoader(
    path.join(rootPath, 'docs/postgres'),
    {
      '.md': (path) => new LineAwareTextLoader(path),
    },
    true, // Search subdirectories recursively
  )

  // Load documents from both directories
  const bestPracticesDocs = await bestPracticesLoader.load()
  const postgresDocs = await postgresLoader.load()

  // Combine all documents
  const allDocs = [...bestPracticesDocs, ...postgresDocs]

  // Create our line-aware text splitter
  const textSplitter = new LineAwareMarkdownSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  // Split documents into chunks while preserving line information
  const splitDocs = await textSplitter.splitDocuments(allDocs)

  return splitDocs
}
