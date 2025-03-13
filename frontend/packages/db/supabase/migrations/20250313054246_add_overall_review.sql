create sequence "public"."OverallReview_id_seq";

revoke delete on table "public"."Migration" from "anon";

revoke insert on table "public"."Migration" from "anon";

revoke references on table "public"."Migration" from "anon";

revoke select on table "public"."Migration" from "anon";

revoke trigger on table "public"."Migration" from "anon";

revoke truncate on table "public"."Migration" from "anon";

revoke update on table "public"."Migration" from "anon";

revoke delete on table "public"."Migration" from "authenticated";

revoke insert on table "public"."Migration" from "authenticated";

revoke references on table "public"."Migration" from "authenticated";

revoke select on table "public"."Migration" from "authenticated";

revoke trigger on table "public"."Migration" from "authenticated";

revoke truncate on table "public"."Migration" from "authenticated";

revoke update on table "public"."Migration" from "authenticated";

revoke delete on table "public"."Migration" from "service_role";

revoke insert on table "public"."Migration" from "service_role";

revoke references on table "public"."Migration" from "service_role";

revoke select on table "public"."Migration" from "service_role";

revoke trigger on table "public"."Migration" from "service_role";

revoke truncate on table "public"."Migration" from "service_role";

revoke update on table "public"."Migration" from "service_role";

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

revoke delete on table "public"."PullRequest" from "anon";

revoke insert on table "public"."PullRequest" from "anon";

revoke references on table "public"."PullRequest" from "anon";

revoke select on table "public"."PullRequest" from "anon";

revoke trigger on table "public"."PullRequest" from "anon";

revoke truncate on table "public"."PullRequest" from "anon";

revoke update on table "public"."PullRequest" from "anon";

revoke delete on table "public"."PullRequest" from "authenticated";

revoke insert on table "public"."PullRequest" from "authenticated";

revoke references on table "public"."PullRequest" from "authenticated";

revoke select on table "public"."PullRequest" from "authenticated";

revoke trigger on table "public"."PullRequest" from "authenticated";

revoke truncate on table "public"."PullRequest" from "authenticated";

revoke update on table "public"."PullRequest" from "authenticated";

revoke delete on table "public"."PullRequest" from "service_role";

revoke insert on table "public"."PullRequest" from "service_role";

revoke references on table "public"."PullRequest" from "service_role";

revoke select on table "public"."PullRequest" from "service_role";

revoke trigger on table "public"."PullRequest" from "service_role";

revoke truncate on table "public"."PullRequest" from "service_role";

revoke update on table "public"."PullRequest" from "service_role";

revoke delete on table "public"."Repository" from "anon";

revoke insert on table "public"."Repository" from "anon";

revoke references on table "public"."Repository" from "anon";

revoke select on table "public"."Repository" from "anon";

revoke trigger on table "public"."Repository" from "anon";

revoke truncate on table "public"."Repository" from "anon";

revoke update on table "public"."Repository" from "anon";

revoke delete on table "public"."Repository" from "authenticated";

revoke insert on table "public"."Repository" from "authenticated";

revoke references on table "public"."Repository" from "authenticated";

revoke select on table "public"."Repository" from "authenticated";

revoke trigger on table "public"."Repository" from "authenticated";

revoke truncate on table "public"."Repository" from "authenticated";

revoke update on table "public"."Repository" from "authenticated";

revoke delete on table "public"."Repository" from "service_role";

revoke insert on table "public"."Repository" from "service_role";

revoke references on table "public"."Repository" from "service_role";

revoke select on table "public"."Repository" from "service_role";

revoke trigger on table "public"."Repository" from "service_role";

revoke truncate on table "public"."Repository" from "service_role";

revoke update on table "public"."Repository" from "service_role";

revoke delete on table "public"."_prisma_migrations" from "anon";

revoke insert on table "public"."_prisma_migrations" from "anon";

revoke references on table "public"."_prisma_migrations" from "anon";

revoke select on table "public"."_prisma_migrations" from "anon";

revoke trigger on table "public"."_prisma_migrations" from "anon";

revoke truncate on table "public"."_prisma_migrations" from "anon";

revoke update on table "public"."_prisma_migrations" from "anon";

revoke delete on table "public"."_prisma_migrations" from "authenticated";

revoke insert on table "public"."_prisma_migrations" from "authenticated";

revoke references on table "public"."_prisma_migrations" from "authenticated";

revoke select on table "public"."_prisma_migrations" from "authenticated";

revoke trigger on table "public"."_prisma_migrations" from "authenticated";

revoke truncate on table "public"."_prisma_migrations" from "authenticated";

revoke update on table "public"."_prisma_migrations" from "authenticated";

revoke delete on table "public"."_prisma_migrations" from "service_role";

revoke insert on table "public"."_prisma_migrations" from "service_role";

revoke references on table "public"."_prisma_migrations" from "service_role";

revoke select on table "public"."_prisma_migrations" from "service_role";

revoke trigger on table "public"."_prisma_migrations" from "service_role";

revoke truncate on table "public"."_prisma_migrations" from "service_role";

revoke update on table "public"."_prisma_migrations" from "service_role";

create table "public"."OverallReview" (
    "id" integer not null default nextval('"OverallReview_id_seq"'::regclass),
    "projectId" integer not null,
    "pullRequestId" integer not null,
    "reviewComment" text,
    "reviewedAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


alter sequence "public"."OverallReview_id_seq" owned by "public"."OverallReview"."id";

CREATE UNIQUE INDEX "OverallReview_pkey" ON public."OverallReview" USING btree (id);

alter table "public"."OverallReview" add constraint "OverallReview_pkey" PRIMARY KEY using index "OverallReview_pkey";

alter table "public"."OverallReview" add constraint "OverallReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."OverallReview" validate constraint "OverallReview_projectId_fkey";

alter table "public"."OverallReview" add constraint "OverallReview_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."OverallReview" validate constraint "OverallReview_pullRequestId_fkey";


