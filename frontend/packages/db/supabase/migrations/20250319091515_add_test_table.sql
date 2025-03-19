create sequence "public"."TestTable_id_seq";

revoke delete on table "public"."WatchSchemaFilePattern" from "anon";

revoke insert on table "public"."WatchSchemaFilePattern" from "anon";

revoke references on table "public"."WatchSchemaFilePattern" from "anon";

revoke select on table "public"."WatchSchemaFilePattern" from "anon";

revoke trigger on table "public"."WatchSchemaFilePattern" from "anon";

revoke truncate on table "public"."WatchSchemaFilePattern" from "anon";

revoke update on table "public"."WatchSchemaFilePattern" from "anon";

revoke delete on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke insert on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke references on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke select on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke trigger on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke truncate on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke update on table "public"."WatchSchemaFilePattern" from "authenticated";

revoke delete on table "public"."WatchSchemaFilePattern" from "service_role";

revoke insert on table "public"."WatchSchemaFilePattern" from "service_role";

revoke references on table "public"."WatchSchemaFilePattern" from "service_role";

revoke select on table "public"."WatchSchemaFilePattern" from "service_role";

revoke trigger on table "public"."WatchSchemaFilePattern" from "service_role";

revoke truncate on table "public"."WatchSchemaFilePattern" from "service_role";

revoke update on table "public"."WatchSchemaFilePattern" from "service_role";

alter table "public"."OverallReview" drop constraint "OverallReview_projectId_fkey";

create table "public"."TestTable" (
    "id" integer not null default nextval('"TestTable_id_seq"'::regclass),
    "name" text not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


alter table "public"."OverallReview" alter column "projectId" drop not null;

alter sequence "public"."TestTable_id_seq" owned by "public"."TestTable"."id";

CREATE UNIQUE INDEX "TestTable_pkey" ON public."TestTable" USING btree (id);

alter table "public"."TestTable" add constraint "TestTable_pkey" PRIMARY KEY using index "TestTable_pkey";

alter table "public"."OverallReview" add constraint "OverallReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."OverallReview" validate constraint "OverallReview_projectId_fkey";


