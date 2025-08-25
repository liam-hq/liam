-- Migration: Add checkpoint tables for LangGraph workflow persistence
-- Purpose: Create tables to store checkpoint data for session resumption
-- Affected tables: checkpoints, checkpoint_blobs, checkpoint_writes, checkpoint_migrations
-- Special considerations: All tables include organization_id for multi-tenant data isolation

BEGIN;

-- Create checkpoints table for main checkpoint metadata
-- This table stores the core checkpoint information including thread ID, namespace, and parent relationships
CREATE TABLE IF NOT EXISTS "public"."checkpoints" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" text NOT NULL,
  "checkpoint_ns" text NOT NULL DEFAULT '',
  "checkpoint_id" text NOT NULL,
  "parent_checkpoint_id" text,
  "checkpoint" jsonb NOT NULL, -- Stores serialized checkpoint data (v, id, ts, channel_versions, versions_seen)
  "metadata" jsonb NOT NULL DEFAULT '{}', -- Custom metadata attached to checkpoints
  "organization_id" uuid NOT NULL, -- Organization isolation for multi-tenancy
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("thread_id", "checkpoint_ns", "checkpoint_id", "organization_id")
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_checkpoints_organization_id" 
  ON "public"."checkpoints" ("organization_id");

CREATE INDEX IF NOT EXISTS "idx_checkpoints_thread_id" 
  ON "public"."checkpoints" ("thread_id", "checkpoint_ns");

CREATE INDEX IF NOT EXISTS "idx_checkpoints_parent" 
  ON "public"."checkpoints" ("parent_checkpoint_id") 
  WHERE "parent_checkpoint_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_checkpoints_created_at" 
  ON "public"."checkpoints" ("created_at" DESC);

-- Add comment for table documentation
COMMENT ON TABLE "public"."checkpoints" IS 'Stores LangGraph checkpoint metadata for workflow state persistence';
COMMENT ON COLUMN "public"."checkpoints"."thread_id" IS 'Unique identifier for the workflow thread';
COMMENT ON COLUMN "public"."checkpoints"."checkpoint_ns" IS 'Namespace for checkpoint isolation within a thread';
COMMENT ON COLUMN "public"."checkpoints"."checkpoint_id" IS 'Unique identifier for this checkpoint';
COMMENT ON COLUMN "public"."checkpoints"."parent_checkpoint_id" IS 'Reference to parent checkpoint for version history';
COMMENT ON COLUMN "public"."checkpoints"."checkpoint" IS 'Serialized checkpoint data including versions and metadata';
COMMENT ON COLUMN "public"."checkpoints"."metadata" IS 'Custom metadata attached to the checkpoint';
COMMENT ON COLUMN "public"."checkpoints"."organization_id" IS 'Organization ID for multi-tenant isolation';

-- Create checkpoint_blobs table for channel value storage
-- This table stores the actual channel values (state data) for each checkpoint
CREATE TABLE IF NOT EXISTS "public"."checkpoint_blobs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" text NOT NULL,
  "checkpoint_ns" text NOT NULL DEFAULT '',
  "channel" text NOT NULL, -- Channel name (e.g., 'messages', 'state')
  "version" text NOT NULL, -- Version number for this channel value
  "type" text NOT NULL, -- Serialization type (e.g., 'array', 'object', 'string', 'empty')
  "blob" bytea, -- Binary data (NULL for empty type)
  "organization_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("thread_id", "checkpoint_ns", "channel", "version", "organization_id")
);

-- Add indexes for blob queries
CREATE INDEX IF NOT EXISTS "idx_checkpoint_blobs_organization_id" 
  ON "public"."checkpoint_blobs" ("organization_id");

CREATE INDEX IF NOT EXISTS "idx_checkpoint_blobs_thread_id" 
  ON "public"."checkpoint_blobs" ("thread_id", "checkpoint_ns");

-- Add comments for blob table
COMMENT ON TABLE "public"."checkpoint_blobs" IS 'Stores channel values (state data) for checkpoints';
COMMENT ON COLUMN "public"."checkpoint_blobs"."channel" IS 'Name of the channel containing state data';
COMMENT ON COLUMN "public"."checkpoint_blobs"."version" IS 'Version number for channel value tracking';
COMMENT ON COLUMN "public"."checkpoint_blobs"."type" IS 'Type hint for deserialization';
COMMENT ON COLUMN "public"."checkpoint_blobs"."blob" IS 'Binary serialized data';

