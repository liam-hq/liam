create sequence "public"."Migration_id_seq";

create sequence "public"."Project_id_seq";

create sequence "public"."PullRequest_id_seq";

create sequence "public"."Repository_id_seq";

create table "public"."Migration" (
    "id" integer not null default nextval('"Migration_id_seq"'::regclass),
    "title" text not null,
    "projectId" integer not null,
    "pullRequestId" integer not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


create table "public"."Project" (
    "id" integer not null default nextval('"Project_id_seq"'::regclass),
    "name" text not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


create table "public"."PullRequest" (
    "id" integer not null default nextval('"PullRequest_id_seq"'::regclass),
    "pullNumber" bigint not null,
    "commentId" bigint,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null,
    "repositoryId" integer not null
);


create table "public"."Repository" (
    "id" integer not null default nextval('"Repository_id_seq"'::regclass),
    "name" text not null,
    "owner" text not null,
    "installationId" bigint not null,
    "isActive" boolean not null default true,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


create table "public"."_prisma_migrations" (
    "id" character varying(36) not null,
    "checksum" character varying(64) not null,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) not null,
    "logs" text,
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone not null default now(),
    "applied_steps_count" integer not null default 0
);


alter sequence "public"."Migration_id_seq" owned by "public"."Migration"."id";

alter sequence "public"."Project_id_seq" owned by "public"."Project"."id";

alter sequence "public"."PullRequest_id_seq" owned by "public"."PullRequest"."id";

alter sequence "public"."Repository_id_seq" owned by "public"."Repository"."id";

CREATE UNIQUE INDEX "Migration_pkey" ON public."Migration" USING btree (id);

CREATE UNIQUE INDEX "Migration_pullRequestId_key" ON public."Migration" USING btree ("pullRequestId");

CREATE UNIQUE INDEX "Project_pkey" ON public."Project" USING btree (id);

CREATE UNIQUE INDEX "PullRequest_pkey" ON public."PullRequest" USING btree (id);

CREATE UNIQUE INDEX "PullRequest_repositoryId_pullNumber_key" ON public."PullRequest" USING btree ("repositoryId", "pullNumber");

CREATE UNIQUE INDEX "Repository_owner_name_key" ON public."Repository" USING btree (owner, name);

CREATE UNIQUE INDEX "Repository_pkey" ON public."Repository" USING btree (id);

CREATE UNIQUE INDEX _prisma_migrations_pkey ON public._prisma_migrations USING btree (id);

alter table "public"."Migration" add constraint "Migration_pkey" PRIMARY KEY using index "Migration_pkey";

alter table "public"."Project" add constraint "Project_pkey" PRIMARY KEY using index "Project_pkey";

alter table "public"."PullRequest" add constraint "PullRequest_pkey" PRIMARY KEY using index "PullRequest_pkey";

alter table "public"."Repository" add constraint "Repository_pkey" PRIMARY KEY using index "Repository_pkey";

alter table "public"."_prisma_migrations" add constraint "_prisma_migrations_pkey" PRIMARY KEY using index "_prisma_migrations_pkey";

alter table "public"."Migration" add constraint "Migration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."Migration" validate constraint "Migration_projectId_fkey";

alter table "public"."Migration" add constraint "Migration_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."Migration" validate constraint "Migration_pullRequestId_fkey";

alter table "public"."PullRequest" add constraint "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"(id) ON UPDATE CASCADE ON DELETE RESTRICT not valid;

alter table "public"."PullRequest" validate constraint "PullRequest_repositoryId_fkey";


