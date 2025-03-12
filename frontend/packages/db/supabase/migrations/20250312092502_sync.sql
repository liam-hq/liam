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

alter table "public"."PullRequest" drop constraint "PullRequest_repositoryId_fkey";

alter table "public"."Repository" drop constraint "Repository_pkey";

drop index if exists "public"."PullRequest_repositoryId_pullNumber_key";

drop index if exists "public"."Repository_owner_name_key";

drop index if exists "public"."Repository_pkey";

drop table "public"."Repository";

alter table "public"."PullRequest" drop column "repositoryId";

alter table "public"."PullRequest" add column "installationId" bigint not null;

alter table "public"."PullRequest" add column "repositoryName" text not null;

alter table "public"."PullRequest" add column "repositoryOwner" text not null;

drop sequence if exists "public"."Repository_id_seq";

CREATE UNIQUE INDEX "PullRequest_repositoryOwner_repositoryName_pullNumber_key" ON public."PullRequest" USING btree ("repositoryOwner", "repositoryName", "pullNumber");


