BEGIN;

-- Add new columns to existing tables
ALTER TABLE "public"."Project" 
  ADD COLUMN IF NOT EXISTS "organizationId" integer;

-- Create new tables
CREATE TABLE IF NOT EXISTS "public"."User" (
  "id" uuid PRIMARY KEY,
  "name" text NOT NULL,
  "email" text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."Organization" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "name" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."OrganizationMember" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" uuid NOT NULL REFERENCES "public"."User"("id") ON DELETE CASCADE,
  "organizationId" integer NOT NULL REFERENCES "public"."Organization"("id") ON DELETE CASCADE,
  "joinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "organizationId")
);

CREATE TABLE IF NOT EXISTS "public"."MembershipInvites" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "email" text NOT NULL,
  "inviteByUserId" uuid NOT NULL REFERENCES "public"."User"("id") ON DELETE CASCADE,
  "organizationId" integer NOT NULL REFERENCES "public"."Organization"("id") ON DELETE CASCADE,
  "invitedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "organization_member_userId_idx" ON "public"."OrganizationMember" ("userId");
CREATE INDEX IF NOT EXISTS "organization_member_organizationId_idx" ON "public"."OrganizationMember" ("organizationId");
CREATE INDEX IF NOT EXISTS "membership_invites_email_idx" ON "public"."MembershipInvites" ("email");
CREATE INDEX IF NOT EXISTS "membership_invites_orgId_idx" ON "public"."MembershipInvites" ("organizationId");


-- Grant permissions
GRANT ALL ON TABLE "public"."User" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."Organization" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."OrganizationMember" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."MembershipInvites" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."Project" TO "anon", "authenticated", "service_role";

COMMIT;
