create sequence "public"."SchemaMeta_id_seq";

create table "public"."SchemaMeta" (
    "id" integer not null default nextval('"SchemaMeta_id_seq"'::regclass),
    "projectId" integer not null,
    "content" jsonb not null default '{}'::jsonb
);


alter sequence "public"."SchemaMeta_id_seq" owned by "public"."SchemaMeta"."id";

CREATE UNIQUE INDEX "SchemaMeta_pkey" ON public."SchemaMeta" USING btree (id);

CREATE UNIQUE INDEX "SchemaMeta_projectId_key" ON public."SchemaMeta" USING btree ("projectId");

alter table "public"."SchemaMeta" add constraint "SchemaMeta_pkey" PRIMARY KEY using index "SchemaMeta_pkey";

alter table "public"."SchemaMeta" add constraint "SchemaMeta_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."SchemaMeta" validate constraint "SchemaMeta_projectId_fkey";