-- Create checkpoint_writes table for pending operations
-- This table stores intermediate writes that haven't been committed to a checkpoint yet
CREATE TABLE IF NOT EXISTS "public"."checkpoint_writes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" text NOT NULL,
  "checkpoint_ns" text NOT NULL DEFAULT '',
  "checkpoint_id" text NOT NULL,
  "task_id" text NOT NULL, -- Task that generated this write
  "idx" integer NOT NULL, -- Index for ordering writes within a task
  "channel" text NOT NULL, -- Target channel for the write
  "type" text, -- Serialization type
  "blob" bytea NOT NULL, -- Binary write data
  "organization_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("thread_id", "checkpoint_ns", "checkpoint_id", "task_id", "idx", "organization_id")
);

-- Add indexes for write queries
CREATE INDEX IF NOT EXISTS "idx_checkpoint_writes_organization_id" 
  ON "public"."checkpoint_writes" ("organization_id");

CREATE INDEX IF NOT EXISTS "idx_checkpoint_writes_checkpoint" 
  ON "public"."checkpoint_writes" ("thread_id", "checkpoint_ns", "checkpoint_id");

CREATE INDEX IF NOT EXISTS "idx_checkpoint_writes_task" 
  ON "public"."checkpoint_writes" ("task_id");

-- Add comments for writes table
COMMENT ON TABLE "public"."checkpoint_writes" IS 'Stores pending write operations for checkpoints';
COMMENT ON COLUMN "public"."checkpoint_writes"."task_id" IS 'Identifier of the task that generated this write';
COMMENT ON COLUMN "public"."checkpoint_writes"."idx" IS 'Index for ordering multiple writes from the same task';
COMMENT ON COLUMN "public"."checkpoint_writes"."channel" IS 'Target channel for the write operation';

-- Create checkpoint_migrations table for schema versioning
-- This table tracks which migrations have been applied for checkpoint system
CREATE TABLE IF NOT EXISTS "public"."checkpoint_migrations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "v" integer NOT NULL, -- Migration version number
  "organization_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("v", "organization_id")
);

-- Add index for migration queries
CREATE INDEX IF NOT EXISTS "idx_checkpoint_migrations_organization_id" 
  ON "public"."checkpoint_migrations" ("organization_id");

-- Add comment for migrations table
COMMENT ON TABLE "public"."checkpoint_migrations" IS 'Tracks applied checkpoint system migrations';
COMMENT ON COLUMN "public"."checkpoint_migrations"."v" IS 'Migration version number';

-- Create update trigger for checkpoints updated_at
CREATE OR REPLACE FUNCTION "public"."update_checkpoints_updated_at"()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to checkpoints table
CREATE TRIGGER "update_checkpoints_updated_at_trigger"
  BEFORE UPDATE ON "public"."checkpoints"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."update_checkpoints_updated_at"();

-- Add foreign key constraints for organization_id
ALTER TABLE ONLY "public"."checkpoints"
  ADD CONSTRAINT "checkpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."checkpoint_blobs"
  ADD CONSTRAINT "checkpoint_blobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."checkpoint_writes"
  ADD CONSTRAINT "checkpoint_writes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE ONLY "public"."checkpoint_migrations"
  ADD CONSTRAINT "checkpoint_migrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Enable Row Level Security
ALTER TABLE "public"."checkpoints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."checkpoint_blobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."checkpoint_writes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."checkpoint_migrations" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checkpoints table
-- Authenticated users policies
CREATE POLICY "authenticated_users_can_select_org_checkpoints" 
  ON "public"."checkpoints" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_checkpoints" 
  ON "public"."checkpoints" 
  IS 'Authenticated users can only view checkpoints belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_checkpoints" 
  ON "public"."checkpoints" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoints" 
  ON "public"."checkpoints" 
  IS 'Authenticated users can only create checkpoints in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_checkpoints" 
  ON "public"."checkpoints" 
  FOR UPDATE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  ))) 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_checkpoints" 
  ON "public"."checkpoints" 
  IS 'Authenticated users can only update checkpoints in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_checkpoints" 
  ON "public"."checkpoints" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoints" 
  ON "public"."checkpoints" 
  IS 'Authenticated users can only delete checkpoints in organizations they are members of';

