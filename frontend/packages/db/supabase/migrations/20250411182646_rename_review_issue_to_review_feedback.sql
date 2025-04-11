-- Rename ReviewIssue table to ReviewFeedback
BEGIN;

-- Rename the table
ALTER TABLE "public"."ReviewIssue" RENAME TO "ReviewFeedback";

-- Rename the sequence
ALTER SEQUENCE "public"."ReviewIssue_id_seq" RENAME TO "ReviewFeedback_id_seq";

-- Rename the primary key constraint
ALTER TABLE "public"."ReviewFeedback" RENAME CONSTRAINT "ReviewIssue_pkey" TO "ReviewFeedback_pkey";

-- Rename the foreign key constraint
ALTER TABLE "public"."ReviewFeedback" RENAME CONSTRAINT "ReviewIssue_overallReviewId_fkey" TO "ReviewFeedback_overallReviewId_fkey";

-- Update the foreign key constraint in ReviewSuggestionSnippet table
ALTER TABLE "public"."ReviewSuggestionSnippet" DROP CONSTRAINT "ReviewSuggestionSnippet_reviewIssueId_fkey";
ALTER TABLE "public"."ReviewSuggestionSnippet" RENAME COLUMN "reviewIssueId" TO "reviewFeedbackId";
ALTER TABLE "public"."ReviewSuggestionSnippet" ADD CONSTRAINT "ReviewSuggestionSnippet_reviewFeedbackId_fkey" 
  FOREIGN KEY ("reviewFeedbackId") REFERENCES "public"."ReviewFeedback"("id") 
  ON UPDATE CASCADE ON DELETE CASCADE;

COMMIT;
