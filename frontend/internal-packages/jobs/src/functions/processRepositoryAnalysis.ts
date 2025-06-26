import { Document } from '@langchain/core/documents'
import { OpenAIEmbeddings } from '@langchain/openai'
import { getFileContent } from '@liam-hq/github'
import { logger } from '@trigger.dev/sdk/v3'
import { createClient } from '../libs/supabase'

export interface RepositoryAnalysisPayload {
  projectId: string
  repositoryId: string
  repositoryOwner: string
  repositoryName: string
  installationId: number
  organizationId: string
}

interface DocumentFile {
  path: string
  content: string
  type: 'essential' | 'docs'
}

interface RepositoryDocumentMetadata {
  source: 'repository_analysis'
  type: 'essential' | 'docs'
  project_id: string
  repository_id: string
  file_path: string
  file_type: string
  repository_owner: string
  repository_name: string
  analyzed_at: string
  organization_id?: string
  updated_at: string
  chunk_index?: number
  chunk_total?: number
  section_title?: string
}

// Essential files that must be checked
const ESSENTIAL_FILES = ['README.md', 'ABOUT.md']

// Documentation directories to search
const DOC_DIRECTORIES = ['docs', 'documents']

// Keywords to look for in documentation files
const DOC_KEYWORDS = [
  'architecture',
  'design',
  'overview',
  'schema',
  'migration',
]

/**
 * Get repository file tree using GitHub Tree API
 */
const getRepositoryFileTree = async (
  repositoryOwner: string,
  repositoryName: string,
  installationId: number,
  errors: string[],
): Promise<string[]> => {
  try {
    // Import Octokit and auth
    const { Octokit } = await import('@octokit/rest')
    const { createAppAuth } = await import('@octokit/auth-app')

    // Initialize Octokit with GitHub App authentication
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env['GITHUB_APP_ID'],
        privateKey: process.env['GITHUB_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
        installationId,
      },
    })

    // Get repository tree
    const { data: tree } = await octokit.git.getTree({
      owner: repositoryOwner,
      repo: repositoryName,
      tree_sha: 'HEAD',
      recursive: 'true',
    })

    // Filter for relevant documentation files
    const relevantFiles = tree.tree
      .filter((item) => {
        if (item.type !== 'blob' || !item.path) return false

        const path = item.path.toLowerCase()

        // Check if file is in docs or documents directory
        const isInDocDir = DOC_DIRECTORIES.some((dir) =>
          path.startsWith(`${dir}/`),
        )

        // Check if file contains relevant keywords (more flexible matching)
        const hasRelevantKeyword = DOC_KEYWORDS.some((keyword) =>
          path.includes(keyword.toLowerCase()),
        )

        // Check if file has relevant extension
        const hasRelevantExt = /\.(md|txt|rst)$/i.test(path)

        // Include files that match directory + keyword + extension criteria
        return isInDocDir && hasRelevantKeyword && hasRelevantExt
      })
      .map((item) => item.path)
      .filter((path): path is string => path !== undefined)

    return relevantFiles
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      'Failed to get repository file tree',
    )
    errors.push(errorMessage)
    // Fallback to empty array if Tree API fails
    return []
  }
}

/**
 * Get error message from any error type
 */
