import 'dotenv/config'
import { loadDocuments } from '../lib/vectorstore/documentLoader'

// Import types will be used instead of declaring them locally

/**
 * Script to initialize the Supabase Vector Store with documents from the docs directory
 * and optionally from a GitHub repository
 *
 * Usage:
 * - For docs only: tsx initVectorStore.ts
 * - For GitHub repo: tsx initVectorStore.ts [projectId] [installationId]
 *
 * Note: OpenAI API Key must be set in the OPENAI_API_KEY environment variable
 */
async function main() {
  try {
    // Get command line arguments
    const projectId = process.argv[2] // Format: owner/repo
    const installationId = process.argv[3]
      ? Number.parseInt(process.argv[3], 10)
      : undefined

    // Log start of initialization
    process.stdout.write('Starting Supabase Vector Store initialization...\n')

    process.stdout.write(
      'Using default or environment variable Supabase credentials\n',
    )

    // OpenAI API Key is expected to be in environment variables
    process.stdout.write('Using OpenAI API key from environment variables\n')

    // Create vector store with docs
    const vectorStore = await createVectorStore()

    // If GitHub project info is provided, add repository actions
    if (projectId && installationId) {
      process.stdout.write(
        `Loading actions from GitHub repository: ${projectId}\n`,
      )

      try {
        // Dynamically import the GitHub modules to avoid issues if they're not available
        const { getRepositoryFiles, getRepositoryLanguages } = await import(
          '../lib/github/repositoryConnector'
        )
        // Import only needed modules
        const { extractActionsFromFile } = await import(
          '../lib/github/actionExtraction'
        )
        // Dynamically import Document
        const { Document: LangChainDocument } = await import(
          'langchain/document'
        )

        // Get repository language statistics
        const languages = await getRepositoryLanguages(
          projectId,
          installationId,
        )
        process.stdout.write(
          `Repository languages: ${Object.keys(languages).join(', ')}\n`,
        )

        // Determine which file extensions to focus on based on repository languages
        const fileExtensions = getFileExtensionsFromLanguages(languages)
        process.stdout.write(
          `Focusing on file extensions: ${fileExtensions.join(', ')}\n`,
        )

        // Get repository files
        const files = await getRepositoryFiles(
          projectId,
          installationId,
          'main',
          fileExtensions,
        )
        process.stdout.write(
          `Retrieved ${files.length} files from repository\n`,
        )

        // Process files in batches to avoid memory issues
        const BATCH_SIZE = 20
        let totalActions = 0

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE)
          process.stdout.write(
            `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} (${batch.length} files)\n`,
          )

          // Process each file in the batch
          const batchPromises = batch.map(async (file) => {
            try {
              // Extract actions from the file
              const actions = await extractActionsFromFile(
                file.path,
                file.content,
              )

              // Convert actions to LangChain documents
              return actions.map(
                (action) =>
                  new LangChainDocument({
                    pageContent: action.code,
                    metadata: {
                      source: file.path,
                      language: action.language,
                      type: action.type,
                      name: action.name,
                      description: action.description,
                      lineStart: action.lineStart,
                      lineEnd: action.lineEnd,
                      patterns: action.patterns,
                      repository: projectId,
                      branch: 'main',
                    },
                  }),
              )
            } catch (error) {
              process.stderr.write(
                `Error processing file ${file.path}: ${error}\n`,
              )
              return []
            }
          })

          const batchResults = await Promise.all(batchPromises)
          const actionDocs = batchResults.flat()
          totalActions += actionDocs.length

          // Add to vector store
          if (actionDocs.length > 0) {
            await vectorStore.addDocuments(actionDocs)
            process.stdout.write(
              `Added ${actionDocs.length} actions to vector store\n`,
            )
          }
        }

        process.stdout.write(
          `Successfully processed ${totalActions} GitHub actions\n`,
        )
      } catch (error) {
        process.stderr.write(`Error processing GitHub repository: ${error}\n`)
      }
    }

    // Log successful completion
    process.stdout.write(
      'Supabase Vector Store initialization completed successfully!\n',
    )
  } catch (error) {
    // Log any errors
    process.stderr.write('Error initializing Supabase Vector Store:\n')
    process.stderr.write(`${error}\n`)
    process.exit(1)
  }
}

/**
 * Creates a Supabase Vector Store instance
 * @returns A vector store instance for document storage and retrieval
 */
