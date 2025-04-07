BEGIN;

-- Create the new GitHubSchemaFilePath table
create sequence "public"."GitHubSchemaFilePath_id_seq";

create table "public"."GitHubSchemaFilePath" (
    "id" integer not null default nextval('"GitHubSchemaFilePath_id_seq"'::regclass),
    "path" text not null,
    "projectId" integer not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);

alter sequence "public"."GitHubSchemaFilePath_id_seq" owned by "public"."GitHubSchemaFilePath"."id";

-- Create indexes
CREATE UNIQUE INDEX "GitHubSchemaFilePath_pkey" ON public."GitHubSchemaFilePath" USING btree (id);
CREATE UNIQUE INDEX "GitHubSchemaFilePath_path_projectId_key" ON public."GitHubSchemaFilePath" USING btree (path, "projectId");

-- Add constraints
alter table "public"."GitHubSchemaFilePath" add constraint "GitHubSchemaFilePath_pkey" PRIMARY KEY using index "GitHubSchemaFilePath_pkey";
alter table "public"."GitHubSchemaFilePath" add constraint "GitHubSchemaFilePath_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;
alter table "public"."GitHubSchemaFilePath" validate constraint "GitHubSchemaFilePath_projectId_fkey";
alter table "public"."GitHubSchemaFilePath" add constraint "GitHubSchemaFilePath_path_projectId_key" UNIQUE using index "GitHubSchemaFilePath_path_projectId_key";

-- Copy data from WatchSchemaFilePattern to GitHubSchemaFilePath
INSERT INTO "public"."GitHubSchemaFilePath" ("path", "projectId", "createdAt", "updatedAt")
SELECT "pattern", "projectId", "createdAt", "updatedAt"
FROM "public"."WatchSchemaFilePattern";

-- Drop the old WatchSchemaFilePattern table
DROP TABLE "public"."WatchSchemaFilePattern";

COMMIT;
