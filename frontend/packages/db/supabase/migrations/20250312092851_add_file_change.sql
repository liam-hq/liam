create sequence "public"."FileChange_id_seq";

create table "public"."FileChange" (
    "id" integer not null default nextval('"FileChange_id_seq"'::regclass),
    "pullRequestId" integer not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


alter sequence "public"."FileChange_id_seq" owned by "public"."FileChange"."id";

CREATE UNIQUE INDEX "FileChange_pkey" ON public."FileChange" USING btree (id);

alter table "public"."FileChange" add constraint "FileChange_pkey" PRIMARY KEY using index "FileChange_pkey";

alter table "public"."FileChange" add constraint "FileChange_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."FileChange" validate constraint "FileChange_pullRequestId_fkey";