async function createVectorStore() {
  try {
    // Dynamically import required modules
    const { SupabaseVectorStore } = await import(
      '@langchain/community/vectorstores/supabase'
    )
    const { OpenAIEmbeddings } = await import('@langchain/openai')
    const { createClient } = await import('@liam-hq/db')

    // Check if OpenAI API key is provided
    const openAIApiKey = process.env.OPENAI_API_KEY

    if (!openAIApiKey) {
      throw new Error(
        'Valid OpenAI API key is required for generating embeddings',
      )
    }

    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey,
    })

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    )

    // Load and split documents
    const docs = await loadDocuments()

    const totalDocs = docs.length
    process.stdout.write(
      `Processing ${totalDocs} document chunks for embedding...\n`,
    )

    // Define batch size for processing
    const BATCH_SIZE = 100
    let vectorStore = null

    // Process documents in batches
    for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, totalDocs)
      const batch = docs.slice(i, end)

      process.stdout.write(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(totalDocs / BATCH_SIZE)} (${batch.length} documents)...\n`,
      )

      try {
        // Process the current batch of documents
        process.stdout.write(
          `Processing embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}\n`,
        )

        // Log information before batch processing
        process.stdout.write(`Batch size: ${batch.length} documents\n`)

        // Create or reuse the vector store instance
        if (i === 0) {
          // Create the vector store with the first batch
          vectorStore = await SupabaseVectorStore.fromDocuments(
            batch,
            embeddings,
            {
              // biome-ignore lint/suspicious/noExplicitAny: Type mismatch between our Supabase client and LangChain's expected client
              client: supabaseClient as any,
              tableName: 'documents',
              queryName: 'match_documents',
            },
          )

          // Add debug log
          process.stdout.write('Vector store created\n')
          if (batch.length > 0) {
            process.stdout.write(
              `First document metadata: ${JSON.stringify(batch[0].metadata)}\n`,
            )
          }
        } else if (vectorStore) {
          // Add subsequent batches to the existing vector store
          await vectorStore.addDocuments(batch)
        }

        process.stdout.write(
          `Successfully processed batch ${Math.floor(i / BATCH_SIZE) + 1}\n`,
        )
      } catch (batchError) {
        process.stderr.write(
          `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError}\n`,
        )

        // Log more details about the error
        if (batchError instanceof Error) {
          process.stderr.write(`Error details: ${batchError.message}\n`)
          if (batchError.stack) {
            process.stderr.write(`Stack trace: ${batchError.stack}\n`)
          }
        }

        // Continue with next batch despite errors
      }
    }

    if (!vectorStore) {
      throw new Error('Failed to create vector store with any batch')
    }

    process.stdout.write(
      'Vector store instance created successfully with documents stored\n',
    )
    return vectorStore
  } catch (error) {
    process.stderr.write(`Error creating vector store: ${error}\n`)
    throw error
  }
}

/**
 * Determines which file extensions to focus on based on repository language statistics
 * @param languages Object mapping language names to byte counts
 * @returns Array of file extensions to focus on
 */
function getFileExtensionsFromLanguages(
  languages: Record<string, number>,
): string[] {
  const extensions: string[] = []

  // Sort languages by byte count (descending)
  const sortedLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang]) => lang)

  // Map languages to file extensions
  for (const language of sortedLanguages) {
    switch (language) {
      case 'JavaScript':
        extensions.push('.js', '.jsx', '.mjs', '.cjs')
        break
      case 'TypeScript':
        extensions.push('.ts', '.tsx')
        break
      case 'Python':
        extensions.push('.py', '.pyw')
        break
      case 'Java':
        extensions.push('.java')
        break
      case 'Ruby':
        extensions.push('.rb', '.rake')
        break
      case 'Go':
        extensions.push('.go')
        break
      case 'C#':
      case 'C Sharp':
        extensions.push('.cs')
        break
      case 'C++':
        extensions.push('.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.h')
        break
      case 'C':
        extensions.push('.c', '.h')
        break
      case 'PHP':
        extensions.push('.php')
        break
      case 'Swift':
        extensions.push('.swift')
        break
      case 'Kotlin':
        extensions.push('.kt', '.kts')
        break
      case 'Rust':
        extensions.push('.rs')
        break
      // Add more languages as needed
    }
  }

  // If no extensions were added, include common ones
  if (extensions.length === 0) {
    extensions.push(
      '.js',
      '.ts',
      '.py',
      '.java',
      '.rb',
      '.go',
      '.cs',
      '.cpp',
      '.c',
      '.php',
      '.swift',
      '.kt',
      '.rs',
    )
  }

  // Remove duplicates
  return [...new Set(extensions)]
}

// Run the main function
main()
