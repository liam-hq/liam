BEGIN;

-- Ensure vector extension is enabled
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";

-- Create the documents table with all required columns
CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "project_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" public.vector(1536),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

-- Add comment to the table
COMMENT ON TABLE "public"."documents" IS 'Stores document information';

-- Add comments to columns
COMMENT ON COLUMN "public"."documents"."id" IS 'Unique identifier for the document';
COMMENT ON COLUMN "public"."documents"."project_id" IS 'Reference to the project this document belongs to';
COMMENT ON COLUMN "public"."documents"."content" IS 'Content of the document';
COMMENT ON COLUMN "public"."documents"."metadata" IS 'Additional metadata for the document';
COMMENT ON COLUMN "public"."documents"."embedding" IS 'Vector embedding of the document content';
COMMENT ON COLUMN "public"."documents"."created_at" IS 'Timestamp when the document was created';
COMMENT ON COLUMN "public"."documents"."updated_at" IS 'Timestamp when the document was last updated';

-- Create index on project_id for faster lookups
CREATE INDEX "documents_project_id_idx" ON "public"."documents" ("project_id");

-- Create index on embedding for vector search
CREATE INDEX "documents_embedding_idx" ON "public"."documents" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Grant permissions
GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";

COMMIT;
