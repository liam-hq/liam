create sequence "public"."TestTable_id_seq";

revoke delete on table "public"."OverallReview" from "anon";

revoke insert on table "public"."OverallReview" from "anon";

revoke references on table "public"."OverallReview" from "anon";

revoke select on table "public"."OverallReview" from "anon";

revoke trigger on table "public"."OverallReview" from "anon";

revoke truncate on table "public"."OverallReview" from "anon";

revoke update on table "public"."OverallReview" from "anon";

revoke delete on table "public"."OverallReview" from "authenticated";

revoke insert on table "public"."OverallReview" from "authenticated";

revoke references on table "public"."OverallReview" from "authenticated";

revoke select on table "public"."OverallReview" from "authenticated";

revoke trigger on table "public"."OverallReview" from "authenticated";

revoke truncate on table "public"."OverallReview" from "authenticated";

revoke update on table "public"."OverallReview" from "authenticated";

revoke delete on table "public"."OverallReview" from "service_role";

revoke insert on table "public"."OverallReview" from "service_role";

revoke references on table "public"."OverallReview" from "service_role";

revoke select on table "public"."OverallReview" from "service_role";

revoke trigger on table "public"."OverallReview" from "service_role";

revoke truncate on table "public"."OverallReview" from "service_role";

revoke update on table "public"."OverallReview" from "service_role";

create table "public"."TestTable" (
    "id" integer not null default nextval('"TestTable_id_seq"'::regclass),
    "name" text not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


alter sequence "public"."TestTable_id_seq" owned by "public"."TestTable"."id";

CREATE UNIQUE INDEX "TestTable_pkey" ON public."TestTable" USING btree (id);

alter table "public"."TestTable" add constraint "TestTable_pkey" PRIMARY KEY using index "TestTable_pkey";


