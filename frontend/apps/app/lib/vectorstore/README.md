# Supabase Vector + LangChain Retriever RAG Implementation

This directory contains the implementation of a Retrieval Augmented Generation (RAG) system using Supabase Vector and LangChain. The system is designed to enhance the chatbot's responses by retrieving relevant information from Markdown documents in the `docs/best_practices` and `docs/postgres` directories.

## Architecture

The implementation consists of the following components:

1. **Supabase Vector Store**: A vector database built on Supabase that stores document embeddings.
2. **Document Loader**: Loads and processes Markdown files from the specified directories.
3. **Retriever**: Retrieves relevant documents based on user queries.
4. **RAG Integration**: Enhances the chatbot's responses by incorporating retrieved documents.

## Files

- `supabaseClient.ts`: Utility for creating a Supabase client.
- `documentLoader.ts`: Loads and processes Markdown files from the docs directory.
- `supabaseVectorStore.ts`: Handles the creation and management of the vector store.
- `supabaseRetriever.ts`: Implements the retriever functionality.
- `../scripts/initVectorStore.ts`: Script to initialize the vector store.

## Setup

1. Install the required dependencies:

```bash
pnpm install
```

2. Set up the required environment variables in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

3. Run the SQL migration to create the necessary tables and functions in Supabase:

```bash
# Copy the SQL from frontend/packages/db/supabase/migrations/20250501120603_add_vector_support/migration.sql
# and run it in your Supabase project's SQL editor
```

4. Initialize the vector store with documents:

```bash
# Option 1: Using environment variables in .env.local
pnpm run init-vectorstore

# Option 2: Passing credentials directly (useful for CI/CD or when .env.local is not available)
pnpm tsx scripts/initVectorStore.ts "https://your-supabase-url.supabase.co" "your-supabase-service-role-key" "your-openai-api-key"
```

> **Note**: The initialization script requires valid Supabase and OpenAI credentials. You can either:
> 1. Set them in your `.env.local` file and run the script without arguments
> 2. Pass them directly as command-line arguments in the order: Supabase URL, Supabase service role key, OpenAI API key
>
> The script will validate the credentials and provide clear error messages if they are invalid.

## Usage

The RAG system is integrated into the chatbot API route at `app/api/chat/route.ts`. When a user sends a message, the system:

1. Retrieves relevant documents based on the user's query.
2. Incorporates these documents into the prompt sent to the language model.
3. Returns a response that is enhanced with information from the retrieved documents.

## Customization

- **Number of retrieved documents**: Modify the `k` parameter in the `retrieveRelevantDocuments` function call in `route.ts`.
- **Chunk size**: Adjust the `chunkSize` and `chunkOverlap` parameters in `documentLoader.ts` to change how documents are split.
- **Embedding model**: Change the embedding model in `supabaseVectorStore.ts` if needed.

## Troubleshooting

- If documents aren't being retrieved correctly, check that the vector store has been properly initialized.
- Ensure that the Supabase URL and service role key are correctly set.
- Verify that the OpenAI API key is valid and has the necessary permissions.