-- Service role policies for checkpoints
CREATE POLICY "service_role_can_select_all_checkpoints" 
  ON "public"."checkpoints" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_checkpoints" 
  ON "public"."checkpoints" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_checkpoints" 
  ON "public"."checkpoints" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_checkpoints" 
  ON "public"."checkpoints" 
  FOR DELETE TO "service_role" 
  USING (true);

-- RLS Policies for checkpoint_blobs table
-- Authenticated users policies
CREATE POLICY "authenticated_users_can_select_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  IS 'Authenticated users can only view checkpoint blobs belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  IS 'Authenticated users can only create checkpoint blobs in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR UPDATE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  ))) 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  IS 'Authenticated users can only update checkpoint blobs in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  IS 'Authenticated users can only delete checkpoint blobs in organizations they are members of';

-- Service role policies for checkpoint_blobs
CREATE POLICY "service_role_can_select_all_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_checkpoint_blobs" 
  ON "public"."checkpoint_blobs" 
  FOR DELETE TO "service_role" 
  USING (true);

-- RLS Policies for checkpoint_writes table
-- Authenticated users policies
CREATE POLICY "authenticated_users_can_select_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  IS 'Authenticated users can only view checkpoint writes belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  IS 'Authenticated users can only create checkpoint writes in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR UPDATE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  ))) 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  IS 'Authenticated users can only update checkpoint writes in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  IS 'Authenticated users can only delete checkpoint writes in organizations they are members of';

-- Service role policies for checkpoint_writes
CREATE POLICY "service_role_can_select_all_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_checkpoint_writes" 
  ON "public"."checkpoint_writes" 
  FOR DELETE TO "service_role" 
  USING (true);

-- RLS Policies for checkpoint_migrations table
-- Authenticated users policies
CREATE POLICY "authenticated_users_can_select_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR SELECT TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_select_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  IS 'Authenticated users can only view checkpoint migrations belonging to organizations they are members of';

CREATE POLICY "authenticated_users_can_insert_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR INSERT TO "authenticated" 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_insert_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  IS 'Authenticated users can only create checkpoint migrations in organizations they are members of';

CREATE POLICY "authenticated_users_can_update_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR UPDATE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  ))) 
  WITH CHECK (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_update_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  IS 'Authenticated users can only update checkpoint migrations in organizations they are members of';

CREATE POLICY "authenticated_users_can_delete_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR DELETE TO "authenticated" 
  USING (("organization_id" IN ( 
    SELECT "organization_members"."organization_id"
    FROM "public"."organization_members"
    WHERE ("organization_members"."user_id" = "auth"."uid"())
  )));

COMMENT ON POLICY "authenticated_users_can_delete_org_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  IS 'Authenticated users can only delete checkpoint migrations in organizations they are members of';

-- Service role policies for checkpoint_migrations
CREATE POLICY "service_role_can_select_all_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR SELECT TO "service_role" 
  USING (true);

CREATE POLICY "service_role_can_insert_all_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR INSERT TO "service_role" 
  WITH CHECK (true);

CREATE POLICY "service_role_can_update_all_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR UPDATE TO "service_role" 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "service_role_can_delete_all_checkpoint_migrations" 
  ON "public"."checkpoint_migrations" 
  FOR DELETE TO "service_role" 
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."checkpoints" TO "anon";
GRANT ALL ON TABLE "public"."checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoints" TO "service_role";

GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "service_role";

GRANT ALL ON TABLE "public"."checkpoint_writes" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_writes" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_writes" TO "service_role";

GRANT ALL ON TABLE "public"."checkpoint_migrations" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_migrations" TO "service_role";

GRANT ALL ON FUNCTION "public"."update_checkpoints_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_checkpoints_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_checkpoints_updated_at"() TO "service_role";

COMMIT;