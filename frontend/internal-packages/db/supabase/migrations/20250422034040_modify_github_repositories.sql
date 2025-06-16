BEGIN;

-- Rename installation_id to github_installation_identifier
ALTER TABLE "public"."github_repositories"
RENAME COLUMN "installation_id" TO "github_installation_identifier";

-- Add github_repository_identifier column
ALTER TABLE "public"."github_repositories"
ADD COLUMN "github_repository_identifier" integer NOT NULL;

-- Add organization_id column with foreign key constraint
ALTER TABLE "public"."github_repositories"
ADD COLUMN "organization_id" uuid REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Update existing repositories to set organization_id from linked projects
UPDATE "public"."github_repositories" gr
SET "organization_id" = (
  SELECT p."organization_id"
  FROM "public"."projects" p
  JOIN "public"."project_repository_mappings" prm ON p."id" = prm."project_id"
  WHERE prm."repository_id" = gr."id"
  LIMIT 1
);

-- Now make the column NOT NULL
ALTER TABLE "public"."github_repositories"
ALTER COLUMN "organization_id" SET NOT NULL;

-- Remove is_active column
ALTER TABLE "public"."github_repositories"
DROP COLUMN "is_active";

-- Add composite unique constraint
ALTER TABLE "public"."github_repositories"
ADD CONSTRAINT "github_repository_github_repository_identifier_organization_id_key"
UNIQUE ("github_repository_identifier", "organization_id");

COMMIT;
