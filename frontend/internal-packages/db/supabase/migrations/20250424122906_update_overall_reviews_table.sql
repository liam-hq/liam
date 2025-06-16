
BEGIN;

ALTER TABLE "public"."overall_reviews"
  ADD COLUMN "migration_id" "uuid";

UPDATE "public"."overall_reviews" o
SET "migration_id" = (
  SELECT m.id
  FROM "public"."migrations" m
  JOIN "public"."migration_pull_request_mappings" mpr ON m.id = mpr.migration_id
  WHERE mpr.pull_request_id = o.pull_request_id
  LIMIT 1
);

DELETE FROM "public"."overall_reviews" WHERE "migration_id" IS NULL;

ALTER TABLE "public"."overall_reviews"
  ALTER COLUMN "migration_id" SET NOT NULL;

ALTER TABLE "public"."overall_reviews"
  ADD CONSTRAINT "overall_review_migration_id_fkey"
  FOREIGN KEY ("migration_id") REFERENCES "public"."migrations"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "public"."overall_reviews"
  DROP CONSTRAINT IF EXISTS "overall_review_pull_request_id_fkey";

ALTER TABLE "public"."overall_reviews"
  DROP COLUMN "pull_request_id";

ALTER TABLE "public"."overall_reviews"
  DROP COLUMN "project_id";

COMMIT;
