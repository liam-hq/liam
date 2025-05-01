import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createClient } from '@liam-hq/db'
import { loadDocuments } from './documentLoader'

/**
 * Creates a Supabase Vector Store instance and stores documents with embeddings
 * This function loads documents, generates embeddings, and stores them in Supabase
 * @returns SupabaseVectorStore instance with documents stored
 */
export async function createSupabaseVectorStore() {
  try {
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
    // Log the error
    process.stderr.write(`Error in implementation: ${error}\n`)
    throw error
  }
}

/**
 * Gets an existing Supabase Vector Store
 * This function connects to an existing vector store without loading new documents
 * @returns SupabaseVectorStore instance
 */
export async function getExistingVectorStore() {
  try {
    // Check if OpenAI API key is provided
    const openAIApiKey = process.env.OPENAI_API_KEY

    if (!openAIApiKey || openAIApiKey === 'example-openai-api-key') {
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

    // Connect to existing Vector Store
    return new SupabaseVectorStore(embeddings, {
      // biome-ignore lint/suspicious/noExplicitAny: Type mismatch between our Supabase client and LangChain's expected client
      client: supabaseClient as any,
      tableName: 'documents',
      queryName: 'match_documents',
    })
  } catch (error) {
    // Log the error
    process.stderr.write(`Error in implementation: ${error}\n`)
    throw error
  }
}
