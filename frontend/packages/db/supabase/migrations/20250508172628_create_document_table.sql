BEGIN;

CREATE TABLE "public"."document" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "project_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

-- Add comment to the table
COMMENT ON TABLE "public"."document" IS 'Stores document information';

-- Add comments to columns
COMMENT ON COLUMN "public"."document"."id" IS 'Unique identifier for the document';
COMMENT ON COLUMN "public"."document"."project_id" IS 'Reference to the project this document belongs to';
COMMENT ON COLUMN "public"."document"."content" IS 'Content of the document';
COMMENT ON COLUMN "public"."document"."created_at" IS 'Timestamp when the document was created';
COMMENT ON COLUMN "public"."document"."updated_at" IS 'Timestamp when the document was last updated';

-- Create index on project_id for faster lookups
CREATE INDEX "document_project_id_idx" ON "public"."document" ("project_id");

-- Grant permissions
GRANT ALL ON TABLE "public"."document" TO "anon";
GRANT ALL ON TABLE "public"."document" TO "authenticated";
GRANT ALL ON TABLE "public"."document" TO "service_role";

COMMIT;
