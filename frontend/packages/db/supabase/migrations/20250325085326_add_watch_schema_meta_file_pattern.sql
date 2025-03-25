create sequence "public"."WatchSchemaMetaFilePattern_id_seq";

create table "public"."WatchSchemaMetaFilePattern" (
    "id" integer not null default nextval('"WatchSchemaMetaFilePattern_id_seq"'::regclass),
    "pattern" text not null,
    "projectId" integer not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


alter sequence "public"."WatchSchemaMetaFilePattern_id_seq" owned by "public"."WatchSchemaMetaFilePattern"."id";

CREATE UNIQUE INDEX "WatchSchemaMetaFilePattern_pkey" ON public."WatchSchemaMetaFilePattern" USING btree (id);

alter table "public"."WatchSchemaMetaFilePattern" add constraint "WatchSchemaMetaFilePattern_pkey" PRIMARY KEY using index "WatchSchemaMetaFilePattern_pkey";

alter table "public"."WatchSchemaMetaFilePattern" add constraint "WatchSchemaMetaFilePattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."WatchSchemaMetaFilePattern" validate constraint "WatchSchemaMetaFilePattern_projectId_fkey";


