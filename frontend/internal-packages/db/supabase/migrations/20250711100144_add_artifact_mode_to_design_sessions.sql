ALTER TABLE "public"."design_sessions" 
ADD COLUMN "artifact_mode" text DEFAULT 'full' CHECK (artifact_mode IN ('simple', 'full'));