const getErrorMessage = (error: unknown, context: string): string => {
  return `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
}

/**
 * Fetch a single file from the repository
 */
const fetchFile = async (
  repositoryFullName: string,
  filePath: string,
  installationId: number,
  fileType: DocumentFile['type'],
  errors: string[],
): Promise<DocumentFile | null> => {
  try {
    const { content } = await getFileContent(
      repositoryFullName,
      filePath,
      'main', // Default branch
      installationId,
    )

    if (content) {
      return { path: filePath, content, type: fileType }
    }

    return null
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      `Failed to fetch ${fileType} file ${filePath}`,
    )
    errors.push(errorMessage)
    return null
  }
}

/**
 * Find the best breaking point for text chunking
 */
const findOptimalBreakPoint = (
  text: string,
  start: number,
  end: number,
  chunkSize: number,
): number => {
  const minBreakPoint = start + chunkSize / 2

  const paragraphBreak = text.lastIndexOf('\n\n', end)
  if (paragraphBreak > minBreakPoint) {
    return paragraphBreak
  }

  const sentenceBreak = text.lastIndexOf('.', end)
  if (sentenceBreak > minBreakPoint) {
    return sentenceBreak + 1
  }

  const lineBreak = text.lastIndexOf('\n', end)
  if (lineBreak > minBreakPoint) {
    return lineBreak
  }

  return end
}

/**
 * Split text into chunks with overlap
 */
const splitTextIntoChunks = (
  text: string,
  chunkSize = 1000,
  overlap = 200,
): string[] => {
  if (text.length <= chunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + chunkSize

    if (end < text.length) {
      end = findOptimalBreakPoint(text, start, end, chunkSize)
    }

    chunks.push(text.slice(start, end).trim())

    start = end - overlap
    if (start >= text.length) break
  }

  return chunks.filter((chunk) => chunk.length > 0)
}

/**
 * Extract section title from markdown content
 */
const extractSectionTitle = (chunk: string): string | undefined => {
  const lines = chunk.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '')
    }
  }
  return undefined
}

/**
 * Convert DocumentFile to LangChain Documents with chunking
 */
const createLangChainDocuments = (
  file: DocumentFile,
  projectId: string,
  repositoryId: string,
  repositoryOwner: string,
  repositoryName: string,
  organizationId: string,
): Document[] => {
  const now = new Date().toISOString()

  // Split content into chunks
  const chunks = splitTextIntoChunks(file.content)

  return chunks.map((chunk, index) => {
    const sectionTitle = extractSectionTitle(chunk)

    const metadata: RepositoryDocumentMetadata = {
      source: 'repository_analysis',
      type: file.type,
      project_id: projectId,
      repository_id: repositoryId,
      file_path: file.path,
      file_type: file.type,
      repository_owner: repositoryOwner,
      repository_name: repositoryName,
      analyzed_at: now,
      organization_id: organizationId,
      updated_at: now,
      chunk_index: index,
      chunk_total: chunks.length,
      ...(sectionTitle && { section_title: sectionTitle }),
    }

    return new Document({
      pageContent: chunk,
      metadata,
    })
  })
}

/**
 * Validate OpenAI API key
 */
const validateOpenAIKey = (): string => {
  const openAIApiKey = process.env['OPENAI_API_KEY']

  if (!openAIApiKey) {
    throw new Error(
      'Valid OpenAI API key is required for generating embeddings',
    )
  }

  return openAIApiKey
}

/**
 * Insert a single document into Supabase
 */
const insertDocumentToSupabase = async (
  supabase: ReturnType<typeof createClient>,
  documentContent: string,
  metadata: RepositoryDocumentMetadata,
  vector: number[],
): Promise<boolean> => {
  // @ts-ignore - Type inconsistencies with Supabase schema definitions
  const { error } = await supabase.from('documents').insert([
    {
      content: documentContent,
      metadata,
      embedding: vector,
      updated_at: metadata.updated_at,
      organization_id: metadata.organization_id || '',
    },
  ])

  if (error) {
    const errorMessage = `Document insertion failed: ${error.message} ${error.code} ${error.details}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }

  return true
}

/**
 * Process a batch of documents
 */
const processBatch = async (
  batch: Document[],
  embeddings: OpenAIEmbeddings,
  supabase: ReturnType<typeof createClient>,
  errors: string[],
): Promise<number> => {
  try {
    // Generate embeddings for the batch
    const texts = batch.map((doc) => doc.pageContent)
    const metadatas = batch.map(
      (doc) => doc.metadata as RepositoryDocumentMetadata,
    )
    const vectors = await embeddings.embedDocuments(texts)

    // Insert each document into Supabase
    let processed = 0
    for (let j = 0; j < vectors.length; j++) {
      const vector = vectors[j]
      const metadata = metadatas[j]
      const text = texts[j]

      if (!metadata) {
        logger.warn(`Skipping document ${j} due to missing metadata`)
        continue
      }

      if (!vector) {
        logger.warn(`Skipping document ${j} due to missing vector`)
        continue
      }

      // Ensure text is always a valid string
      const documentContent = (() => {
        if (text === null || text === undefined) {
          return ''
        }
        return typeof text === 'string' ? text : String(text)
      })()

      try {
        await insertDocumentToSupabase(
          supabase,
          documentContent,
          metadata,
          vector,
        )
        processed++
      } catch (insertError) {
        const errorMessage = getErrorMessage(
          insertError,
          `Failed to insert document ${j}`,
        )
        errors.push(errorMessage)
      }
    }

    return processed
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Failed to process batch')
    logger.error(errorMessage)
    errors.push(errorMessage)
    return 0
  }
}

/**
 * Save documents to vector store with embeddings
 */
const saveDocumentsToVectorStore = async (
  documents: Document[],
  errors: string[],
): Promise<number> => {
  try {
    if (documents.length === 0) {
      logger.log('No documents to save')
      return 0
    }

    // Validate OpenAI API key
    const openAIApiKey = validateOpenAIKey()

    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({ openAIApiKey })
    const supabase = createClient()

    // Process documents in batches to avoid overwhelming the API
    const BATCH_SIZE = 10
    let totalProcessed = 0

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE)
      const processed = await processBatch(batch, embeddings, supabase, errors)
      totalProcessed += processed
    }

    return totalProcessed
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      'Failed to save documents to vector store',
    )
    logger.error(errorMessage)
    errors.push(errorMessage)
    return 0
  }
}

