import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
import { supabaseClient } from '.'

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small',
})

export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: 'documents',
  queryName: 'match_documents',
})
