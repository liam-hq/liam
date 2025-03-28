alter table "public"."Doc" drop constraint "Doc_projectId_fkey";

alter table "public"."DocVersion" drop constraint "DocVersion_docId_fkey";

alter table "public"."Doc" drop constraint "Doc_pkey";

alter table "public"."DocVersion" drop constraint "DocVersion_pkey";

drop index if exists "public"."DocVersion_docId_version_key";

drop index if exists "public"."DocVersion_pkey";

drop index if exists "public"."Doc_pkey";

drop table "public"."Doc";

drop table "public"."DocVersion";

drop sequence if exists "public"."DocVersion_id_seq";

drop sequence if exists "public"."Doc_id_seq";