/**
 * Fetch essential files from repository
 */
const fetchEssentialFiles = async (
  repositoryFullName: string,
  installationId: number,
  errors: string[],
): Promise<{ files: DocumentFile[]; count: number }> => {
  const files: DocumentFile[] = []
  let count = 0

  for (const fileName of ESSENTIAL_FILES) {
    const file = await fetchFile(
      repositoryFullName,
      fileName,
      installationId,
      'essential',
      errors,
    )

    if (file) {
      files.push(file)
      count++
    }
  }

  return { files, count }
}

/**
 * Fetch documentation files from repository
 */
const fetchDocumentationFiles = async (
  repositoryOwner: string,
  repositoryName: string,
  repositoryFullName: string,
  installationId: number,
  errors: string[],
): Promise<{ files: DocumentFile[]; count: number }> => {
  const files: DocumentFile[] = []
  let count = 0

  // Get documentation files using Tree API
  const docFilePaths = await getRepositoryFileTree(
    repositoryOwner,
    repositoryName,
    installationId,
    errors,
  )

  for (const filePath of docFilePaths) {
    const file = await fetchFile(
      repositoryFullName,
      filePath,
      installationId,
      'docs',
      errors,
    )

    if (file) {
      files.push(file)
      count++
    }
  }

  return { files, count }
}

/**
 * Process and save documents to vector store
 */
const processAndSaveDocuments = async (
  documentFiles: DocumentFile[],
  projectId: string,
  repositoryId: string,
  repositoryOwner: string,
  repositoryName: string,
  organizationId: string,
  errors: string[],
): Promise<{ processedFiles: number; totalChunks: number }> => {
  // Convert to LangChain Documents with chunking
  const langChainDocuments = documentFiles.flatMap((file) =>
    createLangChainDocuments(
      file,
      projectId,
      repositoryId,
      repositoryOwner,
      repositoryName,
      organizationId,
    ),
  )

  // Save to vector store with embeddings
  const processedFiles = await saveDocumentsToVectorStore(
    langChainDocuments,
    errors,
  )

  return { processedFiles, totalChunks: langChainDocuments.length }
}

/**
 * Current implementation allows duplicate documents to be saved if this function
 * runs multiple times for the same repository. This can happen due to:
 * - Job failures and retries
 * - Manual re-analysis of the same repository
 * - System errors causing process interruption and restart
 *
 * Proposed solutions:
 * 1. Add content hash to documents table for true duplicate detection
 * 2. Implement upsert logic with unique constraints
 * 3. Add pre-processing cleanup of existing documents
 *
 * Priority: Medium - Should be addressed before production scaling
 */

/**
 * Retrieve documents from repository and save to vector store
 */
export const processRepositoryAnalysis = async (
  payload: RepositoryAnalysisPayload,
): Promise<{ processedFiles: number; errors: string[] }> => {
  const {
    projectId,
    repositoryId,
    repositoryOwner,
    repositoryName,
    installationId,
    organizationId,
  } = payload

  logger.log(`🔍 Scanning repository: ${repositoryOwner}/${repositoryName}`)

  const repositoryFullName = `${repositoryOwner}/${repositoryName}`
  const errors: string[] = []

  try {
    const documentFiles: DocumentFile[] = []

    // 1. Fetch essential files (README.md, ABOUT.md)
    const { files: essentialFiles, count: essentialCount } =
      await fetchEssentialFiles(repositoryFullName, installationId, errors)
    documentFiles.push(...essentialFiles)

    // 2. Fetch documentation files
    const { files: docFiles, count: docsCount } = await fetchDocumentationFiles(
      repositoryOwner,
      repositoryName,
      repositoryFullName,
      installationId,
      errors,
    )
    documentFiles.push(...docFiles)

    // 3. Process and save documents
    const { processedFiles, totalChunks } = await processAndSaveDocuments(
      documentFiles,
      projectId,
      repositoryId,
      repositoryOwner,
      repositoryName,
      organizationId,
      errors,
    )

    // Summary log
    logger.log(`📊 Repository scan completed:
  ✅ Found files: ${documentFiles.length}
  ❌ Missing files: ${errors.length}
  📁 Essential: ${essentialCount}
  📚 Docs: ${docsCount}
  🧩 Total chunks: ${totalChunks}
  💾 Processed: ${processedFiles}`)

    return { processedFiles, errors }
  } catch (error) {
    const errorMessage = getErrorMessage(error, 'Repository analysis failed')
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}
