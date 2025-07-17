-- Make patch and reverse_patch columns nullable in building_schema_versions table
ALTER TABLE "public"."building_schema_versions" 
ALTER COLUMN "patch" DROP NOT NULL,
ALTER COLUMN "reverse_patch" DROP NOT NULL;