# Liam-DB Executor Setup

## Required Environment Variables

To run the Liam-DB executor, you need to set the following environment variables:

```bash
# Supabase configuration
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Organization ID (get this from your Liam ERD organization)
export LIAM_ORGANIZATION_ID="your-organization-uuid"

# OpenAI API key (required for the AI model)
export OPENAI_API_KEY="your-openai-api-key"
```

## Running the Executor

1. First, set up the benchmark workspace if you haven't already:
   ```bash
   pnpm setupWorkspace
   ```

2. Run the Liam-DB executor:
   ```bash
   pnpm executeLiamDB
   ```

## How it Works

The Liam-DB executor:
1. Creates a design session in the database
2. Runs the deep modeling AI workflow directly (without Trigger.dev)
3. Fetches the generated schema from the database

Unlike the OpenAI executor which calls the OpenAI API directly, the Liam-DB executor uses the full Liam ERD AI pipeline to generate schemas.