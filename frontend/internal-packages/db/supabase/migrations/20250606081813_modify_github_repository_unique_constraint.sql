
BEGIN;

DROP INDEX IF EXISTS "public"."github_repository_owner_name_key";

CREATE UNIQUE INDEX "github_repository_owner_name_organization_id_key" 
  ON "public"."github_repositories" 
  USING btree ("owner", "name", "organization_id");

COMMIT;
