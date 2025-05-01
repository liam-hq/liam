BEGIN;

-- Enable vector extension
create extension if not exists vector;

-- Create documents table for storing embeddings
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb,
  embedding vector(1536)  -- OpenAI ada-002 embedding size
);

-- Create index for vector similarity search
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create function for matching documents with LangChain expected signature
-- This function supports both the original and LangChain signatures
create or replace function match_documents(
  filter jsonb default '{}',
  match_count int default 10,
  query_embedding vector(1536) default null,
  match_threshold float default 0.3
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql stable
as $$
begin
  -- Check which signature is being used based on parameters
  if query_embedding is null and filter ? 'query_embedding' then
    -- Extract query_embedding from filter if provided in that format
    query_embedding := (filter->>'query_embedding')::vector(1536);
  end if;

  -- Ensure we have a valid query_embedding
  if query_embedding is null then
    raise exception 'query_embedding is required';
  end if;

  -- Return matching documents
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

COMMIT;
