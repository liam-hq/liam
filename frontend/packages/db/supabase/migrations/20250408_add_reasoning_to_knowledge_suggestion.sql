-- Add reasoning field to KnowledgeSuggestion table with a default value
ALTER TABLE "public"."KnowledgeSuggestion"
ADD COLUMN "reasoning" TEXT DEFAULT '';
