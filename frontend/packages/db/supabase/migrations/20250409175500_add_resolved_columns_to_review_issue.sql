-- Add resolvedAt and resolutionComment columns to ReviewIssue table
BEGIN;

-- Add resolvedAt column and resolutionComment to ReviewIssue table
ALTER TABLE "public"."ReviewIssue"
  ADD COLUMN "resolvedAt" timestamp(3) without time zone,
  ADD COLUMN "resolutionComment" text;

COMMIT;
