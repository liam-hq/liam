import 'dotenv/config'
import { createSupabaseVectorStore } from '../lib/vectorstore/supabaseVectorStore'

/**
 * Script to initialize the Supabase Vector Store with documents from the docs directory
 * This script loads documents, generates embeddings, and stores them in Supabase
 * Usage: tsx initVectorStore.ts [openaiApiKey]
 */
async function main() {
  try {
    // Get OpenAI API key from command line arguments
    const openaiApiKey = process.argv[2]

    // Log start of initialization
    process.stdout.write('Starting Supabase Vector Store initialization...\n')

    process.stdout.write(
      'Using default or environment variable Supabase credentials\n',
    )

    if (openaiApiKey) {
      process.env.OPENAI_API_KEY = openaiApiKey
      process.stdout.write('Using OpenAI API key from command line arguments\n')
    }

    // Create vector store
    await createSupabaseVectorStore()

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

// Run the main function
main()
