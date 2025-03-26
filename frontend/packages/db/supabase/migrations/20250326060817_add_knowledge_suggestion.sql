create type "public"."KnowledgeType" as enum ('SCHEMA', 'DOCS');

create sequence "public"."KnowledgeSuggestion_id_seq";

revoke delete on table "public"."Project" from "anon";

revoke insert on table "public"."Project" from "anon";

revoke references on table "public"."Project" from "anon";

revoke select on table "public"."Project" from "anon";

revoke trigger on table "public"."Project" from "anon";

revoke truncate on table "public"."Project" from "anon";

revoke update on table "public"."Project" from "anon";

revoke delete on table "public"."Project" from "authenticated";

revoke insert on table "public"."Project" from "authenticated";

revoke references on table "public"."Project" from "authenticated";

revoke select on table "public"."Project" from "authenticated";

revoke trigger on table "public"."Project" from "authenticated";

revoke truncate on table "public"."Project" from "authenticated";

revoke update on table "public"."Project" from "authenticated";

revoke delete on table "public"."Project" from "service_role";

revoke insert on table "public"."Project" from "service_role";

revoke references on table "public"."Project" from "service_role";

revoke select on table "public"."Project" from "service_role";

revoke trigger on table "public"."Project" from "service_role";

revoke truncate on table "public"."Project" from "service_role";

revoke update on table "public"."Project" from "service_role";

create table "public"."KnowledgeSuggestion" (
    "id" integer not null default nextval('"KnowledgeSuggestion_id_seq"'::regclass),
    "type" "KnowledgeType" not null,
    "title" text not null,
    "path" text not null,
    "content" text not null,
    "fileSha" text not null,
    "projectId" integer not null,
    "overallReviewId" integer,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


alter sequence "public"."KnowledgeSuggestion_id_seq" owned by "public"."KnowledgeSuggestion"."id";

CREATE UNIQUE INDEX "KnowledgeSuggestion_pkey" ON public."KnowledgeSuggestion" USING btree (id);

alter table "public"."KnowledgeSuggestion" add constraint "KnowledgeSuggestion_pkey" PRIMARY KEY using index "KnowledgeSuggestion_pkey";

alter table "public"."KnowledgeSuggestion" add constraint "KnowledgeSuggestion_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "OverallReview"(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."KnowledgeSuggestion" validate constraint "KnowledgeSuggestion_overallReviewId_fkey";

alter table "public"."KnowledgeSuggestion" add constraint "KnowledgeSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."KnowledgeSuggestion" validate constraint "KnowledgeSuggestion_projectId_fkey";


