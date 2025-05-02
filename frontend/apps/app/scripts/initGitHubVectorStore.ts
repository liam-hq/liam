import 'dotenv/config'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createClient } from '@liam-hq/db'
import { Document } from 'langchain/document'

/**
 * Script to initialize the Supabase Vector Store with actions from a GitHub repository
 *
 * Usage: tsx initGitHubVectorStore.ts [openaiApiKey] [projectId] [installationId]
 *
 * Example: tsx initGitHubVectorStore.ts sk-xxxx liam-hq/liam 12345
 */
async function main() {
  try {
    // Get command line arguments
    const openaiApiKey = process.argv[2]
    const projectId = process.argv[3] // Format: owner/repo
    const installationId = process.argv[4]
      ? Number.parseInt(process.argv[4], 10)
      : undefined

    if (!projectId || !installationId) {
      process.stderr.write('Error: projectId and installationId are required\n')
      process.stderr.write(
        'Usage: tsx initGitHubVectorStore.ts [openaiApiKey] [projectId] [installationId]\n',
      )
      process.exit(1)
    }

    // Log start of initialization
    process.stdout.write(
      'Starting GitHub Repository Vector Store initialization...\n',
    )

    process.stdout.write(
      'Using default or environment variable Supabase credentials\n',
    )

    if (openaiApiKey) {
      process.env.OPENAI_API_KEY = openaiApiKey
      process.stdout.write('Using OpenAI API key from command line arguments\n')
    }

    // Create vector store
    const vectorStore = await createVectorStore()

    process.stdout.write(
      `Loading actions from GitHub repository: ${projectId}\n`,
    )

    try {
      // Dynamically import the GitHub modules
      const { getRepositoryFiles, getRepositoryLanguages } = await import(
        '../lib/github/repositoryConnector'
      )
      const { detectLanguage } = await import('../lib/github/languageDetection')
      const { extractActionsFromFile } = await import(
        '../lib/github/actionExtraction'
      )

      // Get repository language statistics
      const languages = await getRepositoryLanguages(projectId, installationId)
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
      process.stdout.write(`Retrieved ${files.length} files from repository\n`)

      // Process files in batches to avoid memory issues
      const BATCH_SIZE = 20
      let totalActions = 0

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE)
        process.stdout.write(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} (${batch.length} files)\n`,
        )

        // Process each file in the batch
        const batchPromises = batch.map(
          async (file: { path: string; content: string; language: string }) => {
            try {
              // Detect language if not already set (using it for file processing)
              detectLanguage(file.path, file.content)

              // Extract actions from the file
              const actions = await extractActionsFromFile(
                file.path,
                file.content,
              )

              // Convert actions to LangChain documents
              return actions.map(
                (action) =>
                  new Document({
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
          },
        )

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
      throw error
    }

    // Log successful completion
    process.stdout.write(
      'GitHub Repository Vector Store initialization completed successfully!\n',
    )
  } catch (error) {
    // Log any errors
    process.stderr.write('Error initializing GitHub Repository Vector Store:\n')
    process.stderr.write(`${error}\n`)
    process.exit(1)
  }
}

/**
 * Creates a Supabase Vector Store instance
 * @returns SupabaseVectorStore instance
 */
async function createVectorStore(): Promise<SupabaseVectorStore> {
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

  // Create an empty vector store
  const vectorStore = new SupabaseVectorStore(embeddings, {
    // biome-ignore lint/suspicious/noExplicitAny: Type mismatch between our Supabase client and LangChain's expected client
    client: supabaseClient as any,
    tableName: 'documents',
    queryName: 'match_documents',
  })

  process.stdout.write('Vector store instance created successfully\n')
  return vectorStore
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
