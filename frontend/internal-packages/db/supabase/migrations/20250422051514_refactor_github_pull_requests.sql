/*
  Migration: Refactor github_pull_requests table and create github_pull_request_comments table

  Purpose:
  - Remove comment_id from github_pull_requests to avoid record updates, moving it to a separate table
  - Create new github_pull_request_comments table with a 1:1 relationship to github_pull_requests

  Affected tables:
  - github_pull_requests
  - github_pull_request_comments (new)
*/

BEGIN;

-- Step 1: Create the new github_pull_request_comments table
CREATE TABLE "public"."github_pull_request_comments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "github_pull_request_id" uuid NOT NULL,
  "github_comment_identifier" bigint NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp(3) with time zone NOT NULL,

  -- Define primary key
  CONSTRAINT "github_pull_request_comments_pkey" PRIMARY KEY ("id"),

  -- Define unique constraint on github_pull_request_id for 1:1 relationship
  CONSTRAINT "github_pull_request_comments_github_pull_request_id_key" UNIQUE ("github_pull_request_id"),

  -- Define unique constraint on github_comment_identifier
  CONSTRAINT "github_pull_request_comments_github_comment_identifier_key" UNIQUE ("github_comment_identifier"),

  -- Define foreign key relationship to github_pull_requests
  CONSTRAINT "github_pull_request_comments_github_pull_request_id_fkey"
    FOREIGN KEY ("github_pull_request_id")
    REFERENCES "public"."github_pull_requests"("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- Grant permissions on the new table
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "anon";
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."github_pull_request_comments" TO "service_role";

-- Step 2: Optionally migrate existing comment_id data to the new table
-- This will preserve any existing comment relationships
INSERT INTO "public"."github_pull_request_comments"
("github_pull_request_id", "github_comment_identifier", "updated_at")
SELECT
  "id",
  "comment_id",
  CURRENT_TIMESTAMP
FROM "public"."github_pull_requests"
WHERE "comment_id" IS NOT NULL;

-- Step 3: Finally, drop the comment_id column from github_pull_requests
-- This comment explains the potentially destructive operation
-- Note: This is a destructive operation, but we've migrated the data in step 2
ALTER TABLE "public"."github_pull_requests"
DROP COLUMN "comment_id";

COMMIT;
